// Synthetic tests for #318 Amendment 3 (retrieval_complete's completeness invariant,
// clientFhirUtils.ts) and Amendment 4 (the payload_sha256 digest must never be able to
// destroy an already-successful export, ehretriever.ts). No real provider, no real
// patient data: every FHIR "server" here is a mocked global.fetch handler over
// made-up ids and URLs, and the digest tests exercise made-up payload shapes only.
//
// Run with: bun test tests/ehretriever.amendment34.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import canonicalize from 'canonicalize';
import { fetchAllEhrDataClientSideParallel } from '../clientFhirUtils';

const BASE_URL = 'https://fhir.example.test/R4';
const PATIENT_ID = 'synthetic-patient-1';

function fakeResponse(url: string, status: number, body: any, contentType = 'application/fhir+json'): Response {
    const isJsonBody = typeof body !== 'string';
    return {
        ok: status >= 200 && status < 300,
        status,
        url,
        headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? contentType : null) },
        body: null, // forces clientFhirUtils's non-streaming arrayBuffer() fallback path
        arrayBuffer: async () => new TextEncoder().encode(isJsonBody ? JSON.stringify(body) : body).buffer,
    } as unknown as Response;
}

function emptyBundle() {
    return { resourceType: 'Bundle', entry: [], link: [] };
}

let originalFetch: typeof fetch;
beforeEach(() => { originalFetch = global.fetch; });
afterEach(() => { global.fetch = originalFetch; });

describe('#318 Amendment 3 - an unrecognised 200 response is a failure, never a completion', () => {
    test('every query answering 200 text/html yields retrieval_complete: false with unrecognised_response', async () => {
        // The exact repro from Amendment 3: an expired portal session or captive-portal
        // interstitial answers every request 200 text/html instead of FHIR JSON.
        global.fetch = (async (url: any) => {
            const u = String(url);
            return fakeResponse(u, 200, '<html><body>Please log in again</body></html>', 'text/html');
        }) as any;

        const outcome = await fetchAllEhrDataClientSideParallel(
            'fake-token', BASE_URL, PATIENT_ID, () => {}
        );

        // The bug this closes: this used to report retrieval_complete: true,
        // failed_query_categories: [], resource_count: 0, attachment_count: 0 - zero
        // resources retrieved, declared complete.
        expect(outcome.retrievalComplete).toBe(false);
        expect(outcome.failedQueryCategories).toContain('unrecognised_response');
        expect(outcome.resourceCount).toBe(0);
        expect(outcome.ehr.attachments.length).toBe(0);
        expect(outcome.completedQueries.length).toBe(0);
    });

    test('a Bundle with total:0, no entry key, and a next link still has that link examined', async () => {
        // Second repro from Amendment 3: `entry: []` is truthy and took the correct
        // path before this fix, which is why existing fixtures never hit the case of a
        // *missing* `entry` key entirely.
        const conditionUrl = `${BASE_URL}/Condition?patient=${PATIENT_ID}`;
        const conditionNextUrl = `${conditionUrl}&page=2`;
        let conditionNextWasFetched = false;

        global.fetch = (async (url: any) => {
            const u = String(url);
            if (u === conditionNextUrl) {
                conditionNextWasFetched = true;
                return fakeResponse(u, 200, {
                    resourceType: 'Bundle',
                    entry: [{ resource: { resourceType: 'Condition', id: 'c1' } }],
                    link: [],
                });
            }
            if (u.startsWith(`${BASE_URL}/Condition?`)) {
                // total: 0, NO `entry` key at all, but a next link - abandoning the
                // chain here (the old bug) would mean conditionNextUrl is never fetched.
                return fakeResponse(u, 200, {
                    resourceType: 'Bundle',
                    total: 0,
                    link: [{ relation: 'next', url: conditionNextUrl }],
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

        expect(conditionNextWasFetched).toBe(true); // the next link WAS examined and followed
        expect(outcome.ehr.fhir['Condition']?.some((r: any) => r.id === 'c1')).toBe(true);
        // The entry-less first page must not itself have been mistaken for an
        // unrecognised response (it IS a Bundle this file understands).
        expect(outcome.failedQueryCategories).not.toContain('unrecognised_response');
        expect(outcome.retrievalComplete).toBe(true);
        expect(outcome.completedQueries).toContain('Condition');
    });

    test('negative control: a normal fully-successful run is still retrieval_complete: true with an empty category list', async () => {
        // Proves the fix does not simply pin retrieval_complete false - a run where
        // every query is answered validly still reports complete.
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

describe('#318 Amendment 4 - the payload_sha256 digest must never destroy the export', () => {
    // Extracts the literal shipped digest-computation block from ehretriever.ts (the
    // same source-extraction technique tests/ehretriever.helpers.test.ts already uses
    // for other non-exported helpers) and runs it directly, so this exercises the real
    // try/catch, not a reimplementation of it.
    const SOURCE = readFileSync(join(import.meta.dir, '..', 'ehretriever.ts'), 'utf-8');
    const startMarker = 'const advouraPayload = {';
    const endMarker = 'const patientBinding = await derivePatientBinding';
    const startIdx = SOURCE.indexOf(startMarker);
    const endIdx = SOURCE.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1) {
        throw new Error('Could not locate the payload_sha256 computation block in ehretriever.ts - it may have been renamed.');
    }
    const digestBlockSource = SOURCE.slice(startIdx, endIdx);

    // The digest block calls canonicalJSONStringify(), not `canonicalize` directly -
    // extract that real function too (same brace-matching approach
    // ehretriever.helpers.test.ts uses) so this runs the literal shipped wiring.
    function extractFunction(source: string, name: string): string {
        const sigMatch = source.match(new RegExp(`^(async )?function ${name}\\s*\\(`, 'm'));
        if (!sigMatch || sigMatch.index === undefined) throw new Error(`Could not find "function ${name}(" in ehretriever.ts`);
        const start = sigMatch.index;
        const braceStart = source.indexOf('{', start);
        let depth = 0;
        for (let i = braceStart; i < source.length; i++) {
            if (source[i] === '{') depth++;
            else if (source[i] === '}') { depth--; if (depth === 0) return source.slice(start, i + 1); }
        }
        throw new Error(`Unbalanced braces extracting ${name}`);
    }
    const canonicalJSONStringifySource = extractFunction(SOURCE, 'canonicalJSONStringify');

    const transpiler = new Bun.Transpiler({ loader: 'ts' });
    async function runDigestBlock(fetchedClientFullEhrObject: any, retrievalOutcome: any): Promise<{ payloadSha256: string | null; manifestCategories: string[] }> {
        const wrapped = `return async function(fetchedClientFullEhrObject, retrievalOutcome, canonicalize, sha256Hex) {\n${transpiler.transformSync(canonicalJSONStringifySource)}\n${transpiler.transformSync(digestBlockSource)}\nreturn { payloadSha256, manifestCategories };\n};`;
        const fn = new Function(wrapped)();
        async function sha256Hex(data: string): Promise<string> {
            const bytes = new TextEncoder().encode(data);
            const digest = await crypto.subtle.digest('SHA-256', bytes);
            return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        return fn(fetchedClientFullEhrObject, retrievalOutcome, canonicalize, sha256Hex);
    }

    test('an unpaired surrogate in the payload still produces a manifest, with payload_sha256: null and a recorded category', async () => {
        // A FHIR server returning a string containing an unpaired \uD800-style escape -
        // canonicalize() (RFC 8785) throws on this, where the old hand-rolled
        // canonicalizer silently emitted a replacement and carried on.
        const fetchedClientFullEhrObject = {
            fhir: { Observation: [{ resourceType: 'Observation', id: 'o1', note: [{ text: 'lone surrogate: \uD800 end' }] }] },
            attachments: [],
        };
        const retrievalOutcome = { failedQueryCategories: [] as string[] };

        // Sanity: prove this fixture really does throw under canonicalize, so the test
        // is exercising the failure path it claims to.
        expect(() => canonicalize(fetchedClientFullEhrObject)).toThrow();

        const { payloadSha256, manifestCategories } = await runDigestBlock(fetchedClientFullEhrObject, retrievalOutcome);

        expect(payloadSha256).toBeNull();
        expect(manifestCategories).toContain('digest_computation_failed');
        // The original retrievalOutcome.failedQueryCategories array must not be mutated
        // in place - a digest failure is a distinct concern from retrieval completeness.
        expect(retrievalOutcome.failedQueryCategories).toEqual([]);
    });

    test('negative control: a well-formed payload still produces a real digest with no category recorded', async () => {
        const fetchedClientFullEhrObject = {
            fhir: { Patient: [{ resourceType: 'Patient', id: PATIENT_ID }] },
            attachments: [],
        };
        const retrievalOutcome = { failedQueryCategories: [] as string[] };

        const { payloadSha256, manifestCategories } = await runDigestBlock(fetchedClientFullEhrObject, retrievalOutcome);

        expect(payloadSha256).not.toBeNull();
        expect(payloadSha256).toHaveLength(64); // hex-encoded SHA-256
        expect(manifestCategories).not.toContain('digest_computation_failed');
    });

    test('negative control: without the fix, the same malformed payload would throw and never reach the manifest', async () => {
        // Demonstrates what the bug looked like: calling sha256Hex(canonicalJSONStringify(...))
        // directly (no try/catch) propagates the throw, exactly as it did before this
        // block was wrapped - proving the wrapping in the shipped code is load-bearing.
        const payload = { note: 'lone surrogate: \uD800 end' };
        async function unwrapped() {
            const s = canonicalize(payload);
            if (s === undefined) throw new Error('unreachable for this fixture');
            const bytes = new TextEncoder().encode(s);
            await crypto.subtle.digest('SHA-256', bytes);
        }
        await expect(unwrapped()).rejects.toThrow();
    });
});
