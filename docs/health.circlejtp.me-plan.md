# health.circlejtp.me — Plan

A self-hosted deployment of the SMART on FHIR record retriever, with a landing page that
explains the user's legal right to their record and warns them, unambiguously, about what
they take on when they exercise it.

**Status:** planning. Nothing here is deployed yet.

> **This document contains draft legal language written by a non-lawyer.** The warning and
> disclaimer sections are drafted to be clear and honest, not to be enforceable. Liability
> disclaimers vary by jurisdiction and some cannot be disclaimed at all. Have counsel review
> before this goes live. See [Legal review checklist](#11-legal-review-checklist).

---

## 1. Why this site exists

Two audiences, one page:

1. **Patients** — people who want a copy of their own medical record and need to understand,
   before they start, that the copy becomes theirs to protect.
2. **Epic** — app registration requires a **Public Documentation URL**. This page is that URL.
   It needs to credibly describe what the app does, who operates it, and how data is handled.

The second audience is why this page cannot be a stub. Epic reviews it.

---

## 2. What actually happens (the factual basis for every claim on the page)

Every privacy claim below is a consequence of the architecture, not a promise. This matters:
we should only assert what the code actually does.

```
  Health system (Epic)                  User's browser                  User's disk
  ────────────────────                  ──────────────                  ───────────
  authorize  ──────────────────────────▶  SMART login + consent
  token      ◀─────────────────────────▶  PKCE code exchange
  FHIR R4    ─────────────────────────▶   fetch + parse attachments
                                          build ClientFullEHR  ────────▶  ehr-data.json
```

**The server never sees the record.** `health.circlejtp.me` serves static HTML/JS. The browser
talks directly to the health system's token and FHIR endpoints. In the download flow there is
no POST to any server we operate — the file is written by the browser to the user's disk.

Verified in code:
- `ehretriever.ts` — `initiateSmartAuth()` does SMART discovery, PKCE (S256), redirect to the
  health system's own authorization endpoint.
- Token exchange posts directly to the health system's `token_endpoint`.
- With no delivery target configured, the retriever shows a Download button and calls
  `triggerJsonDownload(...)`. No network egress to our origin.

**Consequences we may truthfully state:**
- We do not receive, store, or transmit the record.
- We cannot access it, produce it under subpoena, or leak it — we never hold it.
- We have no accounts, no server-side logging of health data, and no analytics on the record.

**Consequence we must NOT obscure:** none of that protects the file once it lands on the user's
disk. That is the entire point of the warning.

---

## 3. Page structure

Single page, top-to-bottom narrative. The warning is not buried in a footer or a linked
"Terms" page — it sits above the action, and the action is gated behind acknowledging it.

| # | Section | Purpose |
|---|---------|---------|
| 1 | Hero | What this is, in one sentence |
| 2 | Your right to this data | Cures Act / HIPAA access right, with citations |
| 3 | **Before you begin — read this** | The warning. Visually dominant. |
| 4 | How it works | The data-flow diagram from §2 |
| 5 | What we do not do | The architectural privacy claims |
| 6 | Protecting the file | Practical, actionable security guidance |
| 7 | Connect | Gated behind the acknowledgment checkbox |
| 8 | Disclaimer | No warranty, no liability |
| 9 | References | Statutes, regulations, official guidance |

---

## 4. Draft copy

### 4.1 Hero

> ## Get a copy of your own medical record
>
> Connect to your health system and download a complete, machine-readable copy of your
> medical record — conditions, medications, lab results, immunizations, clinical notes and
> attachments — directly to your own computer.
>
> Federal law gives you the right to this data. This tool helps you exercise it.
>
> **The copy is yours. So is the responsibility for protecting it.** Read the warning below
> before you begin.

### 4.2 Your right to this data

> ### Federal law is on your side
>
> The **21st Century Cures Act** (Pub. L. No. 114-255) and the regulations implementing it
> require certified health IT to give you standardized API access to your electronic health
> information — the same mechanism this tool uses.
>
> - **Your right of access.** Under HIPAA, you have the right to obtain a copy of your health
>   information, and to direct a covered entity to send it to a third-party application you
>   choose. *45 CFR § 164.524(a)(1), (c)(2)(ii), (c)(3)(ii).*
> - **Standardized API access.** Certified health IT must support a standardized FHIR-based
>   API for patient access. *45 CFR § 170.315(g)(10).*
> - **Information blocking.** Health care providers, health IT developers, and health
>   information networks may not unreasonably interfere with your access to your electronic
>   health information. *45 CFR Part 171.*
> - **Payer data.** CMS-regulated payers must expose claims and encounter data through a
>   patient access API. *CMS Interoperability and Patient Access Final Rule (CMS-9115-F).*
>
> This tool is a standard SMART on FHIR application. Your health system authenticates you
> directly and asks for your consent. We never see your credentials.

### 4.3 The warning — primary copy

Visual treatment: full-width panel, high-contrast border, warning icon, largest body type on
the page. Not dismissible. Not collapsed by default.

> ## ⚠ Before you begin — please read this carefully
>
> ### This creates a permanent copy of your medical record on your computer.
>
> When you use this tool, a complete copy of your health information is downloaded to the
> device you are using. That file may include:
>
> - Diagnoses and medical conditions, including ones you may consider sensitive
> - Medications, including psychiatric and substance-use treatment
> - Laboratory and diagnostic results
> - Clinical notes written about you by your care team
> - Immunizations, procedures, allergies, and care plans
> - Insurance and demographic information
> - Scanned documents and attachments
>
> **This is among the most sensitive information that exists about you.**
>
> ### Once it is on your computer, HIPAA no longer protects it.
>
> This is the part people most often misunderstand, so we want to be direct about it.
>
> HIPAA governs your health system, not you and not this tool. The U.S. Department of Health
> and Human Services has stated plainly that the HIPAA Rules **"do not impose any restrictions
> on how an individual or the individual's designee, such as an app, may use the health
> information that has been disclosed pursuant to the individual's right of access."**
>
> The moment that file is written to your disk, the legal protections that applied to it
> inside your health system's systems no longer apply. There is no federal agency overseeing
> how that copy is stored on your laptop.
>
> ### Protecting it is entirely your responsibility.
>
> You — and only you — are responsible for the confidentiality, integrity, and security of
> the copy you create. That includes every consequence of it being exposed, whether through:
>
> - A lost, stolen, or unencrypted device
> - An unencrypted backup, or a cloud sync folder you forgot was syncing
> - Malware, or another person with access to your computer
> - Sending, sharing, or uploading the file — including to an AI service or chatbot
> - Any other disclosure, intentional or accidental
>
> Disclosure of this information can affect your employment, your relationships, your
> insurance, and your safety. Health information cannot be un-disclosed. Unlike a password,
> you cannot rotate your diagnoses.
>
> ### We accept no responsibility or accountability for what happens next.
>
> We do not receive, store, or transmit your health information at any point — it travels
> from your health system directly to your browser and onto your device. We therefore have
> no ability to protect, recover, delete, or control that copy.
>
> **By choosing to download your record, you accept sole and complete responsibility for it.
> We disclaim any and all responsibility, accountability, and liability for the security,
> confidentiality, storage, use, disclosure, or loss of the copy you create, and for any
> harm arising from it.**
>
> If you are not prepared to secure this file yourself, **do not proceed.**

### 4.4 What we do not do

> ### We never see your record
>
> - **No servers.** This page is static. Your browser talks directly to your health system.
> - **No credentials.** You log in on your health system's own site. We never see your
>   username or password.
> - **No copies.** Your record is never transmitted to us. We could not produce it if
>   compelled to, because we never have it.
> - **No accounts, no tracking of your health data.**
>
> This is a design choice, not a policy promise — the architecture makes it so.

### 4.5 Protecting the file

> ### If you proceed, do these things
>
> 1. **Turn on full-disk encryption.** FileVault on macOS, BitLocker on Windows, LUKS on
>    Linux. Without it, anyone with the device has the file.
> 2. **Know where the file went.** It downloads to your Downloads folder by default. Move it
>    somewhere deliberate.
> 3. **Keep it out of cloud sync.** Desktop, Documents, and Downloads are often synced to
>    iCloud, OneDrive, Dropbox, or Google Drive automatically. Verify.
> 4. **Restrict permissions.** On macOS/Linux: `chmod 600` the file, `chmod 700` its folder.
> 5. **Think hard before sharing it.** Including with AI assistants — anything you paste may
>    be retained and reviewed.
> 6. **Delete it when you are done**, and empty the trash.
> 7. **On a shared or public computer, do not do this at all.**

### 4.6 Consent gate

The connect button is disabled until the box is checked. Checkbox state is not persisted —
it must be checked each visit.

> ☐ I have read the warning above. I understand that a copy of my medical record will be
> stored on this device, that HIPAA protections do not extend to that copy, and that I am
> solely responsible for its security. I accept that the operators of this site bear no
> responsibility or liability for it.
>
> [ Connect to my health system ]

### 4.7 Disclaimer

> ### Disclaimer
>
> This tool is provided **"as is" and "as available", without warranty of any kind**, express
> or implied, including but not limited to warranties of merchantability, fitness for a
> particular purpose, accuracy, completeness, and non-infringement.
>
> **Not medical advice.** This tool retrieves and displays records. It does not interpret
> them. Nothing here is medical advice. Do not make health decisions based on this data
> without consulting a qualified clinician.
>
> **No guarantee of completeness or accuracy.** The data comes from your health system. It
> may be incomplete, out of date, or wrong. A record retrieved here is not a certified copy
> of your legal medical record. Records held by other providers will not appear. For an
> official copy, contact your health system's medical records department.
>
> **No liability.** To the maximum extent permitted by law, the operators shall not be liable
> for any direct, indirect, incidental, special, consequential, or exemplary damages arising
> from the use of this tool or from the creation, storage, disclosure, or loss of any copy of
> health information created through it.
>
> **Independent operator.** This site is not affiliated with, endorsed by, or sponsored by
> Epic Systems Corporation or any health system.

### 4.8 References

Every citation linked to its authoritative source:

| Reference | Citation | Link |
|---|---|---|
| 21st Century Cures Act | Pub. L. No. 114-255 | congress.gov |
| ONC Cures Act Final Rule | 85 FR 25642 | federalregister.gov |
| HIPAA right of access | 45 CFR § 164.524 | ecfr.gov |
| Standardized API criterion | 45 CFR § 170.315(g)(10) | ecfr.gov |
| Information blocking | 45 CFR Part 171 | ecfr.gov |
| CMS Interoperability & Patient Access | CMS-9115-F | cms.gov |
| OCR: access right, health apps & APIs | — | hhs.gov |
| FTC Health Breach Notification Rule | 16 CFR Part 318 | ecfr.gov |

---

## 5. Brand directory refresh

**The problem this solves.** The brand file bundled with the upstream project was generated
**2025-04-06**. By August 2026 it listed Mayo Clinic at `mcc.api.mayo.edu`, a hostname whose
CNAME no longer resolves. The connect flow failed with an opaque "Load failed" and no way for
a user to diagnose it. A directory that goes stale is a silent, growing outage.

### 5.1 Source

```
https://open.epic.com/Endpoints/Brands
```

Verified characteristics:

| Property | Value |
|---|---|
| Format | FHIR `Bundle` — `Organization` + `Endpoint` resources |
| Size | ~90 MB (94,601,978 bytes as of 2026-08-30) |
| Content | 96,627 Organizations, 817 Endpoints |
| Headers | `Cache-Control: private`; **no `ETag`, no `Last-Modified`** |
| Download time | ~4–5 minutes (~350 KB/s observed) |

**No cheap change detection.** Without `ETag`/`Last-Modified`, a `HEAD` request tells us
nothing. The job must download the full bundle and compare content hashes.

### 5.2 Pipeline

```
open.epic.com/Endpoints/Brands          (~90 MB raw bundle)
        │
        ▼  static/brands/process-brands.ts --brands <bundle>
   epic.json                             (~49 MB, ~3.7 MB gzipped)
        │
        ▼  publish
   health.circlejtp.me/brands/epic.json
```

The processing script already exists and runs in under a second.

### 5.3 Schedule and job design

**Weekly**, Sundays 06:00 UTC. Epic's directory changes on the order of organizations
onboarding and endpoints migrating — daily is wasteful for a 90 MB download, monthly leaves
too long a window for a dead-endpoint outage like Mayo's.

```
1. Download the bundle (retry with backoff; the endpoint is slow and occasionally times out)
2. Sanity-gate the download:
     - parses as JSON
     - resourceType == "Bundle"
     - Organization count within ±20% of the previous run   ← guards against truncation
3. Run process-brands.ts
4. Hash the output; compare to the currently published hash
5. If unchanged → exit, log a no-op
6. If changed → publish, and record a summary:
     - orgs added / removed
     - endpoint URLs changed  ← the Mayo case; worth alerting on
7. On failure → alert, and leave the existing file in place
```

**Step 2 is not optional.** A truncated 21 MB download would otherwise silently publish a
directory missing three quarters of all health systems. Fail closed: a stale directory is
much better than a broken one.

### 5.4 Storage

Do **not** commit the bundle or the processed output to git. A 49 MB file committed weekly
adds ~2.5 GB/year of history that can never be pruned without a rewrite. Instead:

- Raw bundle: discarded after processing (re-downloadable at any time)
- Processed `epic.json`: **Cloudflare R2**, served via the site
- Only the pipeline code lives in git

Cloudflare compresses on the fly, so the wire cost is ~3.7 MB.

### 5.5 Possible optimization (not required for v1)

`epic.json` is 49 MB largely because it carries a per-facility entry with full address for
96,627 organizations. A slimmer search index — brand name, id, endpoint URL, plus a separate
lookup for facility detail — would cut this by an order of magnitude. Worth doing only if
load time proves to be a problem in practice.

---

## 6. Infrastructure

| Concern | Decision |
|---|---|
| Host | Cloudflare Pages, subdomain `health.circlejtp.me` |
| Build | Static; retriever bundled via `scripts/build-ehretriever.ts` |
| Brand file | Cloudflare R2, refreshed by the weekly job |
| TLS | Cloudflare-managed |
| Headers | HSTS; strict CSP; `Referrer-Policy: strict-origin-when-cross-origin` |
| Analytics | None on the connect flow. If any, privacy-preserving and never on record data. |

**CSP note.** The retriever must `fetch` arbitrary health-system FHIR endpoints, so
`connect-src` cannot be locked to `'self'`. Everything else (`script-src`, `style-src`)
should be tightly restricted.

---

## 7. Epic app registration

The registration form is already open and partially filled. Decisions that bind to this site:

| Field | Value | Note |
|---|---|---|
| Application Name | TBD | Patients see this on the Epic consent screen — choose something recognizable |
| Application Audience | Patients | |
| **Automatic Client Distribution** | **USCDI v3** | Critical. `None` requires each organization to enable the app individually. |
| Public Documentation URL | `https://health.circlejtp.me` | **Must be live before submitting** |
| Redirect URI | `https://health.circlejtp.me/ehr-callback` | Plus `https://localhost:8443/ehr-callback` for local development |
| Confidential client | **No** — public client | Browser JS cannot hold a secret |
| PKCE | S256 | Already implemented |
| FHIR version | R4 | |

**Constraint on API selection:** to stay eligible for automatic distribution, select only
USCDI-covered APIs. Adding others can drop the app back to manual per-organization
distribution, which is what makes an app unusable at a health system like Mayo.

---

## 7.1 Registration outcome (2026-08-30)

App **My Health Record Access** created. Client IDs issued (not secret — a public client's id
ships in the browser bundle by design):

| | |
|---|---|
| Production Client ID | `0eb38377-086f-4850-98b3-db0bac91e332` |
| Non-Production Client ID | `8d804225-8ca7-430b-99f1-2b7762258e09` |

**Marking the app ready for production is a one-way door.** Epic states the app cannot be
edited afterwards, so use *Save & Ready for Sandbox* until everything is settled.

Settings worth not changing without understanding why:

- **FHIR ID Generation Scheme → Use Unconstrained FHIR IDs.** The alternative truncates ids
  to 64 characters for USCDI resources. Real Epic ids already collected run past 90
  characters, and `resource_id` is part of the database primary key, so truncation would
  change identity and break idempotent re-import.
- **SMART Scope Version → SMART v1.** Then the retriever must request `patient/*.read`.
  The `patient/*.rs` string in the inherited configs is SMART **v2** syntax and will not work
  against a v1 registration.
- **Intended Purposes → Individuals' Access to their EHI**, Intended Users →
  Individual/Caregiver. "Research" is about research *use* of data and does not apply here.

Fields that did not persist through the first save, so re-check them: **Public Documentation
URL** reverted to the `http://www.example.com` placeholder.

### Submitted copy

Patients see these on Epic's consent screen, and Epic's reviewers read them, so both lead with
the data flow rather than with features: that is the unusual property here, it is the basis for
every privacy claim the site makes, and it distinguishes this from apps that aggregate records
server-side. The responsibility shift is stated here as well as on the site so the registration
matches what a patient actually encounters.

**Summary**

> This app lets you download a copy of your own health record as a JSON file directly to your
> device, after you acknowledge that securing that data becomes your responsibility. It is
> intended to help people study and understand their own health history.

**Description**

> My Health Record Access helps you obtain a complete copy of your own medical record and save
> it directly to your computer, in a standard machine-readable format you can keep, search, and
> use however you choose.
>
> You sign in with your health system directly — this app never sees your username or password.
> Your record is then fetched by your own browser and written straight to your device. It is
> never transmitted to, or stored on, any server operated by this app. There are no accounts,
> and no tracking of your health information.
>
> Because the copy lives on your device, protecting it becomes your responsibility. HIPAA's
> protections apply to your health system, not to a file on your own computer. The app states
> this plainly before you connect and asks you to acknowledge it.
>
> Federal law — the 21st Century Cures Act and your HIPAA right of access — gives you the right
> to this data. This is an independent, free, non-commercial tool that helps you exercise it.

### Data Use Questionnaire answers

Health systems rely on these when deciding whether to trust the app, so each is derived from
what the code does rather than from what reads best. Recorded verbatim because the app becomes
uneditable once marked ready for production.

**1. Where does this app store user data? (Select all that apply.)**
> `This app can store user data locally on the user's device.` — this option only.

`This app does not store user data.` is **not** selected: the download writes a file to the
user's disk and sessionStorage briefly holds the token, both of which are storage on the device.

**2. For how long does this app store user data?**
> `This app stores your data for:` with the text
> *"the browser session only; any downloaded copy remains on the user's device under the user's
> sole control until they delete it"*

`This app stores your data indefinitely.` is not selected — it reads as the developer retaining
data, which never happens.

**3. Does this app allow users to delete all of the data that have been stored about them?**
> `Yes, this app allows users to delete all of the data that have been stored about them.`

**4. Other than the user, who has access to user data? (Select all that apply.)**
> `No one; data never leaves the user's device.` — this option only.

The "users authorize" options are not selected: the app provides no sharing mechanism, and a
user forwarding the file themselves is not the app granting access.

**5. Does the app developer allow users to obtain a complete record of the data that have been
collected about them?**
> `Yes, the app developer allows users to obtain a complete record of the data that have been
> stored about them.`

**6. Does the app developer use data about a user for reasons other than providing direct
services to the user?**
> `No, the app developer doesn't use data about users beyond providing direct services.` — this
> option only.

**7. What other individuals from the user's health record does the app use data about beyond
providing direct services? (Select all that apply)**
> `No one.` — this option only.

The record may contain RelatedPerson entries, but the app does not *use* that data; it hands
the whole record to the user.

**8. Does this app allow users to obtain a complete record of who has accessed data about them?**
> `Yes, this app allows users to obtain a complete record of who has accessed data about them.`

**9. Is user data retained after a user deletes the app and closes their account?**
> `No.`

#### On questions 5 and 8

Nothing is collected and nobody accesses anything, and neither question offers an "N/A".
"Yes, complete" was chosen because the "No" options carry a false implication — *does not allow
users to obtain a record of the data stored about them* reads as withholding data the developer
holds, and there is none. The counter-argument is that "Yes" may imply a data-access-request
feature that does not exist; the substance is that there is nothing to show because nothing
exists, and "Yes" conveys that better than "No". Revisit if counsel disagrees.

**These answers commit the project to the browser-only architecture.** Combined with Epic making
the app uneditable once production-ready, introducing any server-side component that received
record data would render them false with no way to correct them.

Still outstanding on the form: Terms and Conditions URL (now `https://health.circlejtp.me/terms`),
the Description field, the Data Use Questionnaire, and accepting the open.epic terms of use.

---

## 8. Build order

| # | Step | Status |
|---|---|---|
| 1 | Domain / DNS for `health.circlejtp.me` | **done** — custom domain on the Worker |
| 2 | Ship the landing page (warning + consent gate are v1, not a follow-up) | **done** — live |
| 3 | Brand refresh job; publish `epic.json` to R2 | **done** — seeded, weekly cron `0 6 * * SUN` |
| 4 | Wire the retriever build to the brand file; verify a real connect end to end | not started |
| 5 | Legal review (§11) — a gate, not a formality, given §9.1 | **outstanding** |
| 6 | Submit the Epic app registration with the live documentation URL | ready to submit |

**Deployed 2026-08-30 with `EPIC_CLIENT_ID` empty.** This was deliberate: it gives Epic a live
Public Documentation URL to review, so registration lead time runs in parallel with legal
review rather than after it, while nobody can actually download a record. The page states
plainly that the connect flow is unavailable instead of offering a button that would fail.

Two independent things must both land before anyone can use it — setting `EPIC_CLIENT_ID`,
and building the retriever bundle into the site. Neither happens by accident, so steps 4 and 5
still gate the functional launch.

Do not enable the connect flow on a page whose legal language has not been reviewed.

---

## 9. Decisions made

### 9.1 This is an open tool, offered publicly

Anyone may use it. It is not personal infrastructure with incidental public access.

This is a deliberate choice and it raises the stakes on everything in §4 and §10:

- **The warning carries more weight, not less.** Users will arrive with no context, varying
  technical skill, and no relationship to the operator. The warning is the only thing standing
  between a person and a decision they cannot reverse. It must be readable by someone who has
  never heard the term "PHI" — which is why §4.3 avoids jargon and says "your diagnoses"
  rather than "your protected health information."
- **A duty of care plausibly attaches** that would not attach to a private tool. This makes
  legal review a gate on launch (§8), not a nicety.
- **The FTC Health Breach Notification Rule question becomes material**, not academic. See
  §10.
- **The named operator matters more.** Publishing under an individual's own name carries
  personal exposure that an entity does not. Resolve before launch.

What does *not* change: we still never receive the data. The architecture in §2 is what makes
offering this publicly defensible at all — there is no central store to breach, and no
population of records to lose.

### 9.2 The named operator is JT Perry

The site is operated by **JT Perry** (`jt.perry@gmail.com`) as an independent individual, and
says so in the disclaimer and the footer.

This was chosen with the trade-off understood: an individual's own name carries personal
liability in a way an entity does not, and the exposure grows because the tool is offered
publicly (§9.1). It remains on the list for counsel (§11) — forming an entity later is
possible, but the name is already published from this point.

Two practical consequences:

- A personal address on a public page will be harvested. If the volume becomes a problem, a
  Cloudflare Email Routing alias on `circlejtp.me` forwards to the same inbox and can be
  rotated without editing the site.
- The contact copy says plainly that there is nothing to request, correct, or delete, because
  no health information is held here. Without that, a contact address on a page about medical
  records invites requests that cannot be fulfilled.

### 9.3 `epic.json` is never committed to git

Confirmed. The processed brand file is published to R2 by the weekly job (§5.4); only the
pipeline code is versioned. Weekly commits of a 49 MB artifact would add roughly 2.5 GB of
unprunable history per year.

---

## 10. Open questions

- **Does the FTC Health Breach Notification Rule (16 CFR Part 318) apply?** It covers vendors
  of personal health records *not* covered by HIPAA. A static site that never receives or
  holds health data is arguably outside it — but "arguably" is doing work in that sentence.
  Confirm with counsel — see §9.1, which makes this material.
- **Jurisdiction / governing law clause?**
- **Do we want an incident contact address**, even though we hold no data?

---

## 11. Legal review checklist

Bring to counsel:

- [ ] Warning language — is it sufficient to establish informed consent?
- [ ] Liability disclaimer — enforceability in the operating jurisdiction
- [ ] Whether the consent checkbox creates an enforceable agreement
- [ ] Entity structure — the named operator is decided (§9.2), but whether it should
      remain an individual rather than an entity is still a question for counsel
- [ ] FTC Health Breach Notification Rule applicability (§10)
- [ ] Duty of care arising from offering this publicly (§9.1)
- [ ] Accuracy of every statutory citation in §4.2 and §4.8
- [ ] Epic's requirements for a Public Documentation URL and any terms attached to app
      registration

---

## Appendix: what prompted this

Built after using the upstream tool to assemble a personal record across two health systems.
Three things surfaced that this plan responds to:

1. **Attachment ingestion was not idempotent** — re-running an import duplicated every note
   and PDF. Fixed upstream in PR #10.
2. **Records from different health systems were indistinguishable once merged** — no
   provenance column. Fixed by `--source`.
3. **The bundled brand directory was 17 months stale**, pointing at a decommissioned Mayo
   Clinic endpoint, and failed with an unhelpful error. §5 exists so this cannot recur here.
