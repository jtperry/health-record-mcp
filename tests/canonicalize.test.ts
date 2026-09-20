// S4 (#318 Amendment 1): proves the exporter's canonicalization is a real RFC 8785
// (JCS) implementation, and that the old hand-rolled sortKeysDeep()+JSON.stringify()
// diverges from it on exactly the fixture the review found: integer-like keys.
//
// This exercises the actual `canonicalize` npm package ehretriever.ts imports (see
// `import canonicalize from 'canonicalize'` and canonicalJSONStringify() there), not a
// reimplementation.
//
// Run with: bun test tests/canonicalize.test.ts

import { describe, test, expect } from 'bun:test';
import canonicalize from 'canonicalize';

// The exact old implementation ehretriever.ts used to compute payload_sha256's input,
// kept here ONLY as a negative control to show what it got wrong - it is not used
// anywhere in the shipped code any more.
function oldSortKeysDeep(value: any): any {
    if (Array.isArray(value)) return value.map(oldSortKeysDeep);
    if (value && typeof value === 'object') {
        const sorted: Record<string, any> = {};
        for (const key of Object.keys(value).sort()) {
            sorted[key] = oldSortKeysDeep(value[key]);
        }
        return sorted;
    }
    return value;
}
function oldCanonicalJSONStringify(value: any): string {
    return JSON.stringify(oldSortKeysDeep(value));
}

describe('S4 - RFC 8785 canonicalization', () => {
    test('integer-like keys sort by UTF-16 code unit ("2" before "10"), not numeric key order', () => {
        // JS's Object.keys()/JSON.stringify() put integer-like keys in ascending
        // numeric order regardless of insertion or Array.prototype.sort() order - this
        // is a JS-engine-level property JCS explicitly overrides.
        const value = { '10': 'x', '2': 'y' };

        const jcs = canonicalize(value);
        expect(jcs).toBe('{"10":"x","2":"y"}'); // "10" < "2" lexicographically by UTF-16 code unit

        // Negative control: the old sortKeysDeep()-based approach gets this backwards,
        // because Object.keys(value).sort() still hands JSON.stringify's own key
        // insertion to the numeric-first engine behavior for the *resulting* object's
        // serialization... concretely, it disagrees with JCS on this exact input.
        const old = oldCanonicalJSONStringify(value);
        expect(old).not.toBe(jcs);
        expect(old).toBe('{"2":"y","10":"x"}');
    });

    test('key order is otherwise lexicographic by UTF-16 code unit', () => {
        const value = { b: 1, a: 2, Z: 3 };
        expect(canonicalize(value)).toBe('{"Z":3,"a":2,"b":1}');
    });

    test('nested objects and arrays canonicalize deterministically regardless of insertion order', () => {
        const a = { fhir: { Patient: [{ id: '1' }] }, attachments: [] };
        const b = { attachments: [], fhir: { Patient: [{ id: '1' }] } };
        expect(canonicalize(a)).toBe(canonicalize(b));
    });

    test('rejects NaN and Infinity rather than silently emitting invalid JSON', () => {
        // A hand-rolled canonicalizer using JSON.stringify would silently coerce these
        // to `null`; JCS requires the input be a valid JSON value in the first place.
        expect(() => canonicalize({ v: NaN })).toThrow();
        expect(() => canonicalize({ v: Infinity })).toThrow();
    });
});
