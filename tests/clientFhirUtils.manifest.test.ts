// Synthetic tests for the AdvouraExportV1 manifest-completeness fixes (Forgejo
// Barn-Analytics/Advoura #318, findings S1/S3/S6/S7 from the exporter security
// review). No real provider, no real patient data: every FHIR "server" here is a
// mocked global.fetch handler over made-up ids and URLs.
//
// Run with: bun test tests/clientFhirUtils.manifest.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { fetchAllEhrDataClientSideParallel } from '../clientFhirUtils';

const BASE_URL = 'https://fhir.example.test/R4';
const PATIENT_ID = 'synthetic-patient-1';

function fakeResponse(url: string, status: number, jsonBody: any): Response {
    // Duck-typed Response: real Response objects don't let us set `.url` (needed to
    // exercise the S6 off-origin-redirect check), so clientFhirUtils's own fetch
    // handling is written against `response.ok/.status/.url/.headers.get/.body/
    // .arrayBuffer()` - all satisfied here without depending on the real Response
    // class's redirect/network behavior.
    return {
        ok: status >= 200 && status < 300,
        status,
        url,
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'application/fhir+json' : null) },
        body: null, // forces clientFhirUtils's non-streaming arrayBuffer() fallback path
        arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(jsonBody)).buffer,
    } as unknown as Response;
}

function emptyBundle() {
    return { resourceType: 'Bundle', entry: [], link: [] };
}

let originalFetch: typeof fetch;
beforeEach(() => { originalFetch = global.fetch; });
afterEach(() => { global.fetch = originalFetch; });

describe('S1 - retrieval_complete must go false when attachment fetches fail', () => {
    test('all Binary/* fetches 403ing no longer reports retrieval_complete: true', async () => {
        // One DocumentReference resource with an attachment that points at a Binary
        // the server will refuse (403) - the exact reviewer repro: "all-Binary-403".
        const docRefUrl = `${BASE_URL}/DocumentReference?patient=${PATIENT_ID}`;
        const binaryUrl = `${BASE_URL}/Binary/note-1`;

        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u === binaryUrl) {
                return fakeResponse(u, 403, { resourceType: 'OperationOutcome' });
            }
            if (u.startsWith(`${BASE_URL}/DocumentReference?`)) {
                return fakeResponse(u, 200, {
                    resourceType: 'Bundle',
                    entry: [{
                        resource: {
                            resourceType: 'DocumentReference', id: 'doc-1',
                            content: [{ attachment: { contentType: 'text/plain', url: binaryUrl } }],
                        },
                    }],
                    link: [],
                });
            }
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return fakeResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            // Every other initial query: a valid, empty, fully-paginated result.
            return fakeResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        // The bug: with every Binary/* fetch 403ing, this used to report
        // retrieval_complete: true, failed_query_categories: [], attachments: 0 -
        // truthfully reporting every *requested query* completed while silently
        // saying nothing about the attachment that was never retrieved.
        expect(outcome.ehr.attachments.length).toBe(0);
        expect(outcome.failedQueryCategories).toContain('attachment_fetch_failed');
        expect(outcome.retrievalComplete).toBe(false);
        // All 29 requested top-level queries (28 base + implicit Patient direct read)
        // still completed - the defect was never about them being wrong.
        expect(outcome.completedQueries.length).toBe(outcome.requestedQueries.length);
    });
});

describe('S3 - failed_query_categories must name what made retrieval_complete false', () => {
    test('a cyclic next link (same URL forever) is never left with an empty failed set', async () => {
        // The Condition page's own `next` link points right back at itself. The first
        // occurrence of that URL was already recorded in fetchedUrls when the initial
        // Condition task was created, so the repeated task is silently deduped away by
        // the batching loop - markQueryComplete/markQueryFailed never run for it again.
        const conditionUrl = `${BASE_URL}/Condition?patient=${PATIENT_ID}`;

        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u.startsWith(`${BASE_URL}/Condition?`)) {
                return fakeResponse(u, 200, {
                    resourceType: 'Bundle',
                    entry: [{ resource: { resourceType: 'Condition', id: 'c1' } }],
                    link: [{ relation: 'next', url: conditionUrl }], // points at itself, forever
                });
            }
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return fakeResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            return fakeResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        expect(outcome.retrievalComplete).toBe(false); // was already correct before the fix
        // The bug: failed_query_categories was [] here - "incomplete" with nothing to
        // tell the reader about what was incomplete.
        expect(outcome.failedQueryCategories.length).toBeGreaterThan(0);
        expect(outcome.failedQueryCategories).toContain('Condition');
        expect(outcome.completedQueries).not.toContain('Condition');
    });
});

describe('S6 - a same-origin next link that redirects off-origin is refused', () => {
    test('a response landing off the FHIR origin is not merged into the record', async () => {
        const conditionUrl = `${BASE_URL}/Condition?patient=${PATIENT_ID}`;
        const attackerUrl = 'https://attacker.example.test/steal';

        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u.startsWith(`${BASE_URL}/Condition?`)) {
                // response.url differs from the request URL: this is what fetch()'s
                // default redirect:'follow' would hand back after a same-origin `next`
                // link 302s to an attacker host.
                const resp = fakeResponse(attackerUrl, 200, {
                    resourceType: 'Bundle',
                    entry: [{ resource: { resourceType: 'Condition', id: 'attacker-injected' } }],
                    link: [],
                });
                return resp;
            }
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return fakeResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            return fakeResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        // The attacker-supplied resource must never be merged into the record.
        expect(outcome.ehr.fhir['Condition']?.some((r: any) => r.id === 'attacker-injected')).toBeFalsy();
        expect(outcome.retrievalComplete).toBe(false);
    });
});

describe('S7 - pages_followed counts pages actually fetched, not merely discovered', () => {
    test('a discovered-then-deduped cyclic next page is not counted', async () => {
        const conditionUrl = `${BASE_URL}/Condition?patient=${PATIENT_ID}`;

        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u.startsWith(`${BASE_URL}/Condition?`)) {
                return fakeResponse(u, 200, {
                    resourceType: 'Bundle',
                    entry: [{ resource: { resourceType: 'Condition', id: 'c1' } }],
                    link: [{ relation: 'next', url: conditionUrl }], // cyclic: never actually fetched again
                });
            }
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return fakeResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            return fakeResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        // The reviewer's repro: pages_followed reported 2 for one extra page that was
        // discovered but then deduped away and never actually fetched again.
        expect(outcome.pagesFollowed).toBe(0);
    });
});
