# Multi-Source Ingestion Plan

Broadening the database beyond Epic/FHIR so it can hold a person's record regardless of
which EHR or export format it came from.

**Status:** plan only. Nothing has been ingested.

> **Scope note.** This is deliberately separate from the public `health.circlejtp.me`
> "download your data" flow ([plan](./health.circlejtp.me-plan.md)). That site is a
> browser-only SMART on FHIR client and stays Epic/FHIR-shaped. *This* document covers the
> local ingestion and database layer, which should accept anything the user can lawfully
> obtain — FHIR API pulls, C-CDA exports, and later CSV or PDF.

---

## 1. The corpus that prompted this

`ZOOMCARE_08-30-26.zip` (3.5 MB), from ZoomCare, whose EHR is **athenahealth**.

| File | Size | What it is |
|---|---|---|
| `john_perry_AmbulatorySummary1_alltime.xml` | 2.2 MB | **C-CDA R2.1 Continuity of Care Document** |
| `john_perry_AmbulatorySummary1_alltime.pdf` | 342 KB | Human-readable rendering |
| `stylesheet.xsl` | 1.1 MB | Standard C-CDA display stylesheet |

Document metadata:

- `templateId` `2.16.840.1.113883.10.20.22.1.1` (US Realm Header) + `.1.2` (CCD), extensions
  `2015-08-01` and `2023-05-01` → **C-CDA R2.1**
- `code` `34133-9` "Summarization of Episode Note", title "Data Portability"
- Assigning authority root `2.16.840.1.113883.3.564` → athenahealth
- `effectiveTime` `20260830162546-0400`

**This is not FHIR.** It is a single XML clinical document with narrative sections and coded
machine-readable entries. Nothing in the current ingestion path can read it.

### 1.1 Section inventory

23 sections, ~248 coded entries:

| Section | LOINC | Entries | Section | LOINC | Entries |
|---|---|---:|---|---|---:|
| Plan of Treatment | 18776-5 | 45 | Immunizations | 11369-6 | 9 |
| Results | 30954-2 | 52 | Family History | 10157-6 | 8 |
| Problems | 11450-4 | 34 | Procedures | 47519-4 | 7 |
| Medications | 10160-0 | 27 | Social History | 29762-2 | 5 |
| Vitals | 8716-3 | 22 | Reason for Referral | 42349-1 | 3 |
| Past Encounters | 46240-8 | 14 | Mental Status | 10190-7 | 3 |
| **Notes** | 34109-9 | **14** | Allergies / Equipment / Health Concerns / Advance Directives / Payers | — | 1 each |

Present but unpopulated: Assessment, Functional Status, Medical History, Goals, Care Team.

Entries carry proper terminology — SNOMED CT, RxNorm, LOINC — not merely narrative text. This
is a good-quality export, which is what makes the mapping below realistic.

### 1.2 Clinical notes

The Notes section holds **14 clinical notes**, base64-encoded `text/plain`, 1.5 KB–5 KB each.
They are real narrative notes and are fully recoverable. They matter: `grep_record` searches
attachment plaintext, so these become searchable alongside the Epic notes.

---

## 2. The finding that shapes the whole design

There are **two exports two weeks apart** — `ZOOMCARE_08-16-26.zip` (already in
`~/health-records/ZoomCare/`) and the new `ZOOMCARE_08-30-26.zip`.

A C-CDA is a **full snapshot**, not a delta. Every export repeats the entire record. Naive
ingestion of the second export would therefore duplicate all 248 entries — precisely the
failure mode already fixed for Epic attachments.

Whether that is avoidable depends entirely on whether identifiers are stable across exports.
**They are.** Comparing every `<id>` carrying an `extension` in the two documents:

| Root type | Aug-16 | Aug-30 | Shared |
|---|---:|---:|---:|
| OID-rooted (`…3.564` athena, `…4.6` NPI) | 621 | 621 | **621 (100 %)** |
| UUID-rooted | 19 | 19 | **0 (0 %)** |

The rule is exact: **OID-rooted identifiers are stable; UUID-rooted ones are regenerated on
every export.**

Better still, none of the 19 unstable identifiers is clinical — 16 are
`representedOrganization` (the performing lab) inside Results, 3 are payer entities. **Every
Problem, Medication, Result, Immunization, Procedure, Encounter, and Note carries a stable
OID-rooted id.**

This yields a precise identity rule (§5) and makes idempotent re-import achievable.

---

## 3. Architecture: adapters onto a common shape

The key observation: `ClientFullEHR` — `{ fhir: {resourceType: [...]}, attachments: [...] }`
— is already the interchange format between the browser retriever and the database.
`ehrToSqlite()` consumes it and knows nothing about where it came from.

So we do not need a second ingestion path. We need a second **producer**.

```
  SMART on FHIR retriever  ─┐
                            │
  C-CDA parser (new)       ─┼──▶  ClientFullEHR  ──▶  ehrToSqlite()  ──▶  SQLite
                            │                          (unchanged)
  future: CSV / PDF / bulk ─┘
```

Everything downstream — `--source` labelling, upsert semantics, the attachment uniqueness
index, `grep_record` / `query_record` / `eval_record` — works unchanged. The new surface area
is one parser plus one CLI flag.

This is the cheapest correct design, and it is only available because the `--source` and
idempotency work already landed.

---

## 4. C-CDA → FHIR R4 mapping

| C-CDA section | FHIR resource | Notes |
|---|---|---|
| Problems | `Condition` | `category=problem-list-item`; SNOMED coded |
| Health Concerns | `Condition` | `category=health-concern` |
| Medications | `MedicationStatement` | RxNorm coded; sig text → `dosage.text` (but see §9) |
| Results | `Observation` + `DiagnosticReport` | organizer → report, components → observations |
| Vitals | `Observation` | `category=vital-signs` |
| Social History | `Observation` | `category=social-history` |
| Mental Status | `Observation` | `category=survey` |
| Immunizations | `Immunization` | CVX coded |
| Allergies | `AllergyIntolerance` | |
| Procedures | `Procedure` | |
| Past Encounters | `Encounter` | |
| Family History | `FamilyMemberHistory` | not produced by the Epic path — new type |
| Plan of Treatment | `CarePlan` + `ServiceRequest` | 45 entries; largest section |
| Reason for Referral | `ServiceRequest` | |
| Medical Equipment | `Device` | |
| Payers | `Coverage` | |
| Advance Directives | `DocumentReference` | |
| Notes | `DocumentReference` + **attachment** | base64 → `contentPlaintext` |
| Care Team | `CareTeam` | empty in this export |
| Goals | `Goal` | empty in this export |
| `recordTarget` | `Patient` | |
| `author` / `performer` | `Practitioner`, `Organization` | |

### 4.1 Fidelity

C-CDA → FHIR is **lossy**. Nested `entryRelationship` chains, negation indicators, and
provenance detail have no clean R4 equivalent, and a partial mapping can silently drop
clinical meaning.

**Mitigation, and it is not optional:** always store the original XML *and* the PDF as
attachments on the `DocumentReference` representing the document itself. Then nothing is
truly lost — the mapped resources become a queryable index, while the source document remains
verbatim and greppable. If a mapping is later found to be wrong, the truth is still on disk.

---

## 5. Identity and idempotency

### 5.1 Resource IDs

Derive from the C-CDA identifier, following §2's rule:

- **OID-rooted `<id root extension>`** → deterministic id from `root|extension`. Stable
  across exports, so re-import upserts cleanly.
- **UUID-rooted or absent id** → deterministic id from a **content hash** of the entry's
  clinical fields (code, value, effectiveTime, subject), *excluding* the volatile root.
  Never derive from the UUID itself, or every export creates duplicates.

Proposed form: `ccda-<sha256(...)[:24]>` — prefixed so provenance is obvious when reading the
table, and structurally distinct from Epic's opaque ids.

### 5.2 The primary key problem

**This is the one real schema decision.**

`fhir_resources` is keyed `PRIMARY KEY (resource_type, resource_id)` — **`source` is not in
the key.** That is safe today: Epic ids are long and opaque, so two health systems will not
collide. Once we accept arbitrary formats and synthesise our own ids, the assumption no longer
holds, and a collision means one provider's record **silently overwrites** another's.

Recommendation: **add `source` to the primary key.**

```sql
PRIMARY KEY (source, resource_type, resource_id)
```

- Cost: SQLite cannot alter a primary key in place. Requires create-new / copy / swap, plus
  updating the `fhir_attachments` foreign key and the attachment uniqueness index to include
  `source`.
- Benefit: cross-source collisions become structurally impossible rather than merely
  improbable.
- Caveat: intra-document references (`subject: Patient/xyz`) are meaningful only within a
  source. Resolution logic must carry source context, and the `query_record` tool description
  should say so, so generated SQL joins on `source` too.

Do this **before** ingesting any non-Epic data, while the table holds two well-behaved sources
and the migration is cheap.

### 5.3 Regression fixture

The two ZoomCare exports are a **ready-made idempotency test**, and a better one than we would
construct: real data with real two-week drift.

```
import Aug-16     →  N resources
import Aug-30     →  N + (genuinely new entries), and NOT 2N
re-import Aug-30  →  no change at all
```

If the second import roughly doubles the row count, the identity rule is wrong. This is the
acceptance test for the whole feature.

---

## 6. Schema changes

| Change | Purpose |
|---|---|
| `source` into `fhir_resources` primary key | prevent cross-source collisions (§5.2) |
| `source` into the attachment uniqueness index | same, for attachments |
| `source_format TEXT` (`fhir` \| `ccda`) | record how a row was produced; makes lossy-mapping bugs traceable |
| `ingested_at TEXT` | when the row entered the DB — distinct from clinical dates |

`source_format` earns its place: when a mapped `Condition` looks wrong, the first question is
whether it came from a FHIR API or a C-CDA mapping.

---

## 7. CLI

```bash
bun run src/cli.ts --db ~/health-records/my_record.sqlite \
  --import-ccda ~/health-records/ZoomCare/ZOOMCARE_08-30-26.zip \
  --force-concat --source "ZoomCare"
```

- Accept a `.zip` (locating the C-CDA inside) or a bare `.xml`.
- **Zip handling must be defensive.** These archives contain absolute paths — `unzip` reported
  `stripped absolute path spec from /Document_XML/...`. Extract with paths flattened, into a
  temp directory, never trusting archive-supplied paths (zip-slip).
- Same `--force-concat` / `--force-overwrite` semantics as `--import-json`.
- `--source` should be **required** for C-CDA: unlike a FHIR pull, there is no endpoint from
  which to infer a provider name.

---

## 8. Phases

| # | Work | Gate |
|---|---|---|
| 1 | Schema migration (§6), including the PK change | Existing 4,998 rows survive; server still loads |
| 2 | Parser: Problems, Medications, Results, Vitals, Immunizations, Allergies, Procedures, Encounters, Notes | Covers ~200 of 248 entries |
| 3 | `--import-ccda` + zip handling | Idempotency fixture (§5.3) passes |
| 4 | Original XML + PDF stored as attachments | Verbatim source recoverable |
| 5 | Remaining sections: Plan of Treatment, Family History, Payers, Advance Directives | Full coverage |

Phase 1 gates everything. Phases 2–3 deliver most of the value: ZoomCare's Problems,
Medications, Results, and 14 clinical notes are the bulk of what matters clinically.

---

## 9. Open questions

- **Is `MedicationStatement` right for the Medications section?** The entries are historical
  (`historicalmedrequest-*`, `statusCode=completed`). The Epic path produces
  `MedicationRequest`. Mixing two resource types for the same clinical concept will make
  queries confusing. Pick one convention and document it.
- **Should mapped resources be marked as derived?** A `meta.tag` on every C-CDA-derived
  resource would let queries exclude them when only primary-source FHIR is wanted.
- **How should cross-source duplicates be surfaced?** ZoomCare, MultiCare, and Mayo may each
  hold the same immunization. We deliberately do not de-duplicate clinically — but with three
  sources, "show me distinct immunizations" becomes something a user actually wants. Probably
  a tool concern rather than a schema one.
- **Keep the 1.1 MB `stylesheet.xsl`?** It is a generic display stylesheet, identical across
  exports and not patient data. Recommend discarding it.

---

## 10. Explicitly out of scope

- **Clinical de-duplication across providers.** `source` records provenance; merging clinical
  facts is a much harder problem and should not be smuggled in here.
- **Writing data back to any EHR.** This pipeline is read-only by design.
- **Any change to the public site's browser-only architecture** (see the scope note).
