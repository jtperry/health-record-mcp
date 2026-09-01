# health.circlejtp.me

Cloudflare Worker serving the landing page and (once Epic registration is approved) the
browser-only SMART on FHIR record retriever.

Design and rationale: [`../docs/health.circlejtp.me-plan.md`](../docs/health.circlejtp.me-plan.md).

## What the Worker does — and deliberately does not

It serves static assets, sets security headers, and hands out the Epic brand directory
from R2. **It never touches health data.** The record travels from the health system to
the user's browser to their disk, never through here. Every privacy claim on the landing
page depends on that remaining true, so do not add anything that receives record content.

## Routes

| Route | Behaviour |
|---|---|
| `/` | Landing page. The Worker injects `data-connect-enabled` so the connect button is only offered when it can actually work. |
| `/brands/epic.json` | Epic brand directory, from the R2 `BRANDS` bucket. 503 if not yet seeded. |
| `/ehr-connect`, `/ehr-callback` | The retriever SPA, once built. Until then, redirects to `/#connect`. |
| `/healthz` | Deployment state: whether a client id is configured and whether the directory is present. |

## Brand directory

Stored **uncompressed** in R2 as `epic.json` (~47 MB), and refreshed weekly by the
`scheduled` handler (Sundays 06:00 UTC) from <https://open.epic.com/Endpoints/Brands>.

Two things worth knowing before changing this:

- **Do not store it pre-gzipped.** Serving a gzipped R2 body with a hand-set
  `Content-Encoding` does not round-trip — the runtime does not treat an R2 body as
  already-encoded and clients fail to decode it. Plain JSON lets Cloudflare compress at
  the edge, and pick brotli where supported.
- **The refresh fails closed.** The source publishes no `ETag` or `Last-Modified`, so
  change detection means downloading the whole ~90 MB bundle. If it does not parse as a
  FHIR Bundle, or the organization count moves more than ±20%, the existing directory is
  kept. Publishing a truncated directory is much worse than serving a stale one: users
  simply would not find their provider, with no error explaining why.

`processBrands` is a port of `static/brands/process-brands.ts` and must stay faithful to
it. The hierarchy matters — endpoints hang off the *primary* brand while ~95k facilities
inherit them via `partOf`. Emitting only orgs that directly carry an endpoint would cut
the directory from 96,627 searchable items to ~1,270.

## Working on the UI

### The landing page has a structure that is not a style choice

Full rationale in [`../docs/health.circlejtp.me-plan.md`](../docs/health.circlejtp.me-plan.md)
§3–4; the constraints that survive a redesign are these.

One page, read top to bottom, in this order: hero; your right to this data; **the warning**;
how it works; what we do not do; protecting the file; connect; disclaimer; references.

The warning is the reason the page exists. It sits **above** the action, never in a footer or
behind a "Terms" link, and its treatment is specified: full-width panel, high-contrast border,
warning icon, the largest body type on the page, **not dismissible and not collapsed by
default**. Making it tidier by shrinking it, folding it into an accordion, or moving it below
the fold defeats the page. Sections 2, 5 and 9 make legal and factual claims with citations —
edit their presentation, not their words.

### The consent gate is functional, not decorative

Three conditions, all required: the warning has been scrolled to its end, which unlocks the
checkbox; the checkbox is ticked, which unlocks the button; and a client id is configured on
the Worker, which is what `data-connect-enabled` reports. Consent is deliberately not
persisted — it is given again on every visit.

**Gate the button with the platform `disabled` attribute.** The original design prototype used
`aria-disabled` plus `pointer-events: none`, which is not enforcement: keyboard and assistive
technology users can still activate such a control. This is the single easiest thing for a
design pass to reintroduce, and it converts an informed-consent gate into a picture of one.

### Accessibility

**This site is built to meet WCAG 2.2 Level AA.** If you find somewhere it does not, please
tell us by opening an issue: <https://github.com/jtperry/health-record-mcp/issues>.

That bar is not decoration here. The page exists to make sure people understand a warning
before acting on it, so an inaccessible warning is a failed warning — and the audience, people
retrieving their own medical records, skews toward disability and assistive technology use.

The page already ships semantic landmarks, every `section` tied to its heading with
`aria-labelledby`, an unbroken `h1` → `h2` → `h3` order, `:focus-visible` styling,
`role="status"` on the gate's live region, `aria-describedby` on the consent checkbox, and a
`prefers-reduced-motion` block. A redesign must not regress any of it. Check contrast against
rendered colours rather than by eye, keep the page usable at 320px and at 200% zoom, and test
the consent gate by keyboard alone — that path is where a redesign breaks it.

The consent checkbox is 22×22 CSS px. It **passes** SC 2.5.8 on the spacing exception, verified
below rather than assumed — but 24×24 would remove the argument, so prefer that if you are
touching it anyway.

#### Running the tests

```bash
npx @axe-core/cli@4 https://health.circlejtp.me \
  --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa
```

Repeat for `/terms` and for `/ehr-connect?preview=<PREVIEW_TOKEN>&brandTags=epic^sandbox`. All
three were at 0 violations and 0 incomplete as of 2026-09-01 (axe-core 4.13).

**A clean run here does not mean the gate was tested.** The consent checkbox is `disabled` on
load and axe skips disabled controls, so a plain scan never evaluates it — `#consent` does not
even appear in the `target-size` results. To test the state a user actually reaches, serve a
copy of `public/index.html` with the gate script removed and the `disabled` attributes stripped,
and scan that too. That run is what confirms the checkbox and the connect button.

Then walk the gate by keyboard, which no scanner can do: `End` must unlock the checkbox — the
scroll condition has to be satisfiable without a mouse — `Space` must tick it, and the button
must stay disabled while no client id is configured, with the `role="status"` region explaining
each transition. Gate with the platform `disabled` attribute; `aria-disabled` must stay absent.

Automated testing catches 20–50% of issues. Screen-reader announcement quality, reading order,
rendered focus visibility, and reflow at 320px and 200% zoom still need a human.

### What is editable here, and what is not

| Path | |
|---|---|
| `public/index.html` | Landing page. Hand-authored, edit freely. |
| `public/terms.html` | Terms. Hand-authored, edit freely. |
| `public/fonts/`, `public/icon.png`, `public/apple-touch-icon.png` | Assets, edit freely. |
| `design/Medical Record Download.dc.html` | Design canvas for the landing page. |
| `public/ehretriever.html` | **A copy of `../static/ehretriever.html`.** Editing it here forks it from the version the rest of the repository builds. |
| `public/dist/ehretriever.bundle.js` | **Build output. Never hand-edit.** |

The bundle is compiled from `../ehretriever.ts` and `../clientFhirUtils.ts`, both outside this
directory, and rebuilt from the repository root:

```bash
bun run ./scripts/build-ehretriever.ts -c config.circlejtp.json
cp static/dist/ehretriever.bundle.js site/public/dist/ehretriever.bundle.js
```

This matters more than it looks. **The brand selector — search box, result rows, pagination,
the connect confirmation dialog — is generated by the bundle's JavaScript, not by any HTML in
this directory.** Restyling it means changing `../ehretriever.ts` and rebuilding; there is no
markup here to edit. Work scoped to `site/` alone can restyle the landing page and terms in
full, but can only reach the retriever UI through CSS.

### Two things that will silently break

- **Do not change the `<html lang="en">` line in any page.** The Worker rewrites that exact
  string to inject `data-connect-enabled`, which is how the landing page knows whether to
  offer the connect button. Add an attribute or reformat the tag and the match fails silently:
  no error, the page just stops reflecting whether the flow works.
- **The CSP allows no third-party requests.** `default-src 'self'` with `img-src 'self' data:`,
  so no CDN stylesheets, no Google Fonts, no remote images or icon sets — they will be blocked,
  not degraded. Fonts are self-hosted in `public/fonts/` deliberately: fetching them from
  Google would send every visitor's IP and referer to Google from a page about downloading
  medical records, contradicting the site's own no-tracking claim. Inline `<style>` and
  `<script>` are allowed. `connect-src` is open only because the retriever must reach whichever
  FHIR endpoint the user picks.

`site/` depends on nothing else in this repository except the retriever bundle built from
`../ehretriever.ts`.

## Local development

```bash
cd site
npx wrangler dev --local --port 8799

# Seed the local brand directory (any processed epic.json):
npx wrangler r2 object put health-circlejtp-brands/epic.json \
  --file /path/to/epic.json --local --content-type application/json

# Or seed it with the checked-in sample, which needs no copy of the 47 MB directory:
npx wrangler r2 object put health-circlejtp-brands/epic.json \
  --file public/brands/epic-sample.json --local --content-type application/json
```

### Brand fixtures for UI work

Two brand files are checked in, so `site/` can be worked on without R2 or a 47 MB download:

| File | Items | For |
|---|---|---|
| `public/brands/epic-sandbox.json` | 1 | The sandbox connect flow. One row — it does not exercise the list. |
| `public/brands/epic-sample.json` | 150 | Designing the brand selector. |

`epic-sample.json` is a stratified slice of the real directory, so the selector renders
against genuine data rather than invented names. It deliberately carries the cases that
break layouts: the 100-character `Atrium Health Wake Forest Baptist High Point Medical
Center Outpatient Physical Therapy -Thomasville` alongside a 2-character name, 69 items with
no city, 21 with no state, 66 brands and 84 facilities across 40 states. Real rows are
mostly missing a city — a selector designed only against complete rows will look wrong the
moment it meets the real directory.

It is a fixture, not a source of truth: nothing regenerates it, and the weekly refresh does
not touch it.

## Deploying

Requires `wrangler login` first.

```bash
npx wrangler deploy
# Seed the production directory, or wait for the Sunday cron:
npx wrangler r2 object put health-circlejtp-brands/epic.json \
  --file /path/to/epic.json --remote --content-type application/json
```

`EPIC_CLIENT_ID` stays empty until the Epic app registration is approved. While empty the
site says so plainly rather than offering a connect button that cannot work.

## Preview gate

The retriever bundle is deployed before the connect button is offered publicly, so the flow can
be exercised against Epic's sandbox without the site being open to anyone who finds the URL.
`/ehr-connect`, `/ehr-callback` and `/ehretriever.html` are therefore gated:

- allowed outright once `EPIC_CLIENT_ID` is set;
- otherwise allowed only with `?preview=<PREVIEW_TOKEN>`, which sets a one-hour cookie so
  Epic's redirect back to `/ehr-callback` — which carries no query string of ours — is
  also allowed.

Without this the landing page would say the flow is unavailable while `/ehr-connect` quietly
worked for anyone who guessed the URL. `/healthz` reports both `connectEnabled` and
`retrieverDeployed` so the two can be told apart.

Sandbox testing:

```
https://health.circlejtp.me/ehr-connect?preview=<token>&brandTags=epic^sandbox
```

Epic publishes its sandbox test patients and their credentials at
<https://fhir.epic.com/Documentation?docId=testpatients>.

## Scopes

The app is registered as **SMART v1**, so the retriever requests `patient/*.read`.
The `patient/*.rs` in other configs in this repository is SMART **v2** syntax and will not
work against this registration.
