# Epic App Registration — Fill-Out Checklist

For registering the patient-facing app at <https://fhir.epic.com> that will power
`health.circlejtp.me`.

Design rationale: [`health.circlejtp.me-plan.md`](./health.circlejtp.me-plan.md) §7.

---

## The one field that decides everything

> ### Automatic Client Distribution → **USCDI v3**
>
> **Not `None`.** With `None`, every health system must individually download and enable
> your app by Client ID after signing the open.epic API Subscription Agreement. Mayo Clinic
> is not going to do that for a personal project. A USCDI selection auto-distributes to Epic
> organizations instead.
>
> The cost: to stay eligible, select **only USCDI-covered APIs** below. Adding anything
> outside that set can drop the app back to manual per-organization distribution — which
> makes it unusable at exactly the health systems you want.
>
> v3 over v1 because v3 adds Encounter, Coverage and SDOH, all of which appear in real
> records already collected. v1 is the fallback if v3 turns out not to reach a target system.

---

## Page 1 — Create an App

- [ ] **Application Name** — patients see this on Epic's consent screen. Choose something a
      stranger would recognize as yours and trustworthy. Avoid internal/working names.
- [ ] **Application Audience** → `Patients`
- [ ] **Automatic Client Distribution** → `USCDI v3`  ← see above
- [ ] **Public Documentation URL** → `https://health.circlejtp.me`
      (live; switch the protocol dropdown to `https://`)

## Incoming APIs

Epic splits these by category, so search each resource name and add **every R4 `.Read` and
`.Search` variant** offered. Add both — the retriever searches by patient, then reads
referenced resources.

Based on what real pulls actually returned across MultiCare, Mayo, UW and ZoomCare:

- [ ] `Patient`
- [ ] `Observation` — the most variants: Labs, Vitals, Social History, SDOH, Functional
      Status, Disability Status, Mental Health
- [ ] `Condition` — Problems, Health Concern, Encounter Diagnosis
- [ ] `MedicationRequest`
- [ ] `Medication`
- [ ] `MedicationDispense`
- [ ] `AllergyIntolerance`
- [ ] `Immunization`
- [ ] `Procedure`
- [ ] `DiagnosticReport`
- [ ] `DocumentReference`  ← clinical notes; high value
- [ ] `CarePlan`
- [ ] `CareTeam`
- [ ] `Goal`
- [ ] `Encounter`
- [ ] `Coverage`
- [ ] `Specimen`
- [ ] `ServiceRequest`
- [ ] `Device`
- [ ] `Practitioner`
- [ ] `Organization`
- [ ] `Location`

### Do not select "every R4"

Selecting every R4 API **disqualifies the app from automatic distribution**. Epic's rule is
that a qualifying app's APIs must be limited to the USCDI set; anything outside it reverts to
manual per-organization approval, which is the failure mode that makes an app unreachable at
a health system like Mayo Clinic.

**There is no published list.** Epic's patient-facing-apps documentation does not enumerate the
qualifying APIs, and the app registration form has no USCDI filter in its search box. The form's
own markup is the only authority: each qualifying option carries `data-uscdi-readonly="True"`
inside the hidden `#WebServicesChosen` select.

So extract the list from the form rather than working from any list written down elsewhere,
including this one.

**1. Clear the current selection.** Select everything in the Selected box and click `<<`.

**2. Print the list** (read-only; in Chrome it also copies to the clipboard):

Wrapped in an IIFE deliberately: the page defines a global `opts`, and a top-level `const opts`
fails with "Can't create duplicate variable that shadows a global property". It returns the list
as a string so it prints in the console result for right-click → Copy, rather than relying on
`copy()`, which differs between Safari and Chrome.

```js
(() => {
  let found = [...document.querySelectorAll('#WebServicesChosen option[data-uscdi-readonly="True"]')];
  if (!found.length) {
    const any = [...document.querySelectorAll('[data-uscdi-readonly]')];
    console.log('fallback: elements carrying the attribute =', any.length);
    if (any.length) {
      console.log('example parent:', any[0].parentElement && any[0].parentElement.id);
      found = any.filter(el => el.getAttribute('data-uscdi-readonly') === 'True');
    }
  }
  const list = found.map(el => el.textContent.trim()).filter(Boolean).sort();
  console.log('USCDI-eligible APIs: ' + list.length);
  console.log(list.join('\n'));
  return list.join('\n');
})();
```

A count of 0 with a non-zero fallback line means Epic moved the attribute to a different
container; the logged parent id says where.

**3. Select exactly those.** Epic's page loads jQuery, so the original recipe works:

```js
$("#WebServicesChosen option[data-uscdi-readonly=True]").each((i, item) => {
  var id = $(item).val()
  $(`#availableWebServices li[id=${id}]`).addClass("active")
})
```

Equivalent without jQuery, likewise wrapped:

```js
(() => {
  const ids = [...document.querySelectorAll('#WebServicesChosen option[data-uscdi-readonly="True"]')]
    .map(o => o.value);
  let hit = 0;
  ids.forEach(id => {
    const li = document.querySelector('#availableWebServices li[id="' + CSS.escape(id) + '"]');
    if (li) { li.classList.add('active'); hit++; }
  });
  console.log('highlighted ' + hit + ' of ' + ids.length);
  return hit;
})();
```

**Use Chrome.** If `highlighted N of N` succeeds but `>>` moves nothing, the widget is driven by
JS events rather than the `active` class alone; the recipe was written against Chrome.

Then click `>>`.

**4. Verify before saving.** The banner must read:

> Client IDs for this app **WILL** be automatically downloaded to certain customer systems
> upon marking it ready for production.

Anything else means something outside USCDI is still selected.

Selecting all USCDI-marked entries pulls in some DSTU2/STU3 variants alongside R4. That is
harmless — they are all in the qualifying set — and it matches the recipe known to produce the
banner above, so prefer it over hand-trimming to R4 only.

`Binary.Read (Clinical Notes)` and `Binary.Read (Generated CDAs)` are inside USCDI, so clinical
notes survive the trim. Generated CDAs feed the C-CDA parser in `src/ccdaToEhr.ts`.

Recipe adapted from <https://gist.github.com/cooperka/c9d325983af71c73e65a654f9b9a0aff>.

## Later pages

- [ ] **Redirect URI** → `https://health.circlejtp.me/ehr-callback`
- [ ] **Second Redirect URI** → `https://localhost:8443/ehr-callback`
      (keeps a local development path; the repo already ships mkcert certs for that port)
- [ ] **Confidential client?** → **No.** This is a public client; browser JavaScript cannot
      hold a secret.
- [ ] **PKCE** → `S256` (already implemented in `ehretriever.ts`)
- [ ] **FHIR version** → `R4`
- [ ] Production redirect URIs must be **HTTPS** — no plain-http entries.
- [ ] A `localhost` redirect is fine during the Test phase, but Epic may block *marking the
      app ready for production* while one is present. Remove it at that point;
      `health.circlejtp.me/ehr-callback` is the one that matters.

---

## Before submitting

- [ ] `https://health.circlejtp.me` loads and shows the warning (Epic reviews this page)
- [ ] Decide the **named operator** (plan §10) — the disclaimer names whoever is
      responsible, and publishing under a personal name carries exposure an entity does not.
      Much harder to change after submission.
- [ ] Legal review (plan §11) — a gate on *enabling the connect flow*, not on submitting the
      registration.

## After approval

1. Set `EPIC_CLIENT_ID` in `site/wrangler.jsonc` to the issued client id.
2. Build the retriever bundle into `site/public/` and point it at `/brands/epic.json`.
3. `npx wrangler deploy`.
4. Verify: `/healthz` should report `connectEnabled: true`.

Note that step 1 alone is not enough — the connect flow also needs the retriever bundle
present, so it cannot be switched on accidentally.
