// Synthetic tests for #334 (Forgejo Barn-Analytics/Advoura): the exporter's status box
// used to lead with "Data fetched successfully!" even when the retrieval was incomplete,
// and pointed the reader at the exported JSON file instead of naming what was missing.
//
// This exercises buildRetrievalStatusView, the pure view-model function in
// ehretriever.ts that replaced that inline string-building. It is extracted from the
// real source and eval'd (see tests/ehretriever.helpers.test.ts's header comment for why
// ehretriever.ts - a classic, non-module browser script - is tested this way rather than
// imported), so these tests run the literal shipped logic, not a reimplementation.
//
// Run with: bun test tests/ehretriever.statusView.test.ts

import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const SOURCE = readFileSync(join(import.meta.dir, '..', 'ehretriever.ts'), 'utf-8');

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

const transpiler = new Bun.Transpiler({ loader: 'ts' });
function evalAsFunction<T>(tsSource: string): T {
    return new Function(transpiler.transformSync(tsSource))() as T;
}

const src = extractFunction(SOURCE, 'buildRetrievalStatusView') + '\nreturn buildRetrievalStatusView;';
type RetrievalStatusInput = {
    retrievalComplete: boolean;
    requestedQueries: string[];
    completedQueries: string[];
    failedQueryCategories: string[];
    resourceTypeCount: number;
    totalResources: number;
    attachmentCount: number;
};
type RetrievalStatusView = {
    isComplete: boolean;
    headline: string;
    detail: string;
    missingQueries: string[];
    partialFetchNote: string | null;
};
const buildRetrievalStatusView = evalAsFunction<(input: RetrievalStatusInput) => RetrievalStatusView>(src);

describe('#334 - the live Mayo manifest (retrieval_complete: false)', () => {
    // Exactly the manifest from the 2026-09-20 live run against Mayo's Epic R4 endpoint,
    // reproduced from the issue and its "the live manifest sharpens this" comment.
    // failed_query_categories deliberately includes "Specimen" and "Observation" even
    // though the record holds 25 Specimens and 299 Observations - this is the trap the
    // fix has to not fall into.
    const requestedQueries = [
        'Patient (direct read)',
        'Condition', 'Practitioner', 'DiagnosticReport', 'MedicationRequest',
        'Observation (category=laboratory)', 'Observation (category=vital-signs)',
        'Observation (category=social-history)', 'Observation (category=survey)',
        'Observation (category=imaging)', 'Observation (category=exam)',
        'Observation (category=mental-health)',
        'CarePlan', 'MedicationStatement', 'Specimen',
        'AllergyIntolerance', 'Immunization', 'Procedure', 'DocumentReference',
        'Encounter', 'Organization', 'Location', 'Device', 'Goal',
        'FamilyMemberHistory', 'CareTeam', 'RelatedPerson', 'Coverage',
    ];

    const completedQueries = requestedQueries.filter(
        q => !['Observation (category=mental-health)', 'CarePlan', 'MedicationStatement', 'Specimen'].includes(q)
    );

    test('fixture sanity: matches the live manifest\'s 28 requested / 24 completed', () => {
        expect(requestedQueries).toHaveLength(28);
        expect(completedQueries).toHaveLength(24);
    });

    const view = buildRetrievalStatusView({
        retrievalComplete: false,
        requestedQueries,
        completedQueries,
        failedQueryCategories: [
            'Observation', 'CarePlan', 'MedicationStatement', 'Specimen',
            'reference_fetch_failed', 'attachment_fetch_failed',
        ],
        resourceTypeCount: 19,
        totalResources: 671,
        attachmentCount: 77,
    });

    test('does not claim success anywhere', () => {
        const allText = [view.headline, view.detail, view.partialFetchNote ?? '', ...view.missingQueries].join(' ').toLowerCase();
        expect(allText).not.toContain('success');
        expect(allText).not.toContain('!'); // no exclamation-mark celebration
    });

    test('the headline states incompleteness, not the counts', () => {
        expect(view.isComplete).toBe(false);
        expect(view.headline).toBe('This retrieval was incomplete.');
        expect(view.headline).not.toMatch(/\d/); // no counts in the headline itself
    });

    test('names the mental-health observations gap specifically, not a bare "Observation"', () => {
        expect(view.missingQueries).toContain('Observation (category=mental-health)');
        // The bare category name must not appear as its own missing-query entry - that
        // would say "Observation" is absent when 299 Observations arrived.
        expect(view.missingQueries).not.toContain('Observation');
    });

    test('names Specimen and CarePlan and MedicationStatement as the exact missing searches', () => {
        expect(view.missingQueries.sort()).toEqual(
            ['CarePlan', 'MedicationStatement', 'Observation (category=mental-health)', 'Specimen'].sort()
        );
    });

    test('the derivation is requestedQueries minus completedQueries, not failedQueryCategories', () => {
        // Proof, not assertion-by-coincidence: rerun with a failedQueryCategories list
        // that contains category names having nothing to do with the query diff, and
        // confirm missingQueries is unaffected - it must come only from the two query
        // lists.
        const withUnrelatedCategories = buildRetrievalStatusView({
            retrievalComplete: false,
            requestedQueries,
            completedQueries,
            failedQueryCategories: ['totally_unrelated_category', 'another_bogus_one'],
            resourceTypeCount: 19,
            totalResources: 671,
            attachmentCount: 77,
        });
        expect(withUnrelatedCategories.missingQueries.sort()).toEqual(view.missingQueries.sort());
        // And conversely: a failedQueryCategories that repeats a name already present in
        // requestedQueries/completedQueries (as the real manifest does) does not produce
        // duplicate or extra missing-query entries beyond the true diff.
        expect(view.missingQueries).toHaveLength(4);
    });

    test('reference_fetch_failed / attachment_fetch_failed produce a partial-fetch note, not a missing-category claim', () => {
        expect(view.partialFetchNote).toBe('Some linked records and documents could not be retrieved.');
        expect(view.missingQueries).not.toContain('reference_fetch_failed');
        expect(view.missingQueries).not.toContain('attachment_fetch_failed');
    });

    test('the counts appear in detail, not folded into the headline', () => {
        expect(view.detail).toBe('19 resource types, 671 total resources, and 77 attachments retrieved.');
    });

    test('no longer points at the exported file for the answer', () => {
        const allText = [view.headline, view.detail, view.partialFetchNote ?? ''].join(' ');
        expect(allText).not.toContain('exported file');
    });
});

describe('#334 - a fully successful retrieval', () => {
    const requestedQueries = ['Patient (direct read)', 'Condition', 'Observation (category=laboratory)'];
    const view = buildRetrievalStatusView({
        retrievalComplete: true,
        requestedQueries,
        completedQueries: requestedQueries,
        failedQueryCategories: [],
        resourceTypeCount: 5,
        totalResources: 120,
        attachmentCount: 10,
    });

    test('reads as complete', () => {
        expect(view.isComplete).toBe(true);
        expect(view.headline).toBe('Data fetched successfully.');
        expect(view.missingQueries).toEqual([]);
        expect(view.partialFetchNote).toBeNull();
    });

    test('is visually distinct from the incomplete case: isComplete flips, and so does the headline wording that drives the is-incomplete DOM class', () => {
        const incomplete = buildRetrievalStatusView({
            retrievalComplete: false,
            requestedQueries,
            completedQueries: [],
            failedQueryCategories: ['no_queries_generated'],
            resourceTypeCount: 0,
            totalResources: 0,
            attachmentCount: 0,
        });
        expect(view.isComplete).not.toBe(incomplete.isComplete);
        expect(view.headline).not.toBe(incomplete.headline);
        // The complete case must never contain the word used for the incomplete state,
        // and vice versa - the two headlines are categorically different sentences, not
        // the same box with one word swapped.
        expect(view.headline.toLowerCase()).not.toContain('incomplete');
        expect(incomplete.headline.toLowerCase()).not.toContain('successfully');
    });
});

describe('#334 - only attachment_fetch_failed occurred (record otherwise complete)', () => {
    const requestedQueries = ['Patient (direct read)', 'Condition', 'DocumentReference'];
    const view = buildRetrievalStatusView({
        retrievalComplete: false, // S1: retrievalComplete is false whenever any failure category fires, including attachment_fetch_failed
        requestedQueries,
        completedQueries: requestedQueries, // every named search completed
        failedQueryCategories: ['attachment_fetch_failed'],
        resourceTypeCount: 8,
        totalResources: 240,
        attachmentCount: 12,
    });

    test('does not claim any resource-type category is missing', () => {
        expect(view.missingQueries).toEqual([]); // requestedQueries === completedQueries
    });

    test('describes it as individual fetches failing, not a category being unavailable', () => {
        expect(view.partialFetchNote).toBe('Some linked records and documents could not be retrieved.');
        expect(view.partialFetchNote).not.toMatch(/category|resource type/i);
    });

    test('still leads with incompleteness rather than "successfully"', () => {
        expect(view.headline).toBe('This retrieval was incomplete.');
    });
});

describe('#334 - negative control: the old string-building this replaced', () => {
    // Demonstrates what would have failed the tests above - the exact shape removed
    // from ehretriever.ts by this change, kept here so the fix's tests fail loudly if
    // ever reverted rather than passing on unrelated grounds.
    function oldBuildFinalStatus(resourceTypeCount: number, totalResources: number, attachmentCount: number, retrievalComplete: boolean, failedQueryCategories: string[]): string {
        let finalStatus = `Data fetched successfully! ${resourceTypeCount} resource types, ${totalResources} total resources, and ${attachmentCount} attachments retrieved.`;
        if (!retrievalComplete) {
            finalStatus += ' This retrieval was incomplete — some data may be missing; see the exported file for detail.';
        }
        return finalStatus;
    }

    test('the old text led with "successfully!" even when incomplete, and named nothing specific', () => {
        const old = oldBuildFinalStatus(19, 671, 77, false, ['Observation', 'Specimen']);
        expect(old).toContain('successfully!'); // exactly the defect #334 reports
        expect(old).toContain('see the exported file for detail'); // exactly the second defect
        expect(old).not.toContain('mental-health'); // no specificity at all, raw or otherwise
    });
});
