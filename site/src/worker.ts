/**
 * health.circlejtp.me — a browser-only SMART on FHIR record retriever.
 *
 * The Worker deliberately never touches health data. It serves static assets and
 * sets headers; the record travels from the health system to the user's browser to
 * their disk, never through here. Every privacy claim on the landing page depends on
 * that staying true, so resist adding anything that receives record content.
 */

interface Env {
    ASSETS: Fetcher;
    BRANDS: R2Bucket;
    /** Epic app client id. Empty until app registration is approved. */
    EPIC_CLIENT_ID: string;
    /** Lets the operator exercise the flow before it is offered publicly. */
    PREVIEW_TOKEN: string;
}

const PREVIEW_COOKIE = 'hcj_preview';

/**
 * Whether the retrieval flow may be served.
 *
 * The bundle is deployed before the connect button is offered, so that the flow can
 * be tested against Epic's sandbox while legal review is still outstanding. Gating on
 * a token keeps the public site honest in the meantime: the landing page says the
 * flow is unavailable, and /ehr-connect agrees rather than quietly working for anyone
 * who guesses the URL.
 *
 * The cookie exists because Epic redirects back to /ehr-callback without our query
 * string, so the grant has to survive the round trip.
 */
function retrieverAllowed(request: Request, url: URL, env: Env): boolean {
    if (env.EPIC_CLIENT_ID) return true;
    if (!env.PREVIEW_TOKEN) return false;
    if (url.searchParams.get('preview') === env.PREVIEW_TOKEN) return true;
    const cookie = request.headers.get('cookie') || '';
    return cookie.split(';').some(c => c.trim() === `${PREVIEW_COOKIE}=${env.PREVIEW_TOKEN}`);
}

/**
 * Object key for the processed Epic brand directory.
 *
 * Stored uncompressed. Serving a pre-gzipped R2 body with a hand-set
 * Content-Encoding does not round-trip: the runtime does not treat an R2 body as
 * already-encoded, and clients then fail to decode it. Storing plain JSON lets
 * Cloudflare compress at the edge instead, which also picks brotli where the client
 * supports it. R2 storage for ~47 MB is negligible.
 */
const BRANDS_KEY = 'epic.json';
/** Where Epic publishes the User Access Brands bundle. */
const BRANDS_SOURCE = 'https://open.epic.com/Endpoints/Brands';

/**
 * connect-src cannot be locked to 'self': the retriever must reach whichever FHIR
 * endpoint the user picks. Everything else is restricted.
 */
function securityHeaders(): Record<string, string> {
    return {
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data:",
            "connect-src *",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
        ].join('; '),
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
        // No health data passes through the Worker, but the landing page should not be
        // cached so long that an updated warning takes days to reach people.
        'Cache-Control': 'public, max-age=300',
    };
}

function withHeaders(res: Response, extra: Record<string, string> = {}): Response {
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries({ ...securityHeaders(), ...extra })) {
        out.headers.set(k, v);
    }
    return out;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return withHeaders(new Response('Method Not Allowed', { status: 405 }));
        }

        // The brand directory is stored pre-compressed: 47 MB raw exceeds the 25 MiB
        // static-asset limit, while the gzip is ~3.7 MB. Serve it under its real name
        // with the encoding declared, so fetch().json() in the retriever just works.
        if (path === '/brands/epic.json') {
            const object = await env.BRANDS.get(BRANDS_KEY);
            if (!object) {
                return withHeaders(new Response('Brand directory not available', { status: 503 }));
            }
            return withHeaders(new Response(object.body), {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
                'ETag': object.httpEtag,
            });
        }

        // Epic redirects here after authorization. The retriever is a single page that
        // reads the code from the query string, so hand back the same document with the
        // query preserved rather than redirecting.
        if (path === '/ehr-callback' || path === '/ehr-connect' || path === '/ehretriever.html') {
            if (!retrieverAllowed(request, url, env)) {
                return withHeaders(Response.redirect(new URL('/#connect', url).toString(), 302));
            }
            const page = await env.ASSETS.fetch(new URL('/ehretriever.html', url).toString());
            if (page.status !== 200) {
                // Bundle not deployed yet.
                return withHeaders(Response.redirect(new URL('/#connect', url).toString(), 302));
            }
            const res = withHeaders(page, { 'Cache-Control': 'no-store' });
            if (!env.EPIC_CLIENT_ID && url.searchParams.get('preview') === env.PREVIEW_TOKEN) {
                res.headers.append(
                    'Set-Cookie',
                    `${PREVIEW_COOKIE}=${env.PREVIEW_TOKEN}; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=Lax`
                );
            }
            return res;
        }

        if (path === '/healthz') {
            const brands = await env.BRANDS.head(BRANDS_KEY);
            return withHeaders(Response.json({
                ok: true,
                connectEnabled: Boolean(env.EPIC_CLIENT_ID),
                retrieverDeployed: (await env.ASSETS.fetch(new URL('/ehretriever.html', url).toString())).status === 200,
                brands: brands
                    ? { present: true, bytes: brands.size, uploaded: brands.uploaded, ...brands.customMetadata }
                    : { present: false },
            }), { 'Cache-Control': 'no-store' });
        }

        const asset = await env.ASSETS.fetch(request);

        // The landing page needs to know whether the connect flow can actually work, so
        // the button is never offered when it would fail.
        if (asset.status === 200 && (asset.headers.get('content-type') || '').includes('text/html')) {
            const connectEnabled = Boolean(env.EPIC_CLIENT_ID);
            const html = (await asset.text()).replace(
                '<html lang="en">',
                `<html lang="en" data-connect-enabled="${connectEnabled}">`
            );
            return withHeaders(new Response(html, {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }));
        }

        return withHeaders(asset);
    },

    /**
     * Weekly refresh of the Epic brand directory.
     *
     * This exists because a stale directory is a silent, growing outage rather than a
     * visible failure: the bundled copy in the upstream project was 17 months old and
     * still pointed at a decommissioned Mayo Clinic endpoint, which surfaced to users
     * only as "Load failed".
     */
    async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
        ctx.waitUntil(refreshBrands(env));
    },
} satisfies ExportedHandler<Env>;

async function refreshBrands(env: Env): Promise<void> {
    console.log('brand-refresh: fetching', BRANDS_SOURCE);
    const res = await fetch(BRANDS_SOURCE, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
        console.error(`brand-refresh: source returned ${res.status}; keeping existing directory`);
        return;
    }

    const bundle: any = await res.json();

    // Fail closed. A truncated download would otherwise publish a directory missing
    // most health systems, which is far worse than serving a stale one: users would
    // simply not find their provider, with no error to explain why.
    if (bundle?.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
        console.error('brand-refresh: payload is not a FHIR Bundle; keeping existing directory');
        return;
    }
    const orgCount = bundle.entry.filter((e: any) => e?.resource?.resourceType === 'Organization').length;

    const previous = await env.BRANDS.head(BRANDS_KEY);
    const previousCount = Number(previous?.customMetadata?.orgCount ?? 0);
    if (previousCount > 0) {
        const ratio = orgCount / previousCount;
        if (ratio < 0.8 || ratio > 1.2) {
            console.error(
                `brand-refresh: organization count moved from ${previousCount} to ${orgCount} ` +
                `(${(ratio * 100).toFixed(1)}%), outside the ±20% guard; keeping existing directory`
            );
            return;
        }
    }

    const processed = processBrands(bundle);
    if (!processed.items.length) {
        console.error('brand-refresh: processing produced no items; keeping existing directory');
        return;
    }

    await env.BRANDS.put(BRANDS_KEY, JSON.stringify(processed), {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: {
            orgCount: String(orgCount),
            itemCount: String(processed.items.length),
            refreshedAt: processed.processedTimestamp,
        },
    });
    console.log(`brand-refresh: published ${processed.items.length} items from ${orgCount} organizations`);
}

/**
 * Flattens the FHIR Bundle into the search shape the retriever expects.
 *
 * Ported from static/brands/process-brands.ts and must stay faithful to it. The
 * hierarchy matters: endpoints hang off the *primary* brand (no partOf), while the
 * ~96k individual facilities reference it via partOf and inherit its endpoints.
 * Emitting only orgs that directly carry an endpoint would silently reduce the
 * directory from ~96,000 searchable facilities to ~1,300 brands, so a user looking
 * up their local clinic by name would no longer find it.
 */
export function processBrands(bundle: any): { items: any[]; processedTimestamp: string } {
    // Pass 1: index every endpoint by each reference form used in the bundle.
    const endpointsById = new Map<string, { url: string; name: string }>();
    for (const entry of bundle.entry) {
        const r = entry?.resource;
        if (r?.resourceType !== 'Endpoint' || !r.address) continue;
        const value = { url: r.address, name: r.name ?? '' };
        for (const key of [entry.fullUrl, r.id].filter(Boolean)) {
            endpointsById.set(idFromReference(String(key)), value);
        }
    }

    // Pass 2: primary brands, with their endpoints resolved once.
    const brands = new Map<string, { name: string; state: string | null; endpoints: { url: string; name: string }[] }>();
    const facilities: any[] = [];
    for (const entry of bundle.entry) {
        const org = entry?.resource;
        if (org?.resourceType !== 'Organization') continue;
        if (org.partOf) { facilities.push(org); continue; }

        const resolved: { url: string; name: string }[] = [];
        for (const ref of org.endpoint ?? []) {
            const ep = endpointsById.get(idFromReference(String(ref?.reference ?? '')));
            if (ep) resolved.push(ep);
        }
        resolved.sort((a, b) => a.url.localeCompare(b.url));
        brands.set(org.id, {
            name: org.name || 'Unknown Brand',
            state: org.address?.[0]?.state ?? null,
            endpoints: resolved,
        });
    }

    // Pass 3: searchable items — one per brand, one per facility.
    const items: any[] = [];
    for (const [brandId, brand] of brands) {
        items.push({
            searchName: brand.name.toLowerCase(),
            displayName: brand.name,
            itemType: 'brand',
            city: null,
            state: brand.state,
            postalCode: null,
            brandName: brand.name,
            brandId,
            endpoints: brand.endpoints,
        });
    }
    for (const facility of facilities) {
        const parentId = idFromReference(String(facility.partOf?.reference ?? ''));
        const parent = brands.get(parentId);
        if (!parent) continue; // References a brand not in this bundle.
        const address = facility.address?.[0] ?? {};
        items.push({
            searchName: (facility.name || 'Unknown Facility').toLowerCase(),
            displayName: facility.name || 'Unknown Facility',
            itemType: 'facility',
            city: address.city ?? null,
            state: address.state ?? null,
            postalCode: address.postalCode ?? null,
            brandName: parent.name,
            brandId: parentId,
            endpoints: parent.endpoints,
        });
    }

    items.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return { items, processedTimestamp: new Date().toISOString() };
}

/** Handles "Organization/id", "urn:uuid:id" and bare ids alike. */
export function idFromReference(reference: string): string {
    const parts = reference.split(/[/:]/);
    return parts[parts.length - 1] || reference;
}
