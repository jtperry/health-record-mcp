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

## Local development

```bash
cd site
npx wrangler dev --local --port 8799

# Seed the local brand directory (any processed epic.json):
npx wrangler r2 object put health-circlejtp-brands/epic.json \
  --file /path/to/epic.json --local --content-type application/json
```

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
