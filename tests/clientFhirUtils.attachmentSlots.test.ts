// Synthetic tests for attachment-slot de-duplication (Forgejo
// Barn-Analytics/Advoura #329 investigation). No real provider and no real patient
// data: every FHIR "server" here is a mocked global.fetch handler over made-up ids,
// made-up URLs and one line of invented HTML.
//
// What is under test: two different attachment *slots* that name the same
// `Binary/<id>` must each end up with their own stored attachment. The crawler's
// queued-task set was keyed by URL alone, so the second slot was dropped before it
// was ever fetched - and dropped silently, since a task discarded by the dedupe
// step never reaches the failure bookkeeping inside fetchAndProcessTask.
//
// Run with: bun test tests/clientFhirUtils.attachmentSlots.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { fetchAllEhrDataClientSideParallel, dedupeKeyForTask } from '../clientFhirUtils';

const BASE_URL = 'https://fhir.example.test/R4';
const PATIENT_ID = 'synthetic-patient-1';
const SHARED_BINARY_URL = `${BASE_URL}/Binary/synthetic-note-1`;
const LONE_BINARY_URL = `${BASE_URL}/Binary/synthetic-note-2`;
// Invented text. Nothing here came from a record.
const SYNTHETIC_HTML = '<html><body><p>Synthetic note body for test purposes.</p></body></html>';

function jsonResponse(url: string, status: number, jsonBody: any): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        url,
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/fhir+json' : null) },
        body: null, // forces clientFhirUtils's non-streaming arrayBuffer() fallback path
        arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(jsonBody)).buffer,
    } as unknown as Response;
}

function htmlResponse(url: string, html: string): Response {
    return {
        ok: true,
        status: 200,
        url,
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'text/html' : null) },
        body: null,
        arrayBuffer: async () => new TextEncoder().encode(html).buffer,
    } as unknown as Response;
}

function emptyBundle() {
    return { resourceType: 'Bundle', entry: [], link: [] };
}

function bundleOf(resource: any) {
    return { resourceType: 'Bundle', entry: [{ resource }], link: [] };
}

function slotKey(a: { resourceType: string; resourceId: string; path: string }) {
    return `${a.resourceType}/${a.resourceId}#${a.path}`;
}

// processAttachmentData base64-encodes the fetched blob with FileReader, which is a
// browser API - ehretriever.ts runs in a page, so that is correct there, but Bun's
// runtime does not define it (verified: `ReferenceError: FileReader is not defined`),
// and without this shim every attachment in these tests would be dropped by that
// function's own catch and the test would be asserting nothing about de-duplication.
// Only readAsDataURL is implemented, because that is the only call the code makes.
class TestFileReader {
    result: string | null = null;
    onloadend: (() => void) | null = null;
    onerror: ((e: any) => void) | null = null;
    readAsDataURL(blob: Blob) {
        blob.arrayBuffer()
            .then(buf => {
                const b64 = Buffer.from(new Uint8Array(buf)).toString('base64');
                this.result = `data:${blob.type || 'application/octet-stream'};base64,${b64}`;
                this.onloadend?.();
            })
            .catch(err => this.onerror?.(err));
    }
}

let originalFetch: typeof fetch;
let originalFileReader: any;
beforeEach(() => {
    originalFetch = global.fetch;
    originalFileReader = (global as any).FileReader;
    (global as any).FileReader = TestFileReader;
});
afterEach(() => {
    global.fetch = originalFetch;
    (global as any).FileReader = originalFileReader;
});

describe('two attachment slots naming the same Binary each get their own bytes', () => {
    test('a DiagnosticReport.presentedForm and a DocumentReference.content sharing one Binary URL both arrive', async () => {
        // This is the shape measured on a real Epic export: a note is reachable both
        // as DiagnosticReport.presentedForm[0] and as
        // DocumentReference.content[0].attachment, with an identical Binary/<id> in
        // both. Before the fix the second slot discovered was deduped away by URL and
        // arrived empty, while the manifest recorded nothing about it.
        const binaryFetches: string[] = [];

        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u === SHARED_BINARY_URL) {
                binaryFetches.push(u);
                return htmlResponse(u, SYNTHETIC_HTML);
            }
            if (u.startsWith(`${BASE_URL}/DiagnosticReport?`)) {
                return jsonResponse(u, 200, bundleOf({
                    resourceType: 'DiagnosticReport', id: 'synthetic-dr-1',
                    presentedForm: [{ contentType: 'text/html', url: SHARED_BINARY_URL }],
                }));
            }
            if (u.startsWith(`${BASE_URL}/DocumentReference?`)) {
                return jsonResponse(u, 200, bundleOf({
                    resourceType: 'DocumentReference', id: 'synthetic-doc-1',
                    content: [{ attachment: { contentType: 'text/html', url: SHARED_BINARY_URL } }],
                }));
            }
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return jsonResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            return jsonResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        const keys = outcome.ehr.attachments.map(slotKey).sort();
        // The defect: this used to be a single entry - whichever of the two slots was
        // queued first - and the other DocumentReference/DiagnosticReport slot was a
        // "could not be displayed" with no bytes anywhere in the export.
        expect(keys).toEqual([
            'DiagnosticReport/synthetic-dr-1#presentedForm.0',
            'DocumentReference/synthetic-doc-1#content.0.attachment',
        ]);
        // Both slots hold the actual bytes, not just a row.
        for (const a of outcome.ehr.attachments) {
            expect(a.contentBase64).toBeTruthy();
            expect(a.contentPlaintext).toContain('Synthetic note body');
        }
        // The honest price of the fix, asserted rather than assumed: one fetch per
        // slot, not one per URL.
        expect(binaryFetches.length).toBe(2);
        // Nothing about this run is a failure, so the manifest must not invent one.
        expect(outcome.failedQueryCategories).not.toContain('attachment_fetch_failed');
        expect(outcome.retrievalComplete).toBe(true);
    });

    test('a single slot is fetched once and stored once', async () => {
        // Named for what it actually asserts. An earlier version of this test claimed
        // to prove "a genuinely repeated slot still collapses" and did not: the crawl
        // cannot reach that branch (see the dedupeKeyForTask unit tests below and that
        // function's own comment), so only one attachment candidate was ever produced
        // and the assertion passed just as well with the fix reverted. What IS worth
        // pinning here is the ordinary case - one slot, one fetch, one row - which is
        // the thing the slot-keyed set must not have made worse.
        const binaryFetches: string[] = [];

        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u === LONE_BINARY_URL) {
                binaryFetches.push(u);
                return htmlResponse(u, SYNTHETIC_HTML);
            }
            if (u.startsWith(`${BASE_URL}/DocumentReference?`)) {
                return jsonResponse(u, 200, bundleOf({
                    resourceType: 'DocumentReference', id: 'synthetic-doc-2',
                    // One resource, one content entry, therefore one slot. There is
                    // exactly one DocumentReference query (src/fhirSearchQueries.ts) and
                    // the Patient direct read carries no attachments, so this resource is
                    // reached once.
                    content: [{ attachment: { contentType: 'text/html', url: LONE_BINARY_URL } }],
                }));
            }
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return jsonResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            return jsonResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        expect(outcome.ehr.attachments.map(slotKey)).toEqual([
            'DocumentReference/synthetic-doc-2#content.0.attachment',
        ]);
        expect(binaryFetches.length).toBe(1);
    });
});

describe('dedupeKeyForTask - the queued-work key itself', () => {
    // Tested directly rather than through the crawl. The "same slot twice" case is
    // unreachable from fetchAllEhrDataClientSideParallel as this file stands -
    // extractTasksFromResource runs only when a resource is newly stored, the
    // check-then-store is synchronous, and findAttachments visits each node at one
    // path - so a crawl-level test of it would assert a guarantee it never reaches.
    // The key is still written to collapse it, and this is where that is pinned.
    const attachmentTask = (url: string, resourceType: string, resourceId: string, attachmentPath: string) =>
        ({ url, description: 'synthetic', depth: 0, isAttachment: true, resourceType, resourceId, attachmentPath }) as any;

    test('two slots naming one URL get two keys', () => {
        const a = dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DiagnosticReport', 'synthetic-dr-1', 'presentedForm.0'));
        const b = dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DocumentReference', 'synthetic-doc-1', 'content.0.attachment'));
        expect(a).not.toBe(b);
    });

    test('the same slot gets one key, however many times it is built', () => {
        const a = dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DocumentReference', 'synthetic-doc-1', 'content.0.attachment'));
        const b = dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DocumentReference', 'synthetic-doc-1', 'content.0.attachment'));
        expect(a).toBe(b);
    });

    test('two paths in one resource are two slots, and one path in two resources is two slots', () => {
        const byPath = [
            dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DocumentReference', 'd1', 'content.0.attachment')),
            dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DocumentReference', 'd1', 'content.1.attachment')),
        ];
        const byResource = [
            dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DocumentReference', 'd1', 'content.0.attachment')),
            dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DocumentReference', 'd2', 'content.0.attachment')),
        ];
        expect(byPath[0]).not.toBe(byPath[1]);
        expect(byResource[0]).not.toBe(byResource[1]);
    });

    test('a non-attachment task keeps the plain normalised-URL key', () => {
        // Unchanged behaviour, asserted so a later edit to this function cannot quietly
        // change what stops a self-referential `next` link from looping forever.
        const searchUrl = `${BASE_URL}/Condition?patient=${PATIENT_ID}`;
        expect(dedupeKeyForTask({ url: searchUrl, description: 'synthetic', depth: 0, isSearch: true } as any)).toBe(searchUrl);
        expect(dedupeKeyForTask({ url: `${searchUrl}/`, description: 'synthetic', depth: 0 } as any)).toBe(searchUrl);
        // Two different slots reduce to one key the moment the task is not an attachment.
        const one = dedupeKeyForTask({ url: SHARED_BINARY_URL, description: 'synthetic', depth: 0 } as any);
        const two = dedupeKeyForTask({ url: SHARED_BINARY_URL, description: 'synthetic', depth: 0 } as any);
        expect(one).toBe(two);
    });

    test('the key contains no control characters', () => {
        // An earlier revision separated the key's parts with literal NUL bytes, which
        // are invisible in a diff and were never chosen by anyone. The separator is `|`.
        const key = dedupeKeyForTask(attachmentTask(SHARED_BINARY_URL, 'DocumentReference', 'synthetic-doc-1', 'content.0.attachment'));
        expect(key).toContain('|');
        // eslint-disable-next-line no-control-regex
        expect(/[\u0000-\u001f]/.test(key)).toBe(false);
    });
});

describe('#329 finding A - an attachment answered as JSON must not undercount silently', () => {
    test('a Binary read served as application/fhir+json records attachment_dropped', async () => {
        // The reviewer's repro shape: the server answers the attachment fetch with a
        // Binary resource in application/fhir+json rather than the raw bytes. The
        // attachment-blob branch cannot claim that, so the resource is stored in the
        // fhir payload - no clinical content is lost - but attachment_count is one
        // short of the slots that exist, and before this fix nothing said so.
        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u === SHARED_BINARY_URL) {
                return jsonResponse(u, 200, {
                    resourceType: 'Binary', id: 'synthetic-note-1',
                    contentType: 'text/html',
                    data: Buffer.from(SYNTHETIC_HTML, 'utf8').toString('base64'),
                });
            }
            if (u.startsWith(`${BASE_URL}/DocumentReference?`)) {
                return jsonResponse(u, 200, bundleOf({
                    resourceType: 'DocumentReference', id: 'synthetic-doc-3',
                    content: [{ attachment: { contentType: 'text/html', url: SHARED_BINARY_URL } }],
                }));
            }
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return jsonResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            return jsonResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        // Unchanged, and deliberately so: the bytes still reach the export, inside the
        // stored Binary resource.
        expect(outcome.ehr.fhir['Binary']?.length).toBe(1);
        expect(outcome.ehr.attachments.length).toBe(0);
        // The fix: the shortfall in attachment_count is named.
        expect(outcome.failedQueryCategories).toContain('attachment_dropped');
        // And named accurately - the fetch itself succeeded, so the category for a
        // failed fetch must not also appear (#329 finding E, first half).
        expect(outcome.failedQueryCategories).not.toContain('attachment_fetch_failed');
        expect(outcome.retrievalComplete).toBe(false);
    });
});
