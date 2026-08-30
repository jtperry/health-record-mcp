/**
 * Parses a C-CDA (Consolidated CDA R2.1) clinical document into the same
 * ClientFullEHR shape the SMART on FHIR retriever produces.
 *
 * This is deliberately a *producer* rather than a second ingestion path: everything
 * downstream — source labelling, upsert semantics, the attachment uniqueness index,
 * and the grep/query/eval tools — then works unchanged.
 *
 * The mapping is necessarily lossy (nested entryRelationship chains, negation
 * indicators and provenance detail have no clean R4 equivalent), so the caller is
 * expected to also retain the original document as an attachment. See
 * docs/multi-source-ingestion-plan.md §4.1.
 */
import { XMLParser } from 'fast-xml-parser';
import { createHash } from 'crypto';
import type { ClientFullEHR, ClientProcessedAttachment } from '../clientTypes';

// --- Terminology -----------------------------------------------------------

/** CDA carries OIDs; FHIR wants URIs. */
const CODE_SYSTEMS: Record<string, string> = {
    '2.16.840.1.113883.6.96': 'http://snomed.info/sct',
    '2.16.840.1.113883.6.1': 'http://loinc.org',
    '2.16.840.1.113883.6.88': 'http://www.nlm.nih.gov/research/umls/rxnorm',
    '2.16.840.1.113883.12.292': 'http://hl7.org/fhir/sid/cvx',
    '2.16.840.1.113883.6.103': 'http://hl7.org/fhir/sid/icd-9-cm',
    '2.16.840.1.113883.6.90': 'http://hl7.org/fhir/sid/icd-10-cm',
    '2.16.840.1.113883.6.4': 'http://www.cms.gov/Medicare/Coding/ICD10',
    '2.16.840.1.113883.5.83': 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
    '2.16.840.1.113883.6.12': 'http://www.ama-assn.org/go/cpt',
};

/** Section LOINC codes we know how to map. */
const SECTION = {
    PROBLEMS: '11450-4',
    MEDICATIONS: '10160-0',
    RESULTS: '30954-2',
    VITALS: '8716-3',
    IMMUNIZATIONS: '11369-6',
    ALLERGIES: '48765-2',
    PROCEDURES: '47519-4',
    ENCOUNTERS: '46240-8',
    SOCIAL_HISTORY: '29762-2',
    MENTAL_STATUS: '10190-7',
    NOTES: '34109-9',
    HEALTH_CONCERNS: '75310-3',
    PAYERS: '48768-6',
    FAMILY_HISTORY: '10157-6',
} as const;

// --- Small helpers ---------------------------------------------------------

/** fast-xml-parser yields an object for one child and an array for many. */
function arr<T>(x: T | T[] | undefined | null): T[] {
    if (x === undefined || x === null) return [];
    return Array.isArray(x) ? x : [x];
}

function attr(node: any, name: string): string | undefined {
    const v = node?.[`@_${name}`];
    return v === undefined || v === null ? undefined : String(v);
}

/**
 * CDA timestamps are YYYYMMDD[HHMMSS][±ZZZZ]; FHIR wants ISO 8601.
 * Precision is preserved rather than invented — a date-only value stays date-only.
 */
function cdaTime(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const m = /^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:\.\d+)?([+-]\d{4}|Z)?/.exec(value);
    if (!m) return undefined;
    const [, y, mo, d, h, mi, se, tz] = m;
    if (!mo) return y;
    if (!d) return `${y}-${mo}`;
    if (h === undefined) return `${y}-${mo}-${d}`;
    const offset = !tz ? '' : tz === 'Z' ? 'Z' : `${tz.slice(0, 3)}:${tz.slice(3)}`;
    return `${y}-${mo}-${d}T${h}:${mi ?? '00'}:${se ?? '00'}${offset}`;
}

function effTime(node: any): { start?: string; end?: string; value?: string } {
    const e = node?.effectiveTime;
    if (!e) return {};
    const single = attr(e, 'value');
    if (single) return { value: cdaTime(single) };
    return {
        start: cdaTime(attr(e.low, 'value')),
        end: cdaTime(attr(e.high, 'value')),
    };
}

/** CDA <code>/<value> element → FHIR CodeableConcept. */
function codeable(node: any): any | undefined {
    if (!node) return undefined;
    const coding: any[] = [];
    const push = (n: any) => {
        const code = attr(n, 'code');
        const sysOid = attr(n, 'codeSystem');
        if (!code) return;
        coding.push({
            ...(sysOid ? { system: CODE_SYSTEMS[sysOid] ?? `urn:oid:${sysOid}` } : {}),
            code,
            ...(attr(n, 'displayName') ? { display: attr(n, 'displayName') } : {}),
        });
    };
    push(node);
    for (const t of arr(node.translation)) push(t);
    // athenahealth emits lab tests as <code displayName="..." nullFlavor="NI"/> — no code
    // attribute at all. Without this fallback the test name is lost entirely and every
    // result collapses to an untitled Observation.
    const text = (typeof node['#text'] === 'string' ? node['#text'].trim() : undefined)
        || attr(node, 'displayName')
        || arr(node.translation).map((t: any) => attr(t, 'displayName')).find(Boolean);
    if (!coding.length && !text) return undefined;
    return { ...(coding.length ? { coding } : {}), ...(text ? { text } : {}) };
}

/**
 * CDA narrative bodies are XHTML-ish fragments (<content>, <paragraph>, <br/>, tables).
 * Flatten to readable plain text so the notes are legible and grep_record can search
 * them without markup noise.
 */
function narrativeToText(input: string): string {
    return input
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(paragraph|content|item|td|tr|title|caption)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        // Note bodies arrive double-escaped ("&amp;gt;"), so decode twice rather than
        // leaving a stray "&gt;" in text a human is meant to read.
        .replace(/&(?:amp;)*lt;/g, '<')
        .replace(/&(?:amp;)*gt;/g, '>')
        .replace(/&(?:amp;)*quot;/g, '"')
        .replace(/&(?:amp;)*#x?[0-9a-fA-F]+;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n\s*\n+/g, '\n\n')
        .split('\n').map(l => l.trim()).join('\n')
        .trim();
}

/** Best available human label for a coded element. */
function display(node: any): string | undefined {
    return attr(node, 'displayName')
        ?? arr(node?.translation).map((t: any) => attr(t, 'displayName')).find(Boolean)
        ?? (typeof node?.['#text'] === 'string' ? node['#text'].trim() : undefined);
}

function quantity(node: any): any | undefined {
    if (!node) return undefined;
    const value = attr(node, 'value');
    if (value === undefined || attr(node, 'nullFlavor')) return undefined;
    const num = Number(value);
    if (Number.isNaN(num)) return undefined;
    const unit = attr(node, 'unit');
    return { value: num, ...(unit ? { unit, system: 'http://unitsofmeasure.org', code: unit } : {}) };
}

/** Collect all text nodes beneath an element, for narrative extraction. */
function textOf(node: any): string {
    if (node === undefined || node === null) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join(' ');
    if (typeof node !== 'object') return '';
    return Object.entries(node)
        .filter(([k]) => !k.startsWith('@_'))
        .map(([, v]) => textOf(v))
        .join(' ');
}

// --- Identity --------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function digest(input: string): string {
    return createHash('sha256').update(input).digest('hex').slice(0, 24);
}

/**
 * Deterministic serialisation of a parsed node, **including attributes**.
 *
 * CDA carries nearly all of its data in attributes (code, codeSystem, value,
 * effectiveTime/@value), so a text-only digest collapses distinct clinical facts onto
 * one id — observed collapsing three different vital-sign panels into a single row.
 * Keys are sorted so the output does not depend on parser ordering.
 */
function canonical(node: any): string {
    if (node === null || node === undefined) return '';
    if (Array.isArray(node)) return node.map(canonical).join(',');
    if (typeof node !== 'object') {
        // Any UUID in the tree is regenerated on every export, so it must not reach the
        // digest. Observed: a note's representedOrganization/@root changed between two
        // exports of an otherwise byte-identical note, which was enough to re-key 41
        // resources and duplicate them on import.
        const str = String(node);
        return UUID_RE.test(str) ? '<uuid>' : str;
    }
    return Object.keys(node).sort().map(k => `${k}=${canonical(node[k])}`).join('|');
}

/**
 * Derives a resource id that is stable across exports of the same document.
 *
 * Measured against two athenahealth exports two weeks apart: every OID-rooted id was
 * byte-identical, while every UUID-rooted id had been regenerated. So OID-rooted ids
 * are used directly as identity, and anything else falls back to a hash of the
 * entry's clinical content — never the volatile UUID, which would create a fresh
 * duplicate on every import.
 */
function stableId(idNodes: any, fallbackContent: () => string): string {
    for (const id of arr(idNodes)) {
        const root = attr(id, 'root');
        const ext = attr(id, 'extension');
        if (root && ext && !UUID_RE.test(root)) return `ccda-${digest(`${root}|${ext}`)}`;
    }
    return `ccda-${digest(fallbackContent())}`;
}

// --- Parser ----------------------------------------------------------------

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    trimValues: true,
    parseAttributeValue: false,
    parseTagValue: false,
    textNodeName: '#text',
});

export interface CcdaParseResult extends ClientFullEHR {
    /** Sections seen in the document and how many entries each produced. */
    sectionSummary: { title: string; loinc: string; entries: number; mapped: number }[];
}

export function ccdaToEhr(
    xml: string,
    opts: { documentBytes?: Buffer; pdfBytes?: Buffer; pdfName?: string } = {}
): CcdaParseResult {
    const doc = parser.parse(xml)?.ClinicalDocument;
    if (!doc) throw new Error('Not a CDA ClinicalDocument (no <ClinicalDocument> root found)');

    const fhir: Record<string, any[]> = {};
    const attachments: ClientProcessedAttachment[] = [];
    const sectionSummary: CcdaParseResult['sectionSummary'] = [];

    const add = (resource: any) => {
        (fhir[resource.resourceType] ??= []).push(resource);
        return resource;
    };

    // --- Patient ---
    const patientRole = doc.recordTarget?.patientRole;
    const patientId = stableId(patientRole?.id, () => canonical(patientRole));
    const p = patientRole?.patient;
    const nm = arr(p?.name)[0];
    const patient: any = {
        resourceType: 'Patient',
        id: patientId,
        ...(nm ? {
            name: [{
                ...(arr(nm.given).length ? { given: arr(nm.given).map((g: any) => textOf(g).trim()) } : {}),
                ...(nm.family ? { family: textOf(nm.family).trim() } : {}),
                text: [...arr(nm.given).map((g: any) => textOf(g).trim()), textOf(nm.family).trim()]
                    .filter(Boolean).join(' '),
            }],
        } : {}),
        ...(attr(p?.administrativeGenderCode, 'code')
            ? { gender: { M: 'male', F: 'female' }[attr(p.administrativeGenderCode, 'code')!] ?? 'unknown' }
            : {}),
        ...(cdaTime(attr(p?.birthTime, 'value')) ? { birthDate: cdaTime(attr(p.birthTime, 'value')) } : {}),
        address: arr(patientRole?.addr).map((a: any) => ({
            ...(a.streetAddressLine ? { line: arr(a.streetAddressLine).map((l: any) => textOf(l).trim()) } : {}),
            ...(a.city ? { city: textOf(a.city).trim() } : {}),
            ...(a.state ? { state: textOf(a.state).trim() } : {}),
            ...(a.postalCode ? { postalCode: textOf(a.postalCode).trim() } : {}),
        })),
    };
    if (!patient.address.length) delete patient.address;
    add(patient);
    const subject = { reference: `Patient/${patientId}` };

    // --- Sections ---
    for (const comp of arr(doc.component?.structuredBody?.component)) {
        const section = comp.section;
        if (!section) continue;
        const loinc = attr(section.code, 'code') ?? '';
        const title = textOf(section.title).trim() || '(untitled)';
        const entries = arr(section.entry);
        const before = Object.values(fhir).reduce((n, a) => n + a.length, 0);

        for (const entry of entries) {
            try {
                mapEntry(loinc, entry, section, add, subject, attachments);
            } catch {
                // A malformed entry must not abort the document; the original XML is
                // retained as an attachment, so nothing is unrecoverable.
            }
        }
        const after = Object.values(fhir).reduce((n, a) => n + a.length, 0);
        sectionSummary.push({ title, loinc, entries: entries.length, mapped: after - before });
    }

    // --- The document itself, plus verbatim source ---
    const docId = stableId(doc.id, () => xml.length.toString());
    const docRef: any = {
        resourceType: 'DocumentReference',
        id: docId,
        status: 'current',
        type: codeable(doc.code) ?? { text: 'Summarization of Episode Note' },
        subject,
        ...(cdaTime(attr(doc.effectiveTime, 'value')) ? { date: cdaTime(attr(doc.effectiveTime, 'value')) } : {}),
        description: textOf(doc.title).trim() || undefined,
        content: [{ attachment: { contentType: 'application/xml', title: 'C-CDA source document' } }],
    };
    add(docRef);

    if (opts.documentBytes) {
        attachments.push({
            resourceType: 'DocumentReference',
            resourceId: docId,
            path: 'content[0].attachment',
            contentType: 'application/xml',
            json: JSON.stringify(docRef.content[0].attachment),
            contentBase64: opts.documentBytes.toString('base64'),
            contentPlaintext: xml,
        });
    }
    if (opts.pdfBytes) {
        attachments.push({
            resourceType: 'DocumentReference',
            resourceId: docId,
            path: 'content[1].attachment',
            contentType: 'application/pdf',
            json: JSON.stringify({ contentType: 'application/pdf', title: opts.pdfName ?? 'rendering.pdf' }),
            contentBase64: opts.pdfBytes.toString('base64'),
            contentPlaintext: null,
        });
    }

    return { fhir, attachments, sectionSummary };
}

// --- Entry mapping ---------------------------------------------------------

function mapEntry(
    loinc: string,
    entry: any,
    section: any,
    add: (r: any) => any,
    subject: any,
    attachments: ClientProcessedAttachment[]
): void {
    switch (loinc) {
        case SECTION.PROBLEMS:
        case SECTION.HEALTH_CONCERNS: {
            // Problem Concern act wraps the actual Problem Observation.
            for (const rel of arr(entry.act?.entryRelationship)) {
                const obs = rel.observation;
                if (!obs) continue;
                const t = effTime(obs);
                add({
                    resourceType: 'Condition',
                    id: stableId(obs.id, () => canonical(obs)),
                    clinicalStatus: statusFromAct(entry.act),
                    category: [{
                        coding: [{
                            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                            code: loinc === SECTION.HEALTH_CONCERNS ? 'health-concern' : 'problem-list-item',
                        }],
                    }],
                    code: codeable(obs.value) ?? codeable(obs.code),
                    subject,
                    ...(t.start || t.value ? { onsetDateTime: t.start ?? t.value } : {}),
                    ...(t.end ? { abatementDateTime: t.end } : {}),
                });
            }
            return;
        }

        case SECTION.MEDICATIONS: {
            const sa = entry.substanceAdministration;
            if (!sa) return;
            const material = sa.consumable?.manufacturedProduct?.manufacturedMaterial;
            const t = effTime(sa);
            const sig = textOf(sa.text).trim();
            add({
                resourceType: 'MedicationStatement',
                id: stableId(sa.id, () => canonical(sa)),
                status: mapStatus(attr(sa.statusCode, 'code')),
                medicationCodeableConcept: codeable(material?.code) ?? { text: textOf(material?.name).trim() || 'Unknown medication' },
                subject,
                ...(t.start || t.end || t.value
                    ? { effectivePeriod: { ...(t.start ? { start: t.start } : {}), ...(t.end ? { end: t.end } : {}) } }
                    : {}),
                ...(sig ? { dosage: [{ text: sig }] } : {}),
            });
            return;
        }

        case SECTION.RESULTS:
        case SECTION.VITALS: {
            const org = entry.organizer;
            const members: any[] = [];
            const category = loinc === SECTION.VITALS ? 'vital-signs' : 'laboratory';
            for (const c of arr(org?.component)) {
                const obs = c.observation;
                if (!obs) continue;
                members.push(add(observationFrom(obs, subject, category)));
            }
            if (org) {
                const t = effTime(org);
                add({
                    resourceType: 'DiagnosticReport',
                    id: stableId(org.id, () => canonical(org)),
                    status: 'final',
                    code: codeable(org.code) ?? { text: 'Result' },
                    subject,
                    ...(t.start || t.value ? { effectiveDateTime: t.value ?? t.start } : {}),
                    result: members.map(m => ({ reference: `Observation/${m.id}` })),
                });
            } else if (entry.observation) {
                add(observationFrom(entry.observation, subject, category));
            }
            return;
        }

        case SECTION.SOCIAL_HISTORY:
        case SECTION.MENTAL_STATUS: {
            const obs = entry.observation;
            if (obs) add(observationFrom(obs, subject, loinc === SECTION.SOCIAL_HISTORY ? 'social-history' : 'survey'));
            return;
        }

        case SECTION.IMMUNIZATIONS: {
            const sa = entry.substanceAdministration;
            if (!sa) return;
            const material = sa.consumable?.manufacturedProduct?.manufacturedMaterial;
            const t = effTime(sa);
            add({
                resourceType: 'Immunization',
                id: stableId(sa.id, () => canonical(sa)),
                status: attr(sa, 'negationInd') === 'true' ? 'not-done' : 'completed',
                vaccineCode: codeable(material?.code) ?? { text: textOf(material?.name).trim() || 'Unknown vaccine' },
                patient: subject,
                ...(t.value || t.start ? { occurrenceDateTime: t.value ?? t.start } : {}),
            });
            return;
        }

        case SECTION.ALLERGIES: {
            for (const rel of arr(entry.act?.entryRelationship)) {
                const obs = rel.observation;
                if (!obs) continue;
                const substance = arr(obs.participant)[0]?.participantRole?.playingEntity?.code;
                add({
                    resourceType: 'AllergyIntolerance',
                    id: stableId(obs.id, () => canonical(obs)),
                    clinicalStatus: statusFromAct(entry.act),
                    code: codeable(substance) ?? codeable(obs.value) ?? codeable(obs.code),
                    patient: subject,
                });
            }
            return;
        }

        case SECTION.PROCEDURES: {
            const proc = entry.procedure ?? entry.observation ?? entry.act;
            if (!proc) return;
            const t = effTime(proc);
            add({
                resourceType: 'Procedure',
                id: stableId(proc.id, () => canonical(proc)),
                status: mapStatus(attr(proc.statusCode, 'code')),
                code: codeable(proc.code),
                subject,
                ...(t.value || t.start ? { performedDateTime: t.value ?? t.start } : {}),
            });
            return;
        }

        case SECTION.ENCOUNTERS: {
            const enc = entry.encounter;
            if (!enc) return;
            const t = effTime(enc);
            add({
                resourceType: 'Encounter',
                id: stableId(enc.id, () => canonical(enc)),
                status: 'finished',
                class: { code: attr(enc.code, 'code') ?? 'AMB', display: display(enc.code) },
                type: codeable(enc.code) ? [codeable(enc.code)] : undefined,
                subject,
                ...(t.start || t.value || t.end
                    ? { period: { ...(t.start || t.value ? { start: t.start ?? t.value } : {}), ...(t.end ? { end: t.end } : {}) } }
                    : {}),
            });
            return;
        }

        case SECTION.NOTES: {
            const act = entry.act;
            if (!act) return;
            const id = stableId(act.id, () => canonical(act));
            const t = effTime(act);
            // Note bodies are base64 text/plain in this dialect.
            const ed = act.text;
            const b64 = typeof ed?.['#text'] === 'string' && attr(ed, 'representation') === 'B64'
                ? ed['#text'].replace(/\s+/g, '')
                : undefined;
            let plaintext: string | null = null;
            if (b64) {
                try {
                    plaintext = narrativeToText(Buffer.from(b64, 'base64').toString('utf-8')) || null;
                } catch { plaintext = null; }
            }
            const docRef: any = {
                resourceType: 'DocumentReference',
                id,
                status: 'current',
                type: codeable(act.code) ?? { text: 'Note' },
                subject,
                ...(t.value || t.start ? { date: t.value ?? t.start } : {}),
                content: [{ attachment: { contentType: 'text/plain' } }],
            };
            add(docRef);
            if (plaintext) {
                attachments.push({
                    resourceType: 'DocumentReference',
                    resourceId: id,
                    path: 'content[0].attachment',
                    contentType: 'text/plain',
                    json: JSON.stringify(docRef.content[0].attachment),
                    contentBase64: b64 ?? null,
                    contentPlaintext: plaintext,
                });
            }
            return;
        }

        default:
            return; // Unmapped section; the original XML attachment still carries it.
    }
}

function observationFrom(obs: any, subject: any, category: string): any {
    const t = effTime(obs);
    const value = obs.value;
    const vType = attr(value, 'type') ?? attr(value, 'xsi:type');
    const out: any = {
        resourceType: 'Observation',
        id: stableId(obs.id, () => canonical(obs)),
        status: mapObsStatus(attr(obs.statusCode, 'code')),
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: category }] }],
        code: codeable(obs.code) ?? { text: 'Unnamed observation' },
        subject,
        ...(t.value || t.start ? { effectiveDateTime: t.value ?? t.start } : {}),
    };
    const q = quantity(value);
    if (q) out.valueQuantity = q;
    else if (vType && /CD|CE|CO/.test(vType)) out.valueCodeableConcept = codeable(value);
    else if (value !== undefined) {
        const txt = textOf(value).trim();
        if (txt) out.valueString = txt;
        else if (codeable(value)) out.valueCodeableConcept = codeable(value);
    }
    const ref = obs.referenceRange?.observationRange;
    if (ref) {
        const lo = quantity(ref.value?.low);
        const hi = quantity(ref.value?.high);
        const txt = textOf(ref.text).trim();
        if (lo || hi || txt) out.referenceRange = [{ ...(lo ? { low: lo } : {}), ...(hi ? { high: hi } : {}), ...(txt ? { text: txt } : {}) }];
    }
    const interp = codeable(obs.interpretationCode);
    if (interp) out.interpretation = [interp];
    return out;
}

function mapStatus(code: string | undefined): string {
    switch (code) {
        case 'completed': return 'completed';
        case 'active': return 'active';
        case 'aborted': return 'stopped';
        case 'cancelled': return 'not-done';
        default: return 'unknown';
    }
}

function mapObsStatus(code: string | undefined): string {
    return code === 'completed' ? 'final' : code === 'aborted' ? 'cancelled' : 'final';
}

function statusFromAct(act: any): any {
    const code = attr(act?.statusCode, 'code');
    const resolved = code === 'completed';
    return {
        coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: resolved ? 'resolved' : 'active',
        }],
    };
}
