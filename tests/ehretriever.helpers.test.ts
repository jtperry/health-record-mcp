// Synthetic tests for S2 (status/console mirroring), S5 (patient_binding derivation)
// and S10a (modulo-biased randomness) in ehretriever.ts.
//
// ehretriever.ts is a classic (non-module) browser script, loaded via a plain
// `<script src=...>` tag (see static/ehretriever.html) and registers a top-level
// `document.addEventListener('DOMContentLoaded', ...)` - importing it directly
// requires a full DOM. Exporting its internal helpers to make them importable would
// change bun build's output from a plain script to an ES module, which is exactly the
// kind of build-tooling change this task is not authorised to make.
//
// Instead, these tests extract the exact function source text for the helper under
// test out of the real ehretriever.ts file at test time (by name + brace matching) and
// evaluate that text directly - this runs the literal shipped code, not a
// reimplementation, without needing a DOM or changing what the file exports.
//
// Run with: bun test tests/ehretriever.helpers.test.ts

import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const SOURCE = readFileSync(join(import.meta.dir, '..', 'ehretriever.ts'), 'utf-8');

/** Extracts `function NAME(...) { ... }` (or `async function NAME(...) { ... }`) from
 *  `source` by brace-matching from the first `{` after the signature. Throws if the
 *  function can't be found, so a rename in ehretriever.ts fails this loudly rather than
 *  silently testing nothing. */
function extractFunction(source: string, name: string): string {
    const sigMatch = source.match(new RegExp(`^(async )?function ${name}\\s*\\(`, 'm'));
    if (!sigMatch || sigMatch.index === undefined) {
        throw new Error(`Could not find "function ${name}(" in ehretriever.ts`);
    }
    const start = sigMatch.index;
    const braceStart = source.indexOf('{', start);
    if (braceStart === -1) throw new Error(`No opening brace found for ${name}`);
    let depth = 0;
    for (let i = braceStart; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') {
            depth--;
            if (depth === 0) return source.slice(start, i + 1);
        }
    }
    throw new Error(`Unbalanced braces extracting ${name}`);
}

// Extracted function bodies are still TypeScript (type annotations, default params
// with types), which the plain `Function` constructor can't parse - strip types with
// Bun's own transpiler before eval'ing.
const transpiler = new Bun.Transpiler({ loader: 'ts' });
function evalAsFunction<T>(tsSource: string): T {
    return new Function(transpiler.transformSync(tsSource))() as T;
}

describe('S5 - patient_binding is derived, not random', () => {
    // sha256Hex is derivePatientBinding's own dependency; extract and eval both
    // together so derivePatientBinding calls the real sha256Hex, not a stand-in.
    const src = extractFunction(SOURCE, 'sha256Hex') + '\n' + extractFunction(SOURCE, 'derivePatientBinding') + '\nreturn derivePatientBinding;';
    const derivePatientBinding = evalAsFunction<(issuer: string, patientId: string) => Promise<string>>(src);

    test('matches the frozen formula: lowercase_hex(SHA-256("advoura-export-v1|"+issuer+"|"+patient_id))', async () => {
        const issuer = 'https://fhir.example.test/R4';
        const patientId = 'synthetic-patient-42';

        const expectedBytes = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(`advoura-export-v1|${issuer}|${patientId}`)
        );
        const expectedHex = Array.from(new Uint8Array(expectedBytes)).map(b => b.toString(16).padStart(2, '0')).join('');

        expect(await derivePatientBinding(issuer, patientId)).toBe(expectedHex);
    });

    test('is stable across two independent exports of the same (issuer, patient) pair', async () => {
        const issuer = 'https://fhir.example.test/R4';
        const patientId = 'synthetic-patient-42';
        const first = await derivePatientBinding(issuer, patientId);
        const second = await derivePatientBinding(issuer, patientId);
        expect(first).toBe(second);
        expect(first).toHaveLength(64); // hex-encoded SHA-256
    });

    test('differs across issuers for the same patient id, and across patients at the same issuer', async () => {
        const a = await derivePatientBinding('https://issuer-a.test/R4', 'patient-1');
        const b = await derivePatientBinding('https://issuer-b.test/R4', 'patient-1');
        const c = await derivePatientBinding('https://issuer-a.test/R4', 'patient-2');
        expect(a).not.toBe(b);
        expect(a).not.toBe(c);
    });

    test('negative control: the fix replaced a random-per-export generator that could never satisfy the above', async () => {
        // This is exactly the old generateOpaqueId() this replaced: 16 fresh random
        // bytes per export, satisfying "stable within one export" but never
        // "deterministic across exports of the same patient" - which is why Amendment 2
        // exists. Demonstrating the negative control on the live derivePatientBinding
        // isn't possible (it's deterministic by construction); this documents what
        // would have failed the two tests above.
        function oldGenerateOpaqueId(): string {
            const bytes = new Uint8Array(16);
            crypto.getRandomValues(bytes);
            return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        const first = oldGenerateOpaqueId();
        const second = oldGenerateOpaqueId();
        expect(first).not.toBe(second); // proves the old generator was the wrong shape for an identity anchor
    });
});

describe('S10a - generateRandomString avoids modulo bias', () => {
    const src = extractFunction(SOURCE, 'generateRandomString') + '\nreturn generateRandomString;';
    const generateRandomString = evalAsFunction<(length?: number) => string>(src);
    const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'; // 66 chars
    // 256 = 66*3 + 58: under `byte % 66`, remainders 0..57 (the charset's first 58
    // characters) are hit by 4 distinct byte values each, while remainders 58..65 (the
    // LAST 8 characters: '8','9','-','.','_','~') are hit by only 3. The last-8 group is
    // the one that reliably reveals the bias: it is drawn ~25% less often than uniform
    // (3/256 vs the uniform target 1/66), a large and stable effect at N=200,000 draws.
    const UNDER_SAMPLED_UNDER_NAIVE_MODULO = CHARSET.slice(58);

    test('produces strings of the requested length using only the declared charset', () => {
        const s = generateRandomString(40);
        expect(s).toHaveLength(40);
        for (const ch of s) expect(CHARSET.includes(ch)).toBe(true);
    });

    test('over many draws, every character (including the ones naive `byte % 66` under-samples) lands close to uniform', () => {
        const counts = new Map<string, number>();
        const N = 200_000;
        const combined = generateRandomString(N);
        for (const ch of combined) counts.set(ch, (counts.get(ch) ?? 0) + 1);

        const expected = N / CHARSET.length;
        for (const ch of CHARSET) {
            const c = counts.get(ch) ?? 0;
            expect(c).toBeGreaterThan(expected * 0.85);
            expect(c).toBeLessThan(expected * 1.15);
        }
    });

    test('negative control: the old naive-modulo generator visibly under-samples the last 8 charset characters', () => {
        function oldGenerateRandomString(length = 40) {
            const characters = CHARSET;
            const bytes = new Uint8Array(length);
            crypto.getRandomValues(bytes);
            let result = '';
            for (let i = 0; i < length; i++) result += characters.charAt(bytes[i] % characters.length);
            return result;
        }
        const N = 200_000;
        const combined = oldGenerateRandomString(N);
        const counts = new Map<string, number>();
        for (const ch of combined) counts.set(ch, (counts.get(ch) ?? 0) + 1);
        const expected = N / CHARSET.length;

        // Each of the under-sampled characters lands well below the 0.85x floor the
        // fixed generator is held to above - the fix's test would have caught this.
        for (const ch of UNDER_SAMPLED_UNDER_NAIVE_MODULO) {
            const c = counts.get(ch) ?? 0;
            expect(c).toBeLessThan(expected * 0.85);
        }
    });
});

describe('S2 - updateStatus no longer mirrors status text to the console', () => {
    const src = extractFunction(SOURCE, 'updateStatus');

    function runUpdateStatus(message: string, isError = false) {
        const fakeElement = {
            textContent: '',
            classList: { toggle: (_cls: string, _v: boolean) => {} },
            setAttribute: (_k: string, _v: string) => {},
        };
        const wrapped = `return function(statusMessageElement) {\n${transpiler.transformSync(src)}\nreturn updateStatus;\n};`;
        const fn: (message: string, isError?: boolean) => void = new Function(wrapped)()(fakeElement);
        fn(message, isError);
        return fakeElement;
    }

    test('a normal status message reaches the DOM element and not the console', () => {
        const logCalls: any[] = [];
        const errCalls: any[] = [];
        const origLog = console.log, origErr = console.error;
        console.log = (...a: any[]) => logCalls.push(a);
        console.error = (...a: any[]) => errCalls.push(a);
        try {
            const el = runUpdateStatus('Preparing authorization request...');
            expect(el.textContent).toBe('Preparing authorization request...');
        } finally {
            console.log = origLog;
            console.error = origErr;
        }
        expect(logCalls.length).toBe(0);
        expect(errCalls.length).toBe(0);
    });

    test('an error status - including one built from a token-endpoint-derived message - never reaches the console', () => {
        const logCalls: any[] = [];
        const errCalls: any[] = [];
        const origLog = console.log, origErr = console.error;
        console.log = (...a: any[]) => logCalls.push(a);
        console.error = (...a: any[]) => errCalls.push(a);
        // Simulates what used to reach console.error via updateStatus's own mirroring -
        // e.g. a message built from a raw token-endpoint response body under the old
        // `Token exchange failed (...): ${errorDetails}` shape.
        const dangerousMessage = 'Error during authorization or data processing: Token exchange failed (HTTP 400).';
        try {
            const el = runUpdateStatus(dangerousMessage, true);
            expect(el.textContent).toBe(dangerousMessage); // still shown to the user, just not logged
        } finally {
            console.log = origLog;
            console.error = origErr;
        }
        expect(logCalls.length).toBe(0);
        expect(errCalls.length).toBe(0);
    });
});

describe('S2 - the token-exchange error path never embeds the raw response body', () => {
    test('the throw expression only ever carries the HTTP status, never tokenData fields', () => {
        const tokenExchangeBlock = SOURCE.slice(
            SOURCE.indexOf("const tokenData = await tokenResponse.json()"),
            SOURCE.indexOf("const accessToken = tokenData.access_token;")
        );
        expect(tokenExchangeBlock).toContain('Token exchange failed (HTTP ${tokenResponse.status})');
        // Negative control: this is exactly the shape of the old, vulnerable message -
        // demonstrating that if either of these reappeared in the block, this assertion
        // would fail.
        expect(tokenExchangeBlock).not.toContain('JSON.stringify(tokenData)');
        expect(tokenExchangeBlock).not.toContain('tokenData.error_description');
        expect(tokenExchangeBlock).not.toContain('tokenData.error}');
    });
});
