// Synthetic tests for #318 Amendment 5 / R-1: a task whose URL is a search must be
// answered by a Bundle. A 200 single resource - especially an OperationOutcome
// carrying an id - answering a search must not be treated as a completed query, and
// must never be written into the fhir payload as though it were a record. No real
// provider, no real patient data: every FHIR "server" here is a mocked global.fetch
// handler over made-up ids and URLs.
//
// Run with: bun test tests/ehretriever.amendment5.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { fetchAllEhrDataClientSideParallel } from '../clientFhirUtils';

const BASE_URL = 'https://fhir.example.test/R4';
const PATIENT_ID = 'synthetic-patient-1';

function fakeResponse(url: string, status: number, body: any, contentType = 'application/fhir+json'): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        url,
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? contentType : null) },
        body: null, // forces clientFhirUtils's non-streaming arrayBuffer() fallback path
        arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(body)).buffer,
    } as unknown as Response;
}

function emptyBundle() {
    return { resourceType: 'Bundle', entry: [], link: [] };
}

const OBSERVATION_LAB_QUERY_ID = 'Observation (category=laboratory)';
const PATIENT_READ_QUERY_ID = 'Patient (direct read)';

let originalFetch: typeof fetch;
beforeEach(() => { originalFetch = global.fetch; });
afterEach(() => { global.fetch = originalFetch; });

describe('#318 Amendment 5 / R-1 - a search must be answered by a Bundle', () => {
    test('a 200 OperationOutcome-with-id answering a search fails closed and is not stored', async () => {
        // The exact repro from Amendment 5: an Epic-family endpoint (or a scope-denied
        // gateway) answers a search 200 application/fhir+json with an OperationOutcome
        // that carries an id, instead of an empty Bundle.
        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u.startsWith(`${BASE_URL}/Observation?`) && u.includes('category=laboratory')) {
                return fakeResponse(u, 200, {
                    resourceType: 'OperationOutcome',
                    id: 'oo-1',
                    issue: [{ severity: 'information', code: 'informational', diagnostics: 'no results in scope' }],
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

        // The bug this closes: this used to report retrieval_complete: true,
        // resource_count: 1, failed_query_categories: [], with the OperationOutcome
        // sitting in outcome.ehr.fhir.OperationOutcome as though it were a record.
        expect(outcome.retrievalComplete).toBe(false);
        expect(outcome.failedQueryCategories).toContain('operation_outcome_response');
        expect(outcome.completedQueries).not.toContain(OBSERVATION_LAB_QUERY_ID);
        // Never written into the fhir payload as though it were a record.
        expect(outcome.ehr.fhir['OperationOutcome']).toBeUndefined();
    });

    test('the Patient direct-read still succeeds and its single resource is stored', async () => {
        // The regression risk named explicitly in Amendment 5: the Patient direct read
        // is not a search, and gating the single-resource branch on task.isSearch must
        // not break it.
        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return fakeResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID, gender: 'unknown' });
            }
            return fakeResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        expect(outcome.retrievalComplete).toBe(true);
        expect(outcome.completedQueries).toContain(PATIENT_READ_QUERY_ID);
        expect(outcome.ehr.fhir['Patient']?.some((r: any) => r.id === PATIENT_ID)).toBe(true);
        expect(outcome.failedQueryCategories).not.toContain('operation_outcome_response');
        expect(outcome.failedQueryCategories).not.toContain('unrecognised_response');
    });

    test('a single non-OperationOutcome resource answering a search also fails closed', async () => {
        // A server that, for whatever reason, answers a search with a bare single
        // resource (not wrapped in a Bundle, and not an OperationOutcome) must be
        // treated the same way: the request was a search, so only a Bundle satisfies
        // it. unrecognised_response is the right category - this file has no reason to
        // believe a bare Condition answering a search means "one Condition and done".
        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u.startsWith(`${BASE_URL}/Condition?`)) {
                return fakeResponse(u, 200, { resourceType: 'Condition', id: 'c-bare' });
            }
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return fakeResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            return fakeResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        expect(outcome.retrievalComplete).toBe(false);
        expect(outcome.failedQueryCategories).toContain('unrecognised_response');
        expect(outcome.completedQueries).not.toContain('Condition');
        expect(outcome.ehr.fhir['Condition']?.some((r: any) => r.id === 'c-bare')).not.toBe(true);
    });

    test('a read answered by a Bundle fails closed and the Patient direct-read does not complete', async () => {
        // The second half of Amendment 5's ruling: "a search expects a Bundle, a read
        // expects a resource. Anything that does not match what was asked for is a
        // failure, whatever it is." Reproduces the verifier's case - a server that
        // answers every request, including the Patient direct read, with an empty
        // searchset Bundle. Before this fix the Bundle branch was not gated on
        // task.isSearch at all, so this fell into the Bundle branch, processed zero
        // entries, found no next-link, and called markQueryComplete - reporting
        // retrieval_complete: true with zero resources and no Patient stored.
        global.fetch = (async (url: any) => {
            const u = String(url);
            return fakeResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        expect(outcome.retrievalComplete).toBe(false);
        expect(outcome.failedQueryCategories).toContain('unrecognised_response');
        expect(outcome.completedQueries).not.toContain(PATIENT_READ_QUERY_ID);
        expect(outcome.ehr.fhir['Patient']).toBeUndefined();
        expect(outcome.resourceCount).toBe(0);
    });

    test('a multi-page search chain still works across more than one hop', async () => {
        // Proves the isSearch gate on the Bundle branch does not disturb pagination:
        // a search answered by three Bundle pages, chained by two next-links, must
        // still follow both hops and complete.
        const baseSearchUrl = `${BASE_URL}/Observation?category=laboratory&patient=${PATIENT_ID}`;
        const page2Url = `${baseSearchUrl}&page=2`;
        const page3Url = `${baseSearchUrl}&page=3`;
        const fetchedPages: string[] = [];

        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u === page3Url) {
                fetchedPages.push('page3');
                return fakeResponse(u, 200, {
                    resourceType: 'Bundle',
                    entry: [{ resource: { resourceType: 'Observation', id: 'obs-3' } }],
                    link: [],
                });
            }
            if (u === page2Url) {
                fetchedPages.push('page2');
                return fakeResponse(u, 200, {
                    resourceType: 'Bundle',
                    entry: [{ resource: { resourceType: 'Observation', id: 'obs-2' } }],
                    link: [{ relation: 'next', url: page3Url }],
                });
            }
            if (u.startsWith(baseSearchUrl)) {
                fetchedPages.push('page1');
                return fakeResponse(u, 200, {
                    resourceType: 'Bundle',
                    entry: [{ resource: { resourceType: 'Observation', id: 'obs-1' } }],
                    link: [{ relation: 'next', url: page2Url }],
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

        expect(fetchedPages).toEqual(['page1', 'page2', 'page3']);
        expect(outcome.ehr.fhir['Observation']?.some((r: any) => r.id === 'obs-1')).toBe(true);
        expect(outcome.ehr.fhir['Observation']?.some((r: any) => r.id === 'obs-2')).toBe(true);
        expect(outcome.ehr.fhir['Observation']?.some((r: any) => r.id === 'obs-3')).toBe(true);
        expect(outcome.retrievalComplete).toBe(true);
        expect(outcome.completedQueries).toContain(OBSERVATION_LAB_QUERY_ID);
    });

    test('negative control: a fully successful run is still retrieval_complete: true with an empty category list', async () => {
        // Proves the isSearch gating does not simply pin retrieval_complete false for
        // every search task - a run where every search is answered by a Bundle (even an
        // empty one) and the Patient direct-read succeeds still reports complete.
        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u.startsWith(`${BASE_URL}/Patient/${PATIENT_ID}`)) {
                return fakeResponse(u, 200, { resourceType: 'Patient', id: PATIENT_ID });
            }
            return fakeResponse(u, 200, emptyBundle());
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        expect(outcome.retrievalComplete).toBe(true);
        expect(outcome.failedQueryCategories).toEqual([]);
        expect(outcome.completedQueries.length).toBe(outcome.requestedQueries.length);
    });
});
