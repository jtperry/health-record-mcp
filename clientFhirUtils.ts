import { ClientFullEHR, ClientProcessedAttachment } from './clientTypes';
import { KNOWN_ATTACHMENT_PATHS, AttachmentLike } from './src/types'; // Reuse server types where applicable
import { getInitialFhirSearchQueries } from './src/fhirSearchQueries'; // Import shared query function
import _ from 'lodash'; // Make sure lodash is installed (bun add lodash @types/lodash)
import { htmlToText } from 'html-to-text';
import { XMLParser } from 'fast-xml-parser';

// --- Configuration ---
const MAX_CONCURRENCY = 5;
const MAX_FOLLOW_REFERENCES_DEPTH = 2; // How many levels deep to follow references like subject, encounter
const MAX_ATTACHMENT_SIZE_MB = 10;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout per request

// --- Retrieval bounds (AdvouraExportV1 §4: "Bounded everywhere") ---
//
// These bound one retrieval run end-to-end: search-result pagination, reference
// following, and attachment fetches all draw from the same budgets. Hitting any of
// them is not an error - it stops that part of the crawl, is recorded as a failed
// category (see registerCapHit below), and forces retrieval_complete: false. The
// numbers are chosen to comfortably cover a real decades-long longitudinal record
// while still bounding worst-case time and browser memory:
//
//  - MAX_TOTAL_PAGES: 1000 Bundle pages across the whole run. At a typical server
//    page size of ~50 entries, that is up to ~50,000 search-result resources before
//    pagination itself is cut off - far beyond what a single patient's history holds
//    in the categories this client queries, while still bounding total round-trips.
//  - MAX_TOTAL_RESOURCES: 50,000 distinct FHIR resources held in memory. Real patient
//    records seen in practice run to the low thousands; this leaves an order of
//    magnitude of headroom without letting a pathological or hostile server grow the
//    in-memory record without limit.
//  - MAX_TOTAL_BYTES: 250 MiB of response bodies (FHIR JSON and attachments
//    combined), enforced while streaming each response rather than after buffering
//    it. Individual attachments are already capped at MAX_ATTACHMENT_SIZE_MB, so this
//    accommodates a large multi-decade record plus dozens of near-max attachments
//    while keeping the whole export well inside what a browser tab can hold and then
//    re-serialize for download.
const MAX_TOTAL_PAGES = 1000;
const MAX_TOTAL_RESOURCES = 50_000;
const MAX_TOTAL_BYTES = 250 * 1024 * 1024;

// --- Interfaces & Types ---
interface FetchTask {
    url: string;
    description: string; // For progress reporting
    isAttachment?: boolean;
    resourceType?: string; // For attachment context
    resourceId?: string;   // For attachment context
    attachmentPath?: string; // For attachment context
    originalResourceJson?: any; // For attachments, the resource it belongs to
    depth: number; // For reference following
    /** Identifies which of the requested top-level queries this task (and any page
     *  that follows it) belongs to. Only set on the initial 28 queries and the pages
     *  chained from them - never on reference-following or attachment tasks - so that
     *  requested_queries/completed_queries/failed_query_categories describe what was
     *  *asked for*, not every URL the crawl happened to visit. */
    queryId?: string;
    isInitialQuery?: boolean;
    /** Set only on a task created by following Bundle.link[relation=next]. Used to
     *  count pages_followed at the point a followed page actually survives dedupe and
     *  is queued for fetch, not at the point it is merely discovered (S7). */
    isFollowedPage?: boolean;
    /** #318 Amendment 5: true only for a task whose URL is a FHIR *search* (the 28
     *  initial resourceType?params queries, and the pages chained from them) - never
     *  inferred from the response. A direct read (the Patient fetch, or a task built
     *  from following a resource reference) leaves this unset. The expectation for
     *  "did this task succeed" is derived from this flag, set at task-creation time
     *  from the request that was made, not from what the response happens to parse
     *  as - so a response shape nobody anticipated can't accidentally satisfy it. */
    isSearch?: boolean;
}

/** Retrieval-manifest data alongside the {fhir, attachments} payload. Not itself the
 *  advoura_export block (ehretriever.ts owns assembling that, including fields this
 *  module has no business computing, like created_at and payload_sha256), but the raw
 *  material for it. */
export interface ClientRetrievalOutcome {
    ehr: ClientFullEHR;
    requestedQueries: string[];
    completedQueries: string[];
    failedQueryCategories: string[];
    pagesFollowed: number;
    resourceCount: number;
    /** True only if every requested query completed AND pagination ran to exhaustion
     *  for each of them, with no page/resource/byte cap hit along the way. */
    retrievalComplete: boolean;
}

class ByteBudgetExceededError extends Error {
    constructor() { super('Response byte budget exceeded.'); this.name = 'ByteBudgetExceededError'; }
}

interface FetchResult {
    url: string;
    data?: any;
    error?: Error;
    isAttachment?: boolean;
    isBundle?: boolean;
}

export type ProgressCallback = (completed: number, total: number, message?: string) => void;

// --- Concurrency Manager ---
class ConcurrencyManager {
    private limit: number;
    private activeCount: number = 0;
    private waitingQueue: (() => void)[] = [];

    constructor(limit: number) {
        this.limit = limit;
    }

    async acquire(): Promise<void> {
        if (this.activeCount < this.limit) {
            this.activeCount++;
            return Promise.resolve();
        } else {
            // Wait for a slot
            return new Promise(resolve => {
                this.waitingQueue.push(() => {
                    // This function is called by release() when a slot is free
                    this.activeCount++;
                    resolve();
                });
            });
        }
    }

    release(): void {
        this.activeCount--;
        if (this.waitingQueue.length > 0) {
            const nextResolve = this.waitingQueue.shift();
            if (nextResolve) {
                // Run in next microtask to avoid potential stack overflows
                Promise.resolve().then(nextResolve); 
            }
        }
    }
}

// --- Helper: Fetch with Authorization Header ---
async function fetchWithToken(url: string, accessToken: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('Accept', 'application/fhir+json, application/json'); // Prefer FHIR JSON

    return fetch(url, {
        ...options,
        headers: headers,
    });
}

// --- Helper: Fetch a single FHIR resource ---
async function fetchResource(url: string, accessToken: string): Promise<any | null> {
    try {
        const response = await fetchWithToken(url, accessToken);
        if (!response.ok) {
            // No URL, no body: a resource URL carries the patient's identifier as a path
            // or query segment, and the response body may carry an OperationOutcome that
            // echoes request parameters back.
            console.warn(`Failed to fetch resource: ${response.status} ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching resource.');
        return null;
    }
}


// --- Core Fetching Function with Timeout ---
// Accepts an external AbortController so a caller can also abort the same request for
// a different reason (the byte budget below); the timeout and the budget then share
// one signal instead of racing two independent ones.
async function fetchWithTimeout(url: string, options: RequestInit, timeout = REQUEST_TIMEOUT_MS, externalController?: AbortController): Promise<Response> {
    const controller = externalController ?? new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error instanceof DOMException && error.name === 'AbortError') {
            // No URL: it carries the patient identifier and query parameters.
            throw new Error(`Request timed out after ${timeout / 1000}s.`);
        }
        throw error;
    }
}

/**
 * Reads a response body under a shared, mutable byte budget, aborting mid-stream
 * rather than after the body has already been fully buffered.
 *
 * `response.json()`/`response.blob()` buffer the *entire* body before you see a
 * single byte of it, so a budget check after the fact has already paid the memory
 * (and, for a hostile or misbehaving server, the time) cost it was meant to avoid.
 * Reading via `response.body.getReader()` and checking the running total after every
 * chunk lets an oversized response be abandoned as soon as it crosses the line.
 *
 * `consumeBytes` is expected to attribute the read to the caller's shared,
 * cross-request total (see MAX_TOTAL_BYTES) and to return false once that total
 * would be exceeded.
 */
async function readBodyWithByteBudget(
    response: Response,
    controller: AbortController,
    consumeBytes: (n: number) => boolean
): Promise<Uint8Array> {
    if (!response.body) {
        // No streaming body available (some test/mock environments). Fall back to a
        // single buffered read, still charged to the budget before use.
        const buf = new Uint8Array(await response.arrayBuffer());
        if (!consumeBytes(buf.byteLength)) throw new ByteBudgetExceededError();
        return buf;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value && value.byteLength > 0) {
                total += value.byteLength;
                if (!consumeBytes(value.byteLength)) {
                    controller.abort();
                    throw new ByteBudgetExceededError();
                }
                chunks.push(value);
            }
        }
    } finally {
        try { reader.releaseLock(); } catch { /* already released on abort/error */ }
    }

    const combined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return combined;
}

// --- Task Extraction Helpers --- 

// Finds FHIR references (like { reference: "Patient/123" }) within a resource
function findReferences(obj: any): { reference: string }[] {
    let refs: { reference: string }[] = [];
    if (!obj || typeof obj !== 'object') return refs;

    for (const key in obj) {
        if (key === 'reference' && typeof obj[key] === 'string' && obj[key].split('/').length === 2) { // Basic validation
            refs.push({ reference: obj[key] });
        } else if (typeof obj[key] === 'object') {
            refs = refs.concat(findReferences(obj[key]));
        }
    }
    return _.uniqWith(refs, _.isEqual); // Avoid duplicate references within the same resource
}

// Finds FHIR Attachment structures within a resource
function findAttachments(obj: any, currentPath: string = ''): { attachment: any, path: string }[] {
    let attachments: { attachment: any, path: string }[] = [];
    if (!obj || typeof obj !== 'object') return attachments;

    for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        const value = obj[key];
        const newPath = currentPath ? `${currentPath}.${key}` : key;

        // Heuristic: Check if the object looks like an Attachment type
        if (typeof value === 'object' && value !== null && value.contentType && (value.url || value.data)) {
            attachments.push({ attachment: value, path: newPath });
        } else if (typeof value === 'object') {
            attachments = attachments.concat(findAttachments(value, newPath));
        }
    }
    return attachments;
}

/**
 * May this URL be fetched with the user's access token attached?
 *
 * The crawler follows references and attachment URLs out of FHIR content, and FHIR
 * content can carry absolute URLs. Without this check a resource containing
 * `"reference": "https://attacker.example/x"` would cause the browser to send a
 * `Bearer` header - the user's live EHR access token - to that host. The record itself
 * is sensitive; the token is worse, because it can be replayed to fetch the record
 * again.
 *
 * Same-origin as the FHIR base is the rule. Epic serves attachments as `Binary/...`
 * under the FHIR base, so nothing legitimate in the observed flows needs a second
 * origin; if a provider ever does, it belongs in an explicit allowlist here rather
 * than in a blanket exemption.
 */
function isTokenAllowedUrl(url: string, fhirBaseUrl: string): boolean {
    try {
        const target = new URL(url);
        const base = new URL(fhirBaseUrl);
        // http:// would send the token in clear text even to the right host.
        if (target.protocol !== 'https:') return false;
        return target.origin === base.origin;
    } catch {
        return false;
    }
}

// Resolves relative FHIR references (e.g., "Patient/123") to absolute URLs
function resolveReferenceUrl(reference: string, baseUrl: string): string | null {
    try {
        if (reference.startsWith('http://') || reference.startsWith('https://')) {
            return reference; // Already absolute
        }
        const parts = reference.split('/');
        if (parts.length === 2 && parts[0] && parts[1]) {
            const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            return `${base}${reference}`;
        }
        if (reference.startsWith('#')) {
             console.log('Skipping internal contained resource reference.');
             return null;
        }
        // Reference strings and base URLs both carry FHIR ids; log neither.
        console.warn('Cannot resolve non-standard reference.');
        return null;
    } catch (e) {
        console.error('Error resolving reference URL.');
        return null;
    }
}

/**
 * Is this fetch failure an expected consequence of crawling, rather than a defect?
 *
 * 403 means the granted scope does not cover the resource. A 400 naming an unknown parameter
 * or an invalid id means the server will not serve that reference — Epic's sandbox has
 * Procedure references whose targets it rejects by id, while other ids of identical shape
 * resolve fine, so this is server-side data rather than a malformed request on our side.
 */
function isExpectedFetchFailure(error: unknown): boolean {
    const status = (error as { status?: number })?.status;
    if (status === 403) return true;
    if (status === 400) {
        const message = (error as Error)?.message || '';
        return /Unknown parameter|Invalid FHIR ID/i.test(message);
    }
    return false;
}

// --- Resource and Attachment Processing --- 

// Extracts new fetch tasks (references, attachments) from a single FHIR resource
function extractTasksFromResource(resource: any, fhirBaseUrl: string, currentDepth: number): FetchTask[] {
    const newTasks: FetchTask[] = [];
    if (!resource || typeof resource !== 'object' || !resource.resourceType || !resource.id) return newTasks;

    // 1. Follow References (if depth allows)
    if (currentDepth < MAX_FOLLOW_REFERENCES_DEPTH) {
        const references = findReferences(resource);
        for (const ref of references) {
            const url = resolveReferenceUrl(ref.reference, fhirBaseUrl);
            if (url) {
                newTasks.push({
                    url: url,
                    description: `Reference: ${ref.reference}`,
                    depth: currentDepth + 1,
                    isSearch: false, // a followed reference is a direct read by id, not a search
                });
            }
        }
    }

    // 2. Find Attachments to fetch
    const attachments = findAttachments(resource);
    for (const { attachment, path } of attachments) {
        if (attachment.url && typeof attachment.url === 'string') {
            // Only fetch if URL is present and size is reasonable
            if (!attachment.size || attachment.size <= MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
                const attachmentUrl = resolveReferenceUrl(attachment.url, fhirBaseUrl);
                if (attachmentUrl) {
                    newTasks.push({ 
                        url: attachmentUrl, 
                        description: `Attachment for ${resource.resourceType}/${resource.id}`, 
                        isAttachment: true,
                        resourceType: resource.resourceType,
                        resourceId: resource.id,
                        attachmentPath: path,
                        originalResourceJson: resource, // Pass context
                        depth: currentDepth // Attachments don't increase depth level
                    });
                }
            } else {
                 // Resource type and path only; the resource id identifies this patient's record.
                 console.warn(`Skipping large attachment (${(attachment.size / 1024 / 1024).toFixed(1)} MB) for ${resource.resourceType} at path ${path}`);
            }
        } 
        // Note: Inline attachments (attachment.data) are handled separately after all fetches
    }

    return newTasks;
}

/**
 * Best-effort RTF to Plain Text conversion using Regex.
 * WARNING: This is simplistic and will fail on complex RTF.
 * Based on user-provided example.
 * @param {string} rtf - The RTF content as a string.
 * @returns {string} - Extracted plain text (best effort).
 */
export function rtfToTextBestEffort(rtf: string): string {
    if (!rtf) {
        return "";
    }

    try {
        // 1. Remove RTF header, font table, color table, stylesheet, info blocks etc.
        let text = rtf.replace(/\{\\fonttbl.*?\}|\{\\colortbl.*?\}|\{\\stylesheet.*?\}|\{\\info.*?\}|\{\\operator.*?\}|\{\\pict.*?\}|\{\\object.*?\}|\{\\comment.*?\}|\{\\\*.*?\}|\pard\plain/gs, '');
        // Removed more specific \* block replaces as the one above should catch them
        // text = text.replace(/\{\\\*\\generator.*?;\}|.../gs, ''); 

        // 2. Handle Unicode characters \\uN?
         text = text.replace(/\\u(\d+)\s*\\\?\s?/g, (match, dec) => {
            try {
                return String.fromCharCode(parseInt(dec, 10));
            } catch (e) {
                // S8: `dec` is decoded attachment content (clinical text), never logged.
                console.warn('[RTF] Skipped an invalid Unicode code point.');
                return ''; // Skip invalid code points
            }
        });

        // 3. Handle Hexadecimal characters \\'xx
        text = text.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
             try {
                // Assume Windows-1252 / Latin-1 as a common default fallback
                return String.fromCharCode(parseInt(hex, 16));
            } catch (e) {
                // S8: `hex` is decoded attachment content (clinical text), never logged.
                console.warn('[RTF] Skipped an invalid hex escape.');
                return ''; // Skip invalid hex escapes
            }
        });

         // 4. Convert specific RTF control words to text equivalents
         text = text.replace(/\\(par|pard|sect|page|line|ul)\b\s*/g, '\n'); 
         text = text.replace(/\\tab\b\s*/g, '\t'); 
         text = text.replace(/\\(bullet|emdash|endash|enspace|emspace)\b/g, (match, code) => {
             switch (code) {
                 case 'bullet': return '•';
                 case 'emdash': return '—';
                 case 'endash': return '–';
                 case 'enspace': return '\u2002'; 
                 case 'emspace': return '\u2003'; 
                 default: return '';
             }
         });
        text = text.replace(/\\~ /g, '\u00A0'); // Non-breaking space
        text = text.replace(/\\_/g, ''); // Optional hyphen - remove
        text = text.replace(/\\-/g, '-'); // Non-breaking hyphen

        // 5. Handle escaped characters \\{, \\}, \\\\
        text = text.replace(/\\\\\{/g, '{').replace(/\\\\\}/g, '}').replace(/\\\\\\\\/g, '\\');

        // 6. Remove remaining RTF control words (like \\b, \\i, \\fs24, etc.)
        text = text.replace(/\\(\*?)[:\\w\-]+\d*\s?/g, '');
        // --- Add a more aggressive control word stripper --- 
        // This targets \ followed by letters, optionally followed by a number (parameter), then optional space.
        // It might be too aggressive and remove intended backslashes followed by words, but let's try.
        text = text.replace(/\\[a-zA-Z]+(-?\d+)?\s?/g, ''); 

        // 7. Remove braces 
        text = text.replace(/[{}]/g, '');

        // 8. Clean up: Multiple spaces/newlines, trim whitespace
        text = text.replace(/(\n\s*){2,}/g, '\n\n'); 
        text = text.replace(/[ \t]{2,}/g, ' ');    
        text = text.replace(/^\s+|\s+$/g, '');      

        return text || '[Empty RTF content after processing]';
    } catch (error) {
        // S8: this runs over attachment content; log only the error's own message.
        console.error('[RTF] Error during regex processing:', (error as Error)?.message || 'unknown error');
        return '[Error processing RTF content]';
    }
}

/**
 * Extracts plain text from XML content using fast-xml-parser.
 * Attempts to preserve newlines between elements.
 * @param xmlContent The XML content as a string.
 * @returns Extracted plain text or an error marker string.
 */
export function xmlToTextBestEffort(xmlContent: string): string {
    try {
        // Ignore attributes, focus on text content, preserve whitespace
        const parser = new XMLParser({ 
            ignoreAttributes: true, 
            textNodeName: "#text",
            trimValues: false, 
            isArray: (name, jpath, isLeafNode, isAttribute) => { 
                return !isAttribute; 
            }
        });
        const parsed = parser.parse(xmlContent);
        
        const extractText = (node: any): string => {
            let text = "";
            if (typeof node === 'string') {
                text += node;
            } else if (Array.isArray(node)) {
                text += node.map(extractText).join("\n"); 
            } else if (typeof node === 'object' && node !== null) {
                if (node["#text"]) {
                    text += node["#text"];
                }
                text += Object.keys(node)
                    .filter(key => key !== "#text")
                    .map(key => extractText(node[key]))
                    .join("\n"); 
            }
            return text;
        };

        let rawText = extractText(parsed);
        
        // Cleanup whitespace
        let cleanedText = rawText.replace(/[ \t]+/g, ' ');
        cleanedText = cleanedText.replace(/\n+/g, '\n');
        const finalText = cleanedText.trim();

        return finalText || '[Empty XML content after processing]'; // Return marker if empty

    } catch (xmlErr) {
        console.error('[XML Parse] Error parsing XML content.');
        return '[Error parsing XML]';
    }
}

// Processes the Blob data from a fetched attachment
// Returns whether the attachment was actually stored. #318 Amendment 3's invariant
// ("anything not affirmatively recognised and processed is a failure") applies here
// too: a caller that ignores this return value and assumes success is exactly the
// defect class the amendment exists to close, just one level down from the query
// loop - attachment_count would undercount while nothing recorded why.
export async function processAttachmentData(fetchResultData: Blob, task: FetchTask, clientAttachments: ClientProcessedAttachment[]): Promise<boolean> {
     if (!task.isAttachment || !task.resourceType || !task.resourceId || !task.attachmentPath || !task.originalResourceJson) {
         // Never log the task itself: it carries originalResourceJson, the full FHIR
         // resource this attachment belongs to.
         console.warn('Skipping attachment processing due to missing task context.');
         return false;
     }

     const originalAttachmentNode = _.get(task.originalResourceJson, task.attachmentPath);
     if (!originalAttachmentNode) {
         console.warn(`Could not find original attachment node at path ${task.attachmentPath} for ${task.resourceType}.`);
         return false;
     }

     let contentBase64: string | null = null;
     let contentPlaintext: string | null = null;
     const contentType = originalAttachmentNode.contentType || 'application/octet-stream';
     const blob = fetchResultData;

     try {
         // Convert Blob to Base64
         contentBase64 = await new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onloadend = () => resolve((reader.result as string).split(',', 2)[1]);
             reader.onerror = reject;
             reader.readAsDataURL(blob);
         });

         // Attempt plaintext extraction for common types
        if (contentType.startsWith('text/html')) {
             try {
                 const htmlContent = await blob.text();
                 contentPlaintext = htmlToText(htmlContent, { 
                     wordwrap: false,
                     selectors: [{ selector: 'img', format: 'skip' }] 
                 });
             } catch (htmlErr) {
                 console.error(`[ATTACHMENT:HTML] HTML parsing error in ${task.resourceType} attachment at ${task.attachmentPath}.`);
                 contentPlaintext = '[Error parsing HTML]';
             }
        } else if (contentType.includes('xml')) { // Broader check for XML types
              try {
                 const xmlContent = await blob.text();
                 contentPlaintext = xmlToTextBestEffort(xmlContent);
              } catch (err) { // Catch errors from blob.text() or xmlToTextBestEffort
                 console.error(`[ATTACHMENT:XML] Error reading or processing XML blob in ${task.resourceType} attachment at ${task.attachmentPath}.`);
                 contentPlaintext = '[Error processing XML]';
             }
         } else if (contentType.startsWith('application/rtf') || contentType.startsWith('text/rtf')) {
             try {
                console.log(`[ATTACHMENT:RTF] Attempting best-effort RTF parsing for a ${task.resourceType} attachment.`);
                const rtfContent = await blob.text(); // Read blob as text (potential encoding issues)
                contentPlaintext = rtfToTextBestEffort(rtfContent);
                 if (!contentPlaintext) contentPlaintext = '[Empty RTF content after processing]';
             } catch (rtfErr) {
                 console.error(`[ATTACHMENT:RTF] Error reading or processing RTF blob in ${task.resourceType} attachment at ${task.attachmentPath}.`);
                 contentPlaintext = '[Error processing RTF]';
             }
         } else {
                             contentPlaintext = await blob.text();
             // Fallback for other binary types or unhandled text types. Content type and
             // path only, never the resource id or the content itself.
             console.log(`[ATTACHMENT:OTHER] Attachment for ${task.resourceType} at ${task.attachmentPath} has non-extractable type ${contentType}. default .text() plaintext generated.`);
         }

         const newAttachment: ClientProcessedAttachment = {
             resourceType: task.resourceType,
             resourceId: task.resourceId,
             path: task.attachmentPath,
             contentType: contentType,
             contentPlaintext: contentPlaintext,
             contentBase64: contentBase64,
             json: JSON.stringify(originalAttachmentNode) 
         };

         // Avoid duplicates
          const attachmentKey = `${newAttachment.resourceType}/${newAttachment.resourceId}#${newAttachment.path}`;
          if (!clientAttachments.some(a => `${a.resourceType}/${a.resourceId}#${a.path}` === attachmentKey)){
               clientAttachments.push(newAttachment);
          }
          return true;

     } catch (error) {
         console.error(`Error processing attachment data for ${task.resourceType} at ${task.attachmentPath}.`);
         return false;
     }
}

// Processes inline base64 encoded attachments found in already fetched resources.
// Returns the number of attachments dropped by the outer catch below, so the caller
// can record a failure category (#318 Amendment 3's invariant) instead of letting
// attachment_count undercount silently.
function processInlineAttachments(clientFullEhr: ClientFullEHR): number {
    console.log("Processing inline attachments...");
    let processedCount = 0;
    let droppedCount = 0;
    for (const resourceType in clientFullEhr.fhir) {
        for (const resource of clientFullEhr.fhir[resourceType]) {
            const attachments = findAttachments(resource);
            for (const { attachment, path } of attachments) {
                 if (attachment.data && !attachment.url && resource.id && resource.resourceType) { // Inline data only
                     const alreadyProcessed = clientFullEhr.attachments.some(att => 
                         att.resourceType === resource.resourceType && 
                         att.resourceId === resource.id && 
                         att.path === path
                     );
                     if (!alreadyProcessed) {
                         let contentBase64: string | null = attachment.data;
                         let contentPlaintext: string | null = null;
                         const contentType = attachment.contentType || 'application/octet-stream';
                         try {
                             if (contentBase64) {
                                 let decodedText: string | null = null;
                                 try {
                                     // Use Buffer for robust decoding (handles UTF-8 etc.)
                                     decodedText = Buffer.from(contentBase64, 'base64').toString('utf8');
                                 } catch (decodeError) {
                                     console.warn(`[INLINE:DECODE] Failed to decode base64 for inline ${resource.resourceType} attachment at ${path}.`);
                                     contentPlaintext = '[Error decoding base64 data]';
                                 }

                                 if (decodedText !== null) {
                                     if (contentType.startsWith('text/html')) {
                                        try {
                                            contentPlaintext = htmlToText(decodedText, { 
                                                wordwrap: false,
                                                selectors: [{ selector: 'img', format: 'skip' }] 
                                            });
                                        } catch (htmlErr) {
                                            console.error(`[INLINE:HTML] HTML parsing error for inline ${resource.resourceType} attachment at ${path}.`);
                                            contentPlaintext = '[Error parsing inline HTML]';
                                        }
                                    } else if (contentType.includes('xml')) {
                                        try {
                                            // decodedText already contains the XML string here
                                            contentPlaintext = xmlToTextBestEffort(decodedText);
                                        } catch (xmlErr) {
                                            // Catch errors specifically from the XML processing function for inline
                                            console.error(`[INLINE:XML] XML parsing error for inline ${resource.resourceType} attachment at ${path}.`);
                                            contentPlaintext = '[Error parsing inline XML]';
                                        }
                                    } else if (contentType.startsWith('text/') || contentType === 'application/json' || contentType === 'application/fhir+json') {
                                         contentPlaintext = decodedText; // Already decoded text
                                    } else if (contentType.startsWith('application/rtf') || contentType.startsWith('text/rtf')) {
                                        try {
                                            console.log(`[INLINE:RTF] Attempting best-effort RTF parsing for an inline ${resource.resourceType} attachment.`);
                                            contentPlaintext = rtfToTextBestEffort(decodedText);
                                            if (!contentPlaintext) contentPlaintext = '[Empty inline RTF content after processing]';
                                        } catch (rtfErr) {
                                            console.error(`[INLINE:RTF] Error processing inline RTF in ${resource.resourceType} attachment at ${path}.`);
                                            contentPlaintext = '[Error processing inline RTF]';
                                        }
                                    } else {
                                        // Other non-text inline types - no plaintext
                                        contentPlaintext = null; 
                                    }
                                 }
                             }
                             // If contentBase64 was null or decoding failed and set plaintext to error, keep that value.

                              clientFullEhr.attachments.push({
                                 resourceType: resource.resourceType,
                                 resourceId: resource.id,
                                 path: path,
                                 contentType: contentType,
                                 contentPlaintext: contentPlaintext,
                                 contentBase64: contentBase64,
                                 json: JSON.stringify(attachment)
                             });
                             processedCount++;
                         } catch (inlineError) {
                             console.error(`Error processing inline attachment for ${resource.resourceType} at ${path}.`);
                             droppedCount++;
                         }
                     }
                 }
            }
        }
    }
    console.log(`Finished processing ${processedCount} inline attachments${droppedCount > 0 ? `, ${droppedCount} dropped` : ''}.`);
    return droppedCount;
}


// --- Simplified Parallel Fetch Orchestrator ---
export async function fetchAllEhrDataClientSideParallel(
    accessToken: string,
    fhirBaseUrl: string,
    patientId: string,
    progressCallback: ProgressCallback
): Promise<ClientRetrievalOutcome> {

    const clientFullEhr: ClientFullEHR = { fhir: {}, attachments: [] };
    const fetchedUrls = new Set<string>(); // Tracks URLs already added to a batch
    const pool = new ConcurrencyManager(MAX_CONCURRENCY);
    let completedFetches = 0;
    let totalTasks = 0;

    // --- Retrieval-manifest bookkeeping (AdvouraExportV1 requested/completed/failed
    // queries, pages_followed, resource_count). None of this is itself the
    // advoura_export block - ehretriever.ts assembles that - but it is the truthful
    // record of what actually happened that block has to report. ---
    let pagesFollowed = 0;
    let totalBytesRead = 0;
    let resourceCount = 0;
    const queryCompleted = new Set<string>();
    const queryFailed = new Set<string>();
    const failedCategories = new Set<string>();

    // "Observation (category=laboratory)" -> "Observation". Collapses queries that
    // share a resource type into one failure category, and never carries patient data
    // - queryIds are built only from this file's fixed, static query list.
    function categoryOf(queryId: string): string {
        const idx = queryId.indexOf(' (');
        return idx === -1 ? queryId : queryId.slice(0, idx);
    }

    // S1 fix (AdvouraExportV1 #318): reference-following and attachment tasks are
    // never given a queryId (see FetchTask.queryId's own comment) - that's correct,
    // they aren't one of the 28 requested queries. But it previously meant their
    // failures called markQueryFailed(undefined), which recorded nothing at all: an
    // export where every Binary/* fetch 403'd could still report retrieval_complete:
    // true with failed_query_categories: []. A category-only task has no queryId to
    // derive a category from, so it gets one of these two fixed categories instead.
    function categoryForTask(task: FetchTask | undefined): string | undefined {
        if (!task) return undefined;
        if (task.queryId) return categoryOf(task.queryId);
        return task.isAttachment ? 'attachment_fetch_failed' : 'reference_fetch_failed';
    }

    function markQueryFailed(task: FetchTask | undefined) {
        if (!task) return;
        if (task.queryId) queryFailed.add(task.queryId);
        const category = categoryForTask(task);
        if (category) failedCategories.add(category);
    }

    function markQueryComplete(queryId: string | undefined) {
        if (!queryId || queryFailed.has(queryId)) return; // a prior failure is not undone by a later success
        queryCompleted.add(queryId);
    }

    function registerCapHit(cap: 'page_cap_exceeded' | 'resource_cap_exceeded' | 'byte_cap_exceeded', inFlightTask?: FetchTask) {
        failedCategories.add(cap);
        markQueryFailed(inFlightTask);
    }

    // Charged against MAX_TOTAL_BYTES across every request this run makes (search
    // results, followed pages, referenced resources, and attachments alike) - a single
    // shared budget, not one per request.
    function consumeBytes(n: number): boolean {
        if (totalBytesRead + n > MAX_TOTAL_BYTES) return false;
        totalBytesRead += n;
        return true;
    }

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/fhir+json, application/json, */*'
    };

    // --- Fetch and Process Single Task Function (Uses pool, updates clientFullEhr directly) ---
    async function fetchAndProcessTask(task: FetchTask): Promise<FetchTask[]> {
        await pool.acquire(); // Wait for a slot

        let discoveredTasks: FetchTask[] = [];
        let taskCompletedSuccessfully = false;

        // --- Determine Accept Header ---
        let acceptHeader = 'application/fhir+json, application/json, */*'; // Default
        if (task.isAttachment && task.originalResourceJson && task.attachmentPath) {
            const originalAttachmentNode = _.get(task.originalResourceJson, task.attachmentPath);
            if (originalAttachmentNode?.contentType) {
                acceptHeader = originalAttachmentNode.contentType; // Use specific content type
            }
        }
        const currentHeaders = new Headers(headers); // Clone base headers
        currentHeaders.set('Accept', acceptHeader); // Set dynamic Accept header
        // --- End Determine Accept Header ---

        const controller = new AbortController();

        try {
            progressCallback(completedFetches, totalTasks, `Fetching: ${task.description}...`);

            // Enforced here rather than at each place a task is created: this is the one
            // line that attaches the access token, so it is the one line that has to be
            // right. Anything off-origin is skipped, not fetched without the header -
            // fetching it at all would still leak which resources this patient has.
            if (!isTokenAllowedUrl(task.url, fhirBaseUrl)) {
                console.warn("Skipped a task: its target is not on the FHIR server's origin, so the access token was not sent to it.");
                markQueryFailed(task);
                // Deliberate skip, not a failure: the `finally` below still releases the
                // pool slot and advances progress, and this keeps the run from reporting
                // a fault the user cannot act on.
                taskCompletedSuccessfully = true;
                return discoveredTasks;
            }

            if (totalBytesRead >= MAX_TOTAL_BYTES) {
                registerCapHit('byte_cap_exceeded', task);
                return discoveredTasks;
            }

            // Use the dynamically set headers
            const response = await fetchWithTimeout(task.url, { headers: currentHeaders }, REQUEST_TIMEOUT_MS, controller);

            // S6: fetch()'s default redirect mode is 'follow', and response.url after a
            // redirect is never otherwise inspected. Browsers strip the Authorization
            // header on a cross-origin redirect, so token leakage is mitigated by the
            // browser itself - but nothing stops a same-origin `next` link that 302s to
            // an attacker host from having its body merged into clientFullEhr as if it
            // were provider data. Re-check the *final* URL the same way the request URL
            // itself is checked, and refuse to consume a body that landed off-origin.
            if (!isTokenAllowedUrl(response.url, fhirBaseUrl)) {
                console.warn("Skipped a task: it redirected off the FHIR server's origin.");
                markQueryFailed(task);
                taskCompletedSuccessfully = true;
                return discoveredTasks;
            }

            let resultData: any = null;
            let isJson = false;
            let isAttachmentBlob = false;
            const contentType = response.headers.get('content-type') || '';

            // Enforced while streaming, not after buffering: readBodyWithByteBudget aborts
            // the request as soon as the shared byte budget would be exceeded, rather than
            // allocating the full body first and checking its size afterward.
            let bodyBytes: Uint8Array;
            try {
                bodyBytes = await readBodyWithByteBudget(response, controller, consumeBytes);
            } catch (bodyErr) {
                if (bodyErr instanceof ByteBudgetExceededError) {
                    registerCapHit('byte_cap_exceeded', task);
                    return discoveredTasks;
                }
                throw bodyErr;
            }

            if (contentType.includes('json')) {
                resultData = JSON.parse(new TextDecoder('utf-8').decode(bodyBytes));
                isJson = true;
            } else if (task.isAttachment) {
                resultData = contentType ? new Blob([bodyBytes], { type: contentType }) : new Blob([bodyBytes]);
                isAttachmentBlob = true;
            } else { // Fallback for unexpected types
                console.warn(`Unexpected content type (${contentType}); attempting to read as text.`);
                resultData = new TextDecoder('utf-8').decode(bodyBytes);
            }

            if (!response.ok) { // Handle HTTP errors. No URL and no response body in the
                // message: both can carry the patient's identifier or clinical content
                // echoed back by an OperationOutcome.
                const httpError = new Error(`HTTP ${response.status}`) as Error & { status?: number };
                httpError.status = response.status;
                throw httpError;
            }

            // --- Process Success Result ---
            //
            // #318 Amendment 3's invariant, stated positively: retrieval_complete is true
            // only when every requested query affirmatively succeeded, and anything not
            // affirmatively recognised and processed is a failure. `recognisedResponse` is
            // how that is made hard to break structurally rather than by enumeration: it
            // starts false, and only a branch below that actually consumed the response -
            // processed a Bundle's entries (even zero of them) and examined its next-link,
            // stored an attachment, or added a single resource - sets it true. There is no
            // "else: assume success" branch left to reach; a response shape this file does
            // not recognise (a 200 text/html interstitial, an empty object, anything that
            // is not a Bundle/attachment/single-resource) falls through every branch,
            // recognisedResponse stays false, and the block after this if/else chain treats
            // that as a failure - the only outcome physically reachable when nothing here
            // claimed the response. A future branch that forgets to set the flag under-
            // claims (fails closed) rather than over-claims.
            let recognisedResponse = false;

            if (isJson && resultData?.resourceType === 'Bundle') { // Process Bundle. A page
                // may legitimately carry no `entry` key at all (e.g. `total: 0`) - that is
                // still a Bundle this file understands, so entries default to [] rather than
                // falling through to the unrecognised-response path, and its next-link (if
                // any) is still examined below regardless of whether this page had entries.
                const entries = Array.isArray(resultData.entry) ? resultData.entry : [];
                for (const entry of entries) {
                    if (entry.resource) {
                        const res = entry.resource;
                        if (res.resourceType && res.id) {
                            if (!clientFullEhr.fhir[res.resourceType]) clientFullEhr.fhir[res.resourceType] = [];
                            // Add resource if new
                            if (!clientFullEhr.fhir[res.resourceType].some(r => r.id === res.id)) {
                                if (resourceCount >= MAX_TOTAL_RESOURCES) {
                                    registerCapHit('resource_cap_exceeded', task);
                                } else {
                                    clientFullEhr.fhir[res.resourceType].push(res);
                                    resourceCount++;
                                    discoveredTasks = discoveredTasks.concat(extractTasksFromResource(res, fhirBaseUrl, task.depth));
                                }
                            }
                        }
                    }
                }

                // --- Follow Bundle.link[relation=next], bounded. ---
                const nextLink = Array.isArray(resultData.link)
                    ? resultData.link.find((l: any) => l && l.relation === 'next' && typeof l.url === 'string')
                    : undefined;
                if (nextLink) {
                    if (!isTokenAllowedUrl(nextLink.url, fhirBaseUrl)) {
                        // A next-link is server-supplied, so nothing prevents a misbehaving
                        // or compromised server from pointing it off its own origin - which
                        // would carry the bearer token there on the following fetch. Refused,
                        // not followed; the query is then reported incomplete rather than
                        // silently truncated.
                        console.warn("Refused to follow a Bundle next-link: it is not on the FHIR server's origin.");
                        markQueryFailed(task);
                    } else if (pagesFollowed >= MAX_TOTAL_PAGES) {
                        registerCapHit('page_cap_exceeded', task);
                    } else {
                        // S7 fix: don't count this page as followed yet. It is only
                        // *discovered* here - the dedupe step below (fetchedUrls) can
                        // still drop it silently, e.g. a server that repeats the same
                        // `next` URL forever. pages_followed is incremented once this
                        // task actually survives dedupe and is queued for fetch.
                        discoveredTasks.push({
                            url: nextLink.url,
                            description: task.description,
                            depth: task.depth,
                            queryId: task.queryId,
                            isInitialQuery: task.isInitialQuery,
                            isFollowedPage: true,
                            isSearch: task.isSearch, // a page chained off a search is still that search
                        });
                    }
                } else {
                    // No next link: this query's pagination ran to exhaustion.
                    markQueryComplete(task.queryId);
                }
                recognisedResponse = true;
            } else if (task.isAttachment && isAttachmentBlob && resultData instanceof Blob) { // Process Attachment Blob
                const stored = await processAttachmentData(resultData, task, clientFullEhr.attachments);
                if (!stored) {
                    // The fetch itself succeeded and the response was recognised as an
                    // attachment blob - it is processInlineAttachments/processAttachmentData's
                    // own internal handling that dropped it (missing context, or an error
                    // while extracting/encoding it). Same invariant: attachment_count must
                    // not undercount silently, so this is recorded as a failure rather than
                    // left invisible.
                    failedCategories.add('attachment_dropped');
                    markQueryFailed(task);
                }
                recognisedResponse = true;
            } else if (isJson && !task.isSearch && resultData?.resourceType && resultData.id) {
                // Process Single Resource - only reachable for a task that was not a
                // search (the Patient direct read, or a task built from following a
                // resource reference). #318 Amendment 5: the expectation comes from the
                // task, not the response, so this branch is gated on task.isSearch
                // rather than on anything about resultData.
                const res = resultData;
                if (res.resourceType === 'OperationOutcome') {
                    // The server is reporting a problem with this read, not handing back
                    // the resource that was asked for. #318 Amendment 5: an
                    // OperationOutcome must never be stored into the fhir payload as
                    // though it were a record - that is the same error as counting it as
                    // a success, just on the read path instead of the search path.
                    failedCategories.add('operation_outcome_response');
                    markQueryFailed(task);
                } else {
                    if (!clientFullEhr.fhir[res.resourceType]) clientFullEhr.fhir[res.resourceType] = [];
                    // Add resource if new
                    if (!clientFullEhr.fhir[res.resourceType].some(r => r.id === res.id)) {
                        if (resourceCount >= MAX_TOTAL_RESOURCES) {
                            registerCapHit('resource_cap_exceeded', task);
                        } else {
                            clientFullEhr.fhir[res.resourceType].push(res);
                            resourceCount++;
                            discoveredTasks = discoveredTasks.concat(extractTasksFromResource(res, fhirBaseUrl, task.depth));
                        }
                    }
                    markQueryComplete(task.queryId); // A single resource has no pagination of its own.
                }
                recognisedResponse = true;
            } else if (isJson && task.isSearch && resultData?.resourceType && resultData.id) {
                // #318 Amendment 5 (R-1): a task whose URL is a search must be answered
                // by a Bundle. Anything else - including a single resource that parses
                // cleanly and genuinely carries an id - is not a successful search,
                // whatever it parses as. This is a shape rule derived from the request
                // (task.isSearch, set at task-creation time), not a case enumerated from
                // the response, so a fifth response shape can't defeat it the way three
                // prior response-shaped patches were each defeated in turn.
                //
                // operation_outcome_response is named explicitly because it is the
                // documented, reachable shape (Epic-family endpoints and scope-denied
                // gateways answer some searches this way instead of an empty Bundle);
                // any other single resource answering a search gets unrecognised_response,
                // the same category the terminal fallback below uses for a shape this
                // file doesn't understand at all. Neither is stored into the fhir
                // payload, and neither completes the query - both call markQueryFailed,
                // which fails closed per Amendment 3's invariant.
                if (resultData.resourceType === 'OperationOutcome') {
                    console.warn('A search received a 200 OperationOutcome instead of a Bundle; treating the query as failed rather than as a completed search with one record.');
                    failedCategories.add('operation_outcome_response');
                } else {
                    console.warn('A search received a 200 single resource instead of a Bundle; treating the query as failed rather than as a completed search with one record.');
                    failedCategories.add('unrecognised_response');
                }
                markQueryFailed(task);
                recognisedResponse = true;
            }

            if (!recognisedResponse) {
                // #318 Amendment 3: a 200 response that is not a Bundle, an attachment blob,
                // or a single JSON resource-with-id is not a success this file can vouch for
                // - it might be an expired-session HTML interstitial, a captive-portal page,
                // or any other shape nobody anticipated. `unrecognised_response` names the
                // class without carrying any value from the response itself, and the query
                // (if this task has one) is marked failed rather than complete: the default
                // at every unhandled branch is failure, never success.
                console.warn('Received a 200 response that this file does not recognise (not a Bundle, attachment, or single resource); treating the query as failed rather than assuming success.');
                failedCategories.add('unrecognised_response');
                markQueryFailed(task);
            }
            taskCompletedSuccessfully = true; // Mark as success for progress message

        } catch (error) {
            // A crawl that follows every reference will inevitably ask for things the granted
            // scope does not cover, and servers hold data they will not serve by id. Those are
            // routine outcomes of walking the graph, not faults, and reporting them as errors
            // buried the one defect in this run that was actually ours. Only the error's own
            // message is logged (never the task's description or URL, which can carry the
            // patient's id and specific clinical categories).
            if (isExpectedFetchFailure(error)) {
                console.warn(`Skipped a task (expected): ${(error as Error).message}`);
            } else {
                console.error(`Error processing a task: ${(error as Error)?.message || 'unknown error'}`);
            }
            markQueryFailed(task);
        } finally {
            // This task is complete (either success or failure)
            completedFetches++;
            progressCallback(completedFetches, totalTasks, taskCompletedSuccessfully ? `Completed: ${task.description}` : `Failed: ${task.description}`); // Update progress
            pool.release(); // IMPORTANT: Release the pool slot
        }
        return discoveredTasks; // Return tasks discovered from this resource
    }
    // --- End of fetchAndProcessTask ---

    // --- Initialize Task List ---
    let currentTasks: FetchTask[] = [];
    const requestedQueryIds: string[] = [];
    // Brand endpoints are published with a trailing slash more often than not, so joining
    // with an unconditional "/" yields ".../R4//Observation". Epic tolerates the doubled
    // slash on most paths but rejects it on some, which made this look like an intermittent
    // server fault rather than a URL bug.
    const fhirBaseUrlWithSlash = fhirBaseUrl.endsWith('/') ? fhirBaseUrl : `${fhirBaseUrl}/`;
    // Use the shared query generator
    const initialQueries = getInitialFhirSearchQueries(patientId);

    // Add initial search tasks from the generated queries
    initialQueries.forEach(query => {
        const params = new URLSearchParams(query.params as Record<string, string>);
        // Consider adding a default _count=500 here or handle pagination later
        // params.set('_count', '500');
        const url = `${fhirBaseUrlWithSlash}${query.resourceType}?${params.toString()}`;
        const normalizedUrl = url.replace(/\/$/, ''); // Normalize slightly for deduping
        if (!fetchedUrls.has(normalizedUrl)) {
            fetchedUrls.add(normalizedUrl);
            // Create a meaningful description / query id. Never includes the patient
            // parameter - it's filtered out below - so this is safe to put in the
            // requested_queries / failed_query_categories manifest fields.
            const paramDesc = Object.entries(query.params || {})
                                .filter(([key]) => key !== 'patient') // Don't repeat patient ID
                                .map(([key, value]) => `${key}=${value}`)
                                .join(', ');
            const queryId = `${query.resourceType}${paramDesc ? ` (${paramDesc})` : ''}`;
            requestedQueryIds.push(queryId);
            currentTasks.push({ url: url, description: `Initial ${queryId}`, depth: 0, queryId, isInitialQuery: true, isSearch: true });
        }
    });

    // Add direct patient fetch task (still useful to ensure patient resource is fetched)
    const patientUrl = `${fhirBaseUrlWithSlash}Patient/${patientId}`;
    const normalizedPatientUrl = patientUrl.replace(/\/$/, '');
    if (!fetchedUrls.has(normalizedPatientUrl)) {
        fetchedUrls.add(normalizedPatientUrl);
        const queryId = 'Patient (direct read)';
        requestedQueryIds.push(queryId);
        // #318 Amendment 5: this is a direct read by id, not a search - isSearch stays
        // false so a Bundle-shaped-only expectation is never applied to it. Explicit
        // rather than relying on the field's default so this can't drift silently.
        currentTasks.push({ url: patientUrl, description: "Patient Record", depth: 0, queryId, isInitialQuery: true, isSearch: false });
    }

    totalTasks = currentTasks.length;
    progressCallback(0, totalTasks, 'Starting initial fetch batch...');
    if (totalTasks === 0) {
         console.warn("No initial tasks generated.");
         return {
             ehr: clientFullEhr,
             requestedQueries: requestedQueryIds,
             completedQueries: [],
             failedQueryCategories: ['no_queries_generated'],
             pagesFollowed: 0,
             resourceCount: 0,
             retrievalComplete: false,
         };
    }

    // --- Main Processing Loop (Batching) ---
    while (currentTasks.length > 0) {
        const batchDescription = `Batch of ${currentTasks.length} tasks`;
        console.log(`Starting ${batchDescription}...`); // Log batch start

        // Start all fetch-and-process operations for the current batch.
        // The ConcurrencyManager limits how many actually run simultaneously.
        const promises = currentTasks.map(task => fetchAndProcessTask(task));

        // Wait for all promises in the current batch to settle (complete or fail)
        const results = await Promise.allSettled(promises);

        // Prepare the list of tasks for the *next* batch
        const nextBatchTasks: FetchTask[] = [];
        results.forEach(settledResult => {
            // Check if the promise was fulfilled and returned new tasks
            if (settledResult.status === 'fulfilled' && Array.isArray(settledResult.value)) {
                const newTasksFromResult: FetchTask[] = settledResult.value;
                for (const newTask of newTasksFromResult) {
                    // Only add the task if the URL hasn't been fetched before
                    const normalizedUrl = newTask.url.replace(/\/$/, '');
                    if (!fetchedUrls.has(normalizedUrl)) {
                         fetchedUrls.add(normalizedUrl); // Mark as added
                         nextBatchTasks.push(newTask);
                         totalTasks++; // Increment total count for progress UI
                         // S7 fix: count a followed page only once it is actually queued
                         // for fetch, not merely discovered - a page discovered but then
                         // deduped away here (e.g. a server that repeats the same `next`
                         // URL) was never really "followed".
                         if (newTask.isFollowedPage) pagesFollowed++;
                    }
                }
            }
            // No special handling needed for 'rejected' status here, error logged within fetchAndProcessTask
        });

        console.log(`${batchDescription} finished. Found ${nextBatchTasks.length} new unique tasks.`);

        // Update progress after batch completes (totalTasks might have increased)
        progressCallback(completedFetches, totalTasks, `${batchDescription} finished. Starting next...`);

        currentTasks = nextBatchTasks; // Set up tasks for the next iteration
    }
    // --- End of Main Loop ---

    console.log(`All fetch batches completed. Final progress: ${completedFetches}/${totalTasks}`);

    // --- Final Processing ---
    progressCallback(completedFetches, totalTasks, "Processing inline data..."); // Update status before final step
    const inlineAttachmentsDropped = processInlineAttachments(clientFullEhr);
    // Same invariant as the fetch-loop responses: a silently dropped inline attachment
    // must not leave retrieval_complete true with no trace of what went missing.
    if (inlineAttachmentsDropped > 0) failedCategories.add('inline_attachment_dropped');

    progressCallback(completedFetches, totalTasks, "All fetching complete."); // Final progress update
    console.log(`Finished fetching. Resource types: ${Object.keys(clientFullEhr.fhir).length}, resources: ${resourceCount}, attachments: ${clientFullEhr.attachments.length}, pages followed: ${pagesFollowed}.`);

    // S3 fix: a requested query can go incomplete without ever calling
    // markQueryFailed - e.g. a cyclic `next` link, where the repeated task is dropped
    // silently by the fetchedUrls dedupe above and neither markQueryComplete nor
    // markQueryFailed ever runs for it again. Deriving the failed set from "requested
    // but never completed", rather than only from explicit failure calls, means
    // retrieval_complete and failed_query_categories cannot disagree: whenever the
    // former is false because some requested query is incomplete, the latter always
    // names it.
    for (const id of requestedQueryIds) {
        if (!queryCompleted.has(id)) failedCategories.add(categoryOf(id));
    }

    const completedQueries = requestedQueryIds.filter(id => queryCompleted.has(id));
    // S1 fix: also false when an attachment_fetch_failed / reference_fetch_failed (or
    // any cap) category was recorded, even though those tasks have no queryId and so
    // can never appear in requestedQueryIds/completedQueries themselves.
    const retrievalComplete = failedCategories.size === 0;

    return {
        ehr: clientFullEhr,
        requestedQueries: requestedQueryIds,
        completedQueries,
        failedQueryCategories: Array.from(failedCategories),
        pagesFollowed,
        resourceCount,
        retrievalComplete,
    };
}