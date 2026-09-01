import pkceChallenge from 'pkce-challenge'; // Import the library
import { fetchAllEhrDataClientSideParallel } from './clientFhirUtils'; // UPDATED: Import the parallel data fetching function

// --- Declare potential global constants injected by build ---
declare const __CONFIG_FHIR_BASE_URL__: string | undefined;
declare const __CONFIG_CLIENT_ID__: string | undefined;
declare const __CONFIG_SCOPES__: string | undefined;
// NEW BRAND INDEX CONSTANT (injected at build time)
// Structure: Array of { url: string; tags: string[]; vendorConfig: { clientId: string; scopes: string; redirectUrl?: string } }
declare const __BRAND_FILE_INDEX__: { url: string; tags: string[]; vendorConfig: { clientId: string; scopes: string; redirectUrl?: string } }[] | undefined;
// ----------------------------------------------------------

// Keys for sessionStorage
const AUTH_STORAGE_KEY = 'smart_auth_state';

interface StoredAuthState {
    codeVerifier: string;
    state: string;
    tokenEndpoint: string;
    clientId: string;
    redirectUri: string;
    fhirBaseUrl: string;
}

// --- DOM Element References ---
let brandSelectorContainer: HTMLElement | null;
let brandSearchInput: HTMLInputElement | null;
let brandSearchSpinner: HTMLElement | null;
let brandResultsContainer: HTMLElement | null;
let brandModalBackdrop: HTMLElement | null;
let brandModal: HTMLElement | null;
let brandModalTitle: HTMLElement | null;
let brandModalDetails: HTMLElement | null;
let brandModalCancel: HTMLButtonElement | null;
let brandModalConnect: HTMLButtonElement | null;
let brandInitialLoadingMessage: HTMLElement | null;
// REMOVED form element variables
// let formContainer: HTMLElement | null;
// let ehrForm: HTMLFormElement | null;
// let ehrBaseUrlInput: HTMLInputElement | null;
// let ehrClientIdInput: HTMLInputElement | null;
// let ehrScopesInput: HTMLInputElement | null;
// let ehrRedirectUriInput: HTMLInputElement | null;
let statusContainer: HTMLElement | null;
let statusMessageElement: HTMLElement | null;
let progressContainer: HTMLElement | null;
let progressBar: HTMLProgressElement | null;
let progressText: HTMLElement | null;


// NEW: Download Button Element
let downloadDataBtn: HTMLButtonElement | null;

// --- Brand Selector State ---
let allBrandItems: any[] = [];
let selectedBrandItem: any | null = null;
let currentBrandRenderAbortController: AbortController | null = null;
let brandDebounceTimer: number | null = null;
let currentFilteredItems: any[] = [];
let currentPage = 1;
// 25, not 1200. Chunked rendering keeps the main thread responsive, but once tiles are
// real buttons (see createBrandTileElement) a 1200-item page is a keyboard trap: tabbing
// past the list is impossible. The pager exists; let it work.
const ITEMS_PER_PAGE = 25;
// Removed single currentVendorName; each brand item will now carry its own _vendorName property

// NEW: Pagination DOM Elements
let brandPaginationControls: HTMLElement | null;
let brandPrevBtn: HTMLButtonElement | null;
let brandNextBtn: HTMLButtonElement | null;
let brandPageInfo: HTMLElement | null;

// --- Brand Selector Configuration ---
// Set when a pager button moved the page, so focus follows the new content.
let pendingPageFocus = false;
const RENDER_CHUNK_SIZE = 50;
const RENDER_DELAY = 0; // ms delay between rendering chunks
const DEBOUNCE_DELAY = 300; // ms delay for search input debounce

// Helper function to update status message
function updateStatus(message: string, isError: boolean = false) {
    if (statusMessageElement) {
        statusMessageElement.textContent = message;
        // Colour alone cannot carry "this is an error" (SC 1.4.1), and the old inline
        // red/black both failed contrast and overrode the page's own palette. The class
        // owns the colour and adds a non-colour cue; the role makes errors interrupt.
        statusMessageElement.classList.toggle('is-error', isError);
        statusMessageElement.setAttribute('role', isError ? 'alert' : 'status');
    }
    console.log(`Status: ${message}`);
    if (isError) {
        console.error(`Status Error: ${message}`);
    }
}

// Helper function to manage display
function showStatusContainer(show: boolean) {
    const formContainer = document.getElementById('form-container');
    const statusContainer = document.getElementById('status-container');
    if (formContainer) formContainer.style.display = show ? 'none' : 'block';
    if (statusContainer) statusContainer.style.display = show ? 'block' : 'none';
}

// Helper function to show/hide progress UI
function showProgressContainer(show: boolean) {
    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) progressContainer.style.display = show ? 'block' : 'none';
}

// The confirmation UI existed only to approve sending the record to another origin.
// With delivery removed there is nothing to confirm, so this only ever hides it -
// kept so a stale cached page cannot leave the panel visible.
function showConfirmationContainer(show: boolean) {
    const confirmationContainer = document.getElementById('confirmation-container');
    if (confirmationContainer) confirmationContainer.style.display = 'none';
}

// Throttle state for the progress live region.
let lastAnnouncedPercent = -Infinity;
let lastAnnouncedAt = 0;

// Helper function to update progress UI
function updateProgress(completed: number, total: number, message?: string) {
    const progressBar = document.getElementById('fetch-progress') as HTMLProgressElement;
    const progressText = document.getElementById('progress-text');

    if (progressBar && progressText) {
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        progressBar.value = percentage;
        progressBar.textContent = `${Math.round(percentage)}%`; // fallback content

        // Prose, not `(318/512)`.
        const line = `${completed} of ${total} \u00B7 ${Math.round(percentage)}%`;

        // #progress-text is a live region, so it cannot be rewritten once per resource -
        // that makes a screen reader unusable. Announce on a ~10% or ~2s boundary, and
        // always on the final update.
        const now = Date.now();
        const done = total > 0 && completed >= total;
        if (done || percentage - lastAnnouncedPercent >= 10 || now - lastAnnouncedAt >= 2000) {
            lastAnnouncedPercent = percentage;
            lastAnnouncedAt = now;
            progressText.textContent = message ? `${line} \u00B7 ${message}` : line;
        }
        console.log(`Progress: ${completed}/${total} (${percentage.toFixed(1)}%) ${message || ''}`);
    }

    // Show the container if it's not already visible and we have progress
    if (total > 0) {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer && progressContainer.style.display === 'none') {
            showProgressContainer(true);
        }
    }

    // -----------------------------------------
}

// Helper function to resolve potentially relative URLs to absolute ones
function makeAbsoluteUrl(urlStr: string): string {
    try {
        // Use the URL constructor with the current page's origin as the base
        // This correctly handles absolute URLs, root-relative URLs (/path), and other relative paths.
        const absoluteUrl = new URL(urlStr, window.location.origin);
        return absoluteUrl.toString();
    } catch (e) {
        console.error(`Error creating absolute URL from "${urlStr}":`, e);
        return urlStr; // Return original string on error
    }
}

/**
 * Fetch with a short retry and errors that say what actually went wrong.
 *
 * Two real failure modes made this necessary:
 *
 *  - Epic's sandbox returned a single 503 for SMART discovery and succeeded on the
 *    very next attempt, with the endpoint answering 200 on five consecutive probes
 *    from outside the browser. One flaky response should not end the flow.
 *  - When a host does not resolve at all — as happened when a brand directory entry
 *    still pointed at a decommissioned endpoint — fetch rejects with a TypeError
 *    instead of resolving with a status, so the `response.ok` check never runs and
 *    the user is left with the browser's bare "Load failed", which reads like a bug
 *    in this client rather than a stale directory entry.
 *
 * Only idempotent GETs should use this. The token exchange must not be retried: an
 * authorization code is single-use, so a replay fails for a different reason and
 * obscures the original error.
 */
async function fetchWithRetry(url: string, init: RequestInit = {}, attempts = 3): Promise<Response> {
    let lastFailure = '';

    for (let attempt = 0; attempt < attempts; attempt++) {
        if (attempt > 0) {
            const delayMs = 400 * Math.pow(3, attempt - 1); // 400ms, then 1200ms
            updateStatus(`Connection problem; retrying (${attempt + 1} of ${attempts})...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        try {
            const response = await fetch(url, init);
            // 5xx is usually transient. 4xx is not, so do not spend retries on it.
            if (response.status >= 500 && attempt < attempts - 1) {
                lastFailure = `${response.status} ${response.statusText}`;
                console.warn(`[fetchWithRetry] ${lastFailure} from ${url}; retrying.`);
                continue;
            }
            return response;
        } catch (err: any) {
            // fetch rejects rather than resolving on DNS failure, TLS failure,
            // CORS rejection, and when offline.
            lastFailure = err?.message || String(err);
            console.warn(`[fetchWithRetry] Network failure for ${url}: ${lastFailure}`);
        }
    }

    let host = url;
    try { host = new URL(url).host; } catch { /* keep the raw string */ }
    throw new Error(
        `Could not reach ${host}. The server may be temporarily unavailable, or this ` +
        `organization's directory entry may be out of date.` +
        (lastFailure ? ` (${lastFailure})` : '')
    );
}

// Function to generate a random string for state
function generateRandomString(length = 40) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// --- Brand Selector Helper Functions ---

// Helper to safely get lowercase string or empty string
const safeLower = (str: any): string => (str ? String(str).toLowerCase() : '');

// Creates a DOM element for a single brand item tile
/**
 * Location for display, for every item rather than only facilities.
 *
 * In the real directory most rows have no city — 69 of the 150 in
 * site/public/brands/epic-sample.json, and brand-level rows never carry one — so the old
 * `itemType === 'facility'` guard left most rows with no place line and a ragged list.
 * Emitting an explicit "not listed" keeps every row the same shape.
 */
function formatLocation(item: any): string {
    const parts = [item.city, item.state].filter(Boolean);
    if (item.postalCode && parts.length) parts.push(String(item.postalCode).split('-')[0]);
    return parts.length ? parts.join(', ') : 'Location not listed';
}

function createBrandTileElement(item: any): HTMLLIElement {
    // A <div> with a click handler is not focusable, exposes no role, and announces
    // nothing on activation (SC 2.1.1, 4.1.2). A real <button> gets all of that free.
    //
    // Built with createElement/textContent rather than innerHTML: the brand directory is
    // third-party data, and an apostrophe in an organisation name is enough to break the
    // markup that the old string interpolation produced.
    const li = document.createElement('li');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'brand-tile';

    const text = document.createElement('span');
    text.className = 'brand-tile-text';

    // No <h3> here. These are not section headings, and one per row makes the heading
    // outline useless for screen-reader navigation. The name is the button's own label.
    const name = document.createElement('span');
    name.className = 'brand-tile-name';
    name.textContent = item.displayName;
    text.appendChild(name);

    const provider = document.createElement('span');
    provider.className = 'brand-tile-provider';
    provider.textContent = `Data provider: ${item.brandName}`;
    text.appendChild(provider);

    const hasCollapseInfo = typeof item._matchedCount === 'number' && typeof item._totalCount === 'number';

    const location = document.createElement('span');
    location.className = 'brand-tile-location';
    location.textContent = hasCollapseInfo
        ? `Matched ${item._matchedCount} of ${item._totalCount} card${item._totalCount !== 1 ? 's' : ''}`
        : formatLocation(item);
    text.appendChild(location);

    button.appendChild(text);

    const kind = document.createElement('span');
    kind.className = 'brand-tile-kind';
    kind.textContent = item.itemType === 'brand' ? 'Health system' : 'Facility';
    button.appendChild(kind);

    button.addEventListener('click', () => showBrandModal(item));
    li.appendChild(button);
    return li;
}

// --- Helper: Collapse multiple items from the same brand into a single representative ---
function collapseBrandItems(allItems: any[], matchedItems: any[], scoreMap: Map<any, number>): any[] {
    const matchedSet = new Set(matchedItems);
    const grouped: Record<string, any[]> = {};
    allItems.forEach(itm => {
        const key = itm.brandId || itm.brandName;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(itm);
    });

    const collapsed: any[] = [];
    for (const key in grouped) {
        const group = grouped[key];
        const matchedInGroup = group.filter(itm => matchedSet.has(itm));
        const matchedCount = matchedInGroup.length; // Count of matched items
        const totalCount = group.length; // Total items in this brand group

        if (matchedCount === 0) continue; // Nothing matched in this group

        if (matchedCount === 1) {
            // Only one matched item – show it as-is (no collapsing)
            const single = matchedInGroup[0];
            // Ensure score is attached, but no collapse info
            const repCloneSingle = { ...single, _score: scoreMap.get(single) ?? 0 };
            delete repCloneSingle._matchedCount; // Remove potentially stale info
            delete repCloneSingle._totalCount;
            delete repCloneSingle._collapseCount; // Remove old property
            collapsed.push(repCloneSingle);
        } else {
            // Multiple matched items – collapse the group
            // Prefer brand-level item from the *original* group as representative
            let representative = group.find(g => g.itemType === 'brand');
            if (!representative) {
                // Fallback: shortest displayName among matched items
                representative = matchedInGroup.slice().sort((a, b) => a.displayName.length - b.displayName.length)[0];
            }

            // Use the best score from the *matched* items for sorting
            const bestScore = Math.min(...matchedInGroup.map(it => scoreMap.get(it) ?? 0));

            // Clone representative and add new collapse info
            const repClone = {
                ...representative,
                _score: bestScore,
                _matchedCount: matchedCount, // Store how many matched
                _totalCount: totalCount     // Store total in group
            };
            delete repClone._collapseCount; // Explicitly remove old property
            collapsed.push(repClone);
        }
    }
    return collapsed;
}

// Renders a list of items into the results container in manageable chunks
function renderBrandItemsInChunks(itemsToRender: any[]) {
    if (!brandResultsContainer || !brandSearchSpinner) return;

    if (currentBrandRenderAbortController) { currentBrandRenderAbortController.abort(); }
    currentBrandRenderAbortController = new AbortController();
    const signal = currentBrandRenderAbortController.signal;
    if (brandResultsContainer) brandResultsContainer.textContent = ''; // Clear previous results

    if (itemsToRender.length === 0) {
        if (brandResultsContainer) {
            // Static string, but built as a node so this file contains no innerHTML at all
            // and the "no untrusted markup" property is checkable with one grep.
            const empty = document.createElement('li');
            empty.className = 'brand-status-message';
            empty.textContent = 'No matching organizations found.';
            brandResultsContainer.textContent = '';
            brandResultsContainer.appendChild(empty);
        }
        if (brandSearchSpinner) brandSearchSpinner.style.display = 'none';
        return;
    }

    let currentIndex = 0;
    const fragment = document.createDocumentFragment();

    function renderNextChunk() {
        if (signal.aborted) {
            if (brandSearchSpinner) brandSearchSpinner.style.display = 'none';
            return; // Stop if aborted
        }
        if (brandSearchSpinner) brandSearchSpinner.style.display = 'block'; // Show spinner during render
        const endTime = performance.now() + 16; // Target ~60fps budget
        let chunkCount = 0;

        while (performance.now() < endTime && currentIndex < itemsToRender.length) {
             fragment.appendChild(createBrandTileElement(itemsToRender[currentIndex]));
             currentIndex++;
             chunkCount++;
             if(chunkCount >= RENDER_CHUNK_SIZE) break; // Optional batch size limit per frame
        }
        if (brandResultsContainer) brandResultsContainer.appendChild(fragment); // Append the chunk

        if (currentIndex < itemsToRender.length) {
            setTimeout(renderNextChunk, RENDER_DELAY); // Schedule next chunk
        } else {
            if (brandSearchSpinner) brandSearchSpinner.style.display = 'none'; // Hide spinner when done
            currentBrandRenderAbortController = null; // Clear controller
        }
    }
    renderNextChunk(); // Start the rendering process
}

// *** NEW: Renders the items for the current page and updates controls ***
function renderCurrentPage() {
    if (!brandResultsContainer || !brandPaginationControls || !brandPrevBtn || !brandNextBtn || !brandPageInfo) {
        console.error("Cannot render page, pagination elements missing.");
        return;
    }

    const totalItems = currentFilteredItems.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    currentPage = Math.max(1, Math.min(currentPage, totalPages)); // Ensure currentPage is valid

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE; // slice excludes end index
    const itemsToDisplay = currentFilteredItems.slice(startIndex, endIndex);

    console.log(`Rendering page ${currentPage} of ${totalPages}. Items ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}.`);

    renderBrandItemsInChunks(itemsToDisplay); // Render only this page's items

    brandPageInfo.textContent = totalItems === 0
        ? ''
        : `Page ${currentPage} of ${totalPages || 1} · showing ${startIndex + 1}–${Math.min(endIndex, totalItems)} of ${totalItems}`;

    // Keep the platform attribute doing the disabling.
    brandPrevBtn.disabled = currentPage <= 1;
    brandNextBtn.disabled = currentPage >= totalPages;

    brandPaginationControls.style.display = totalPages > 1 ? 'flex' : 'none';

    setResultStatus();

    // A page change replaces everything below the pager. Without moving focus, a keyboard
    // user activates "Next" and stays on the button while the content they asked for is
    // somewhere above them, unannounced.
    if (pendingPageFocus) {
        pendingPageFocus = false;
        window.setTimeout(() => {
            brandResultsContainer?.querySelector<HTMLElement>('button')?.focus();
        }, 0);
    }
}

/**
 * One status line for the three states the list can be in.
 *
 * Without this a screen-reader user types into the search box and hears nothing at all:
 * the spinner is purely visual and the result count was never stated. Announced after the
 * render rather than per keystroke — the 300 ms debounce already provides the quiet.
 */
function setResultStatus(errorMessage?: string) {
    if (!brandInitialLoadingMessage) return;
    brandInitialLoadingMessage.style.display = 'block';

    if (errorMessage) {
        brandInitialLoadingMessage.textContent = errorMessage;
        brandInitialLoadingMessage.classList.add('is-error');
        return;
    }
    brandInitialLoadingMessage.classList.remove('is-error');

    const query = brandSearchInput?.value.trim() ?? '';
    const n = currentFilteredItems.length;

    if (!query) {
        brandInitialLoadingMessage.textContent =
            `${n.toLocaleString()} ${n === 1 ? 'organization' : 'organizations'} available. Start typing to narrow the list.`;
    } else if (n === 0) {
        brandInitialLoadingMessage.textContent = `No matches for \u201C${query}\u201D.`;
    } else {
        brandInitialLoadingMessage.textContent =
            `${n.toLocaleString()} ${n === 1 ? 'match' : 'matches'} for \u201C${query}\u201D.`;
    }
}

// Filters items based on search input and triggers rendering
function handleBrandSearch() {
    if (!brandSearchInput || !brandSearchSpinner) return;

    const searchTerm = brandSearchInput.value.toLowerCase().trim();
    const searchTokens = searchTerm.split(/[^\w\d]+/).filter(token => token.length > 0);

    brandSearchSpinner.style.display = 'block';

    const scoreMap: Map<any, number> = new Map();

    const searchFiltered = searchTokens.length === 0
        ? allBrandItems
        : allBrandItems.filter(item => {
            let cumulativeScore = 0;
            const matched = searchTokens.every(token => {
                const fieldsToSearch = [
                    safeLower(item.displayName),
                    safeLower(item.brandName),
                    safeLower(item.city),
                    safeLower(item.state),
                    safeLower(item.postalCode)
                ];
                let bestPos = Infinity;
                for (const field of fieldsToSearch) {
                    const idx = field.indexOf(token);
                    if (idx !== -1 && idx < bestPos) bestPos = idx;
                }
                if (bestPos !== Infinity) {
                    cumulativeScore += bestPos;
                    return true;
                }
                return false; // token not matched in any field
            });
            if (matched) {
                // Add small tie-breaker based on displayName length
                cumulativeScore += (safeLower(item.displayName).length / 100);
                scoreMap.set(item, cumulativeScore);
            }
            return matched;
        });

    const collapsed = collapseBrandItems(allBrandItems, searchFiltered, scoreMap);
    if (searchTokens.length === 0) {
        collapsed.sort((a, b) => safeLower(a.displayName).localeCompare(safeLower(b.displayName)));
    } else {
        collapsed.sort((a, b) => (a._score ?? Infinity) - (b._score ?? Infinity));
    }
    currentFilteredItems = collapsed;

    // Reset to page 1 and render
    currentPage = 1;
    renderCurrentPage();
}

// Debounce function
function debounce(func: (...args: any[]) => void, delay: number) {
    return function(...args: any[]) {
        if (brandSearchSpinner) brandSearchSpinner.style.display = 'block'; // Show spinner immediately on input
        clearTimeout(brandDebounceTimer as number | undefined);
        brandDebounceTimer = window.setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

const debouncedBrandSearchHandler = debounce(handleBrandSearch, DEBOUNCE_DELAY);

// The element that opened the dialog, so focus can be handed back on close.
let lastFocusedTile: HTMLElement | null = null;

function addDetailRow(dl: HTMLDListElement, label: string, value: string, mono = false) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    if (mono) dd.className = 'is-mono';
    dl.appendChild(dt);
    dl.appendChild(dd);
}

// Shows the modal with details of the selected item
function showBrandModal(item: any) {
    if (!brandModalBackdrop || !brandModalTitle || !brandModalDetails) return;
    if (currentBrandRenderAbortController) { return; } // Don't show modal during render

    selectedBrandItem = item;
    lastFocusedTile = document.activeElement as HTMLElement | null;

    // A fixed heading, with the organisation in the body. The old
    // `Connect to ${displayName}?` produces a 100-character heading for the longest real
    // entry in the directory.
    brandModalTitle.textContent = 'Confirm your health system';

    // Rebuilt with createElement/textContent — same injection concern as the tiles.
    brandModalDetails.textContent = '';

    const name = document.createElement('p');
    name.className = 'brand-modal-org';
    name.textContent = item.displayName;
    brandModalDetails.appendChild(name);

    const dl = document.createElement('dl');
    addDetailRow(dl, 'Data provider', item.brandName);

    const hasCollapseInfo = typeof item._matchedCount === 'number' && typeof item._totalCount === 'number';
    addDetailRow(dl, 'Location', hasCollapseInfo
        ? `Matched ${item._matchedCount} of ${item._totalCount} card${item._totalCount !== 1 ? 's' : ''}`
        : formatLocation(item));

    // One endpoint, not a list of all of them. handleBrandConnect() uses endpoints[0]
    // regardless, so listing the rest misleads about what is about to happen — and the old
    // markup distinguished the FHIR one by font-weight alone, which is presentation
    // carrying meaning (SC 1.3.1, 1.4.1).
    const endpoint = item.endpoints?.[0]?.url;
    addDetailRow(dl, 'FHIR endpoint', endpoint || 'None found', true);
    brandModalDetails.appendChild(dl);

    const vc: VendorAuthConfig | undefined = (item as any)._vendorConfig;
    if (vc && vc.note) {
        const note = document.createElement('p');
        note.className = 'brand-modal-note';
        note.textContent = `Login info: ${vc.note}`;
        brandModalDetails.appendChild(note);
    }

    brandModalBackdrop.classList.add('visible');

    // Keep the list behind the dialog out of the tab order and off the accessibility tree.
    if (brandSelectorContainer) {
        (brandSelectorContainer as any).inert = true;
        brandSelectorContainer.setAttribute('aria-hidden', 'true');
    }

    // Cancel, not Connect: the safe default is the one that does nothing.
    brandModalCancel?.focus();
}

// Hides the modal
function hideBrandModal() {
    if (!brandModalBackdrop) return;
    brandModalBackdrop.classList.remove('visible');
    selectedBrandItem = null;

    if (brandSelectorContainer) {
        (brandSelectorContainer as any).inert = false;
        brandSelectorContainer.removeAttribute('aria-hidden');
    }

    // Back where it came from, so the list does not restart from the top.
    lastFocusedTile?.focus();
    lastFocusedTile = null;
}

/**
 * Escape to close, Tab cycles within the dialog.
 *
 * Registered once at init rather than inside the brand-load success path, where the old
 * bare Escape listener lived — a directory load failure left Escape dead.
 */
function onModalKeydown(event: KeyboardEvent) {
    if (!brandModalBackdrop?.classList.contains('visible')) return;
    if (event.key === 'Escape') { event.preventDefault(); hideBrandModal(); return; }
    if (event.key !== 'Tab' || !brandModal) return;

    const focusable = brandModal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

interface VendorAuthConfig { clientId: string; scopes: string; redirectUrl?: string; note?: string }

/**
 * The screen a patient sees when their provider has not received the app yet.
 *
 * Built rather than templated because the organisation name is interpolated, and it comes
 * from the brand directory - the same untrusted third-party data the tiles are built from.
 *
 * The heading takes focus: the user pressed a button expecting to leave the page, and
 * without moving focus a screen-reader user is left in a list that silently changed.
 */
function showNotYetAvailable(organizationName: string) {
    hideBrandModal();
    if (brandSelectorContainer) brandSelectorContainer.style.display = 'none';
    showProgressContainer(false);
    showStatusContainer(true);

    if (!statusContainer) return;
    statusContainer.textContent = '';
    statusContainer.className = 'panel notice';

    const heading = document.createElement('h2');
    heading.id = 'not-available-h';
    heading.tabIndex = -1;
    heading.textContent = 'This tool has not reached your health system yet';
    statusContainer.appendChild(heading);

    // role="status" rather than "alert": nothing is wrong, and an assertive
    // interruption would overstate it.
    const explain = document.createElement('p');
    explain.setAttribute('role', 'status');
    explain.textContent = `${organizationName} has not yet received this application from Epic. `
        + 'Epic sends new applications to each health system on its own schedule, so this usually '
        + 'resolves on its own within a few days. Nothing is wrong with your account, and there is '
        + 'nothing you need to fix.';
    statusContainer.appendChild(explain);

    const next = document.createElement('p');
    next.textContent = 'What you can do:';
    statusContainer.appendChild(next);

    const list = document.createElement('ul');
    [
        'Try again in a few days.',
        'Try a different health system, if more than one holds part of your record.',
        'Ask your health system\u2019s medical records department for a copy directly \u2014 your right to it does not depend on this tool.',
    ].forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
    });
    statusContainer.appendChild(list);

    const actions = document.createElement('p');
    const back = document.createElement('a');
    back.href = '/ehr-connect';
    back.className = 'btn btn-secondary';
    back.textContent = 'Choose a different health system';
    actions.appendChild(back);
    statusContainer.appendChild(actions);

    // After the DOM settles, so the announcement is not lost to the rebuild.
    window.setTimeout(() => heading.focus(), 0);
}

/**
 * Has this app reached this health system yet?
 *
 * Epic distributes an app to qualifying customers on each organisation's own schedule, so
 * for a while after going live the app works at some and not others. An organisation that
 * has not received it yet answers the authorize request with a generic "OAuth2 Error"
 * page - which the patient sees as a dead end on their provider's own domain, with
 * nothing to suggest that waiting would fix it.
 *
 * The probe exploits an asymmetry that happens to be exactly the right way round:
 *
 *   not distributed -> Epic renders the error page itself, and sends CORS headers with
 *                      it, so the body is readable here.
 *   distributed     -> Epic redirects to a MyChart login host that sends no CORS headers,
 *                      so the fetch rejects and we learn nothing.
 *
 * So this can only ever prove the *negative*, which is the safe direction: we warn only
 * when the error page has actually been read. Every other outcome - a rejected fetch, a
 * timeout, an unfamiliar body - continues to the redirect exactly as before. A patient
 * whose provider works must never be blocked by a probe that failed for its own reasons.
 *
 * Runs browser-to-provider like the rest of the flow. Nothing is sent to our server, so
 * this does not weaken the claim that we never learn which health system you use.
 */
async function isClientUndistributed(authorizationEndpoint: string, clientId: string, fhirBaseUrl: string): Promise<boolean> {
    try {
        const probeUrl = new URL(authorizationEndpoint);
        probeUrl.searchParams.set('response_type', 'code');
        probeUrl.searchParams.set('client_id', clientId);
        probeUrl.searchParams.set('scope', 'patient/*.read');
        probeUrl.searchParams.set('redirect_uri', window.location.origin + '/ehr-callback');
        probeUrl.searchParams.set('state', 'distribution-probe');
        probeUrl.searchParams.set('aud', fhirBaseUrl);

        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 6000);
        let body: string;
        try {
            const response = await fetch(probeUrl.toString(), { mode: 'cors', signal: controller.signal });
            body = await response.text();
        } finally {
            window.clearTimeout(timer);
        }

        // Only the error page is a verdict. Anything else means proceed.
        const undistributed = /OAuth2\s*Error/i.test(body);
        console.log(`[distribution] ${undistributed ? 'error page read - app not yet at this organisation' : 'no error page; continuing'}`);
        return undistributed;
    } catch (e) {
        // Redirected to a login host without CORS, offline, blocked, timed out - all
        // indistinguishable here, and none of them justify stopping the user.
        console.log('[distribution] probe inconclusive; continuing to authorization.', e);
        return false;
    }
}

async function initiateSmartAuth(fhirBaseUrl: string, vendorAuthConfig: VendorAuthConfig, vendorLabel: string = 'vendor') {
    // Define the default redirect URI (this page) - Defined here as it's only needed here
    const defaultRedirectUri = window.location.origin + window.location.pathname;

    console.log(`[initiateSmartAuth] Starting for FHIR Base URL: ${fhirBaseUrl}, VendorLabel: ${vendorLabel}`);
    showStatusContainer(true);
    showProgressContainer(false);
    updateStatus('Preparing authorization request...');

    const { clientId, scopes, redirectUrl } = vendorAuthConfig;
    if (!clientId || !scopes) {
        updateStatus('Error: Missing SMART client configuration (clientId/scopes).', true);
        console.error('VendorAuthConfig missing fields:', vendorAuthConfig);
        return;
    }

    const redirectUri = redirectUrl ? makeAbsoluteUrl(redirectUrl) : defaultRedirectUri;

    console.log('[initiateSmartAuth] Using VendorAuthConfig:', vendorAuthConfig);

    try {
        updateStatus('Performing SMART discovery...');
        // 1. SMART Discovery
        const fhirBaseUrlWithSlash = fhirBaseUrl.endsWith('/') ? fhirBaseUrl : fhirBaseUrl + '/';
        const wellKnownUrlString = fhirBaseUrlWithSlash + '.well-known/smart-configuration';
        console.log(`[initiateSmartAuth] Attempting SMART discovery at: ${wellKnownUrlString}`);
        const discoveryResponse = await fetchWithRetry(wellKnownUrlString, {
            headers: { 'Accept': 'application/json' }
        });

        if (!discoveryResponse.ok) {
            throw new Error(
                `SMART discovery failed: ${discoveryResponse.status} ${discoveryResponse.statusText} ` +
                `(${wellKnownUrlString}). This organization's endpoint may not be available.`
            );
        }

        const smartConfig = await discoveryResponse.json();
        const authorizationEndpoint = smartConfig.authorization_endpoint;
        const tokenEndpoint = smartConfig.token_endpoint;

        if (!authorizationEndpoint || !tokenEndpoint) {
            throw new Error('SMART configuration missing required authorization or token endpoint.');
        }
        updateStatus('SMART discovery successful.');

        // 2. Generate PKCE & State
        updateStatus('Generating security parameters...');
        const { code_verifier: codeVerifier, code_challenge: codeChallenge } = pkceChallenge();
        const state = generateRandomString();

        // 3. Store necessary state for redirect
        const authState: StoredAuthState = {
            codeVerifier: codeVerifier,
            state: state,
            tokenEndpoint: tokenEndpoint,
            clientId: clientId, // Use vendor-specific clientId
            redirectUri: redirectUri, // Use determined redirectUri
            fhirBaseUrl: fhirBaseUrl
        };
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
        console.log('[initiateSmartAuth] Stored auth state in sessionStorage');

        // 4. Construct Authorization URL
        const authUrl = new URL(authorizationEndpoint);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', clientId); // Use vendor-specific clientId
        authUrl.searchParams.set('scope', scopes); // Use vendor-specific scopes
        authUrl.searchParams.set('redirect_uri', redirectUri); // Use determined redirectUri
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('aud', fhirBaseUrl); // AUD is typically the FHIR base URL itself
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        // 5. Check the app has reached this organisation before sending the user away.
        updateStatus('Checking availability at this organization...');
        if (await isClientUndistributed(authorizationEndpoint, clientId, fhirBaseUrl)) {
            sessionStorage.removeItem(AUTH_STORAGE_KEY); // nothing will come back
            showNotYetAvailable(vendorLabel);
            return;
        }

        // 6. Redirect user
        updateStatus('Redirecting to EHR for authorization...');
        console.log(`[initiateSmartAuth] Redirecting to: ${authUrl.toString()}`);
        window.location.href = authUrl.toString();

    } catch (err: any) {
        updateStatus(`Error during authorization initiation: ${err.message}`, true);
        // Show brand selector again on error?
        if (brandSelectorContainer) brandSelectorContainer.style.display = 'block';
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
}

// *** UPDATED FUNCTION: Handles the click on the modal's "Connect" button ***
function handleBrandConnect() {
    if (!selectedBrandItem || !brandSelectorContainer) {
        console.error("Connect clicked but required elements or selection missing.");
        hideBrandModal();
        updateStatus("Error: Cannot proceed with connection. Missing information.", true);
        if (brandSelectorContainer) brandSelectorContainer.style.display = 'block';
        return;
    }

    const vendorConfig: VendorAuthConfig | undefined = (selectedBrandItem as any)._vendorConfig;
    if (!vendorConfig) {
        console.error("Selected brand item is missing _vendorConfig property.");
        updateStatus("Error: Selected organization is missing SMART client credentials.", true);
        return;
    }

    console.log("--- Brand Connect Button Clicked ---");
    console.log("Selected Item:", selectedBrandItem);
    console.log('Using vendorConfig:', vendorConfig);

    // Find a suitable FHIR endpoint URL (take the first endpoint)
    let fhirEndpointUrl: string | null = null;
    if (selectedBrandItem.endpoints && Array.isArray(selectedBrandItem.endpoints) && selectedBrandItem.endpoints.length > 0) {
        fhirEndpointUrl = selectedBrandItem.endpoints[0].url;
    }

    // Capture label before we possibly clear selectedBrandItem
    const brandLabel: string = (selectedBrandItem as any).brandName || 'vendor';

    // Close the modal immediately (this will clear selectedBrandItem)
    hideBrandModal();

    if (fhirEndpointUrl) {
        console.log(`Found FHIR Endpoint: ${fhirEndpointUrl}`);
        if (brandSelectorContainer) brandSelectorContainer.style.display = 'none';
        initiateSmartAuth(fhirEndpointUrl, vendorConfig, brandLabel);
    } else {
        console.error("Could not find a suitable FHIR endpoint for the selected organization.");
        updateStatus("Error: Could not find a FHIR endpoint for the selected organization. Please try another.", true);
        if (brandSelectorContainer) brandSelectorContainer.style.display = 'block';
    }
}

// Fetches brand data files based on tag filtering and initializes selector UI
async function fetchBrandsAndInitialize() {
    console.log("[fetchBrands] Function started.");

    if (!brandInitialLoadingMessage || !brandResultsContainer || !brandSearchInput || !brandSearchSpinner || !brandPaginationControls) {
        console.error("[fetchBrands] Error: Required DOM elements not found!");
        if (brandInitialLoadingMessage) {
            brandInitialLoadingMessage.textContent = 'Initialization error: page elements are missing.';
            brandInitialLoadingMessage.classList.add('is-error');
        }
        return;
    }

    brandInitialLoadingMessage.textContent = 'Loading organizations data...';
    brandResultsContainer.style.display = 'none';
    brandPaginationControls.style.display = 'none';
    brandSearchInput.disabled = true;
    brandSearchSpinner.style.display = 'block';

    try {
        // Determine desired tags from URL (?brandTags=tag1,tag2) or default to ['prod']
        const urlParams = new URLSearchParams(window.location.search);
        const tagParam = urlParams.get('brandTags');

        let tagFilterGroups: string[][] = [];
        if (tagParam) {
            const orGroups = tagParam.split(',').map(g => g.trim()).filter(Boolean);
            tagFilterGroups = orGroups.map(group =>
                group.split('^').map(t => t.trim().toLowerCase()).filter(Boolean)
            ).filter(group => group.length > 0); // Remove empty groups
            console.log(`[fetchBrands] Applying tag filters (OR groups of AND tags):`, tagFilterGroups);
        } else {
            // Default behavior if no tags specified: require 'prod' tag
            tagFilterGroups = [['prod']];
            console.log(`[fetchBrands] No tags specified, defaulting to requiring 'prod' tag.`);
        }

        // Validate brand file index constant
        const brandIndex = (typeof __BRAND_FILE_INDEX__ !== 'undefined' && Array.isArray(__BRAND_FILE_INDEX__)) ? __BRAND_FILE_INDEX__ : [];
        if (brandIndex.length === 0) {
            throw new Error('No brand index entries provided');
        }

        // Filter brand files based on the parsed tag groups
        const filesToLoad = brandIndex.filter(entry => {
            if (tagFilterGroups.length === 0) {
                // If tagParam was present but resulted in no valid groups, show nothing.
                // If tagParam was absent, the default [[prod]] was used, so this case shouldn't be hit unless default changes.
                return false;
            }
            const entryTagsLower = entry.tags.map(t => t.toLowerCase());
            // Check if *any* OR group is satisfied
            return tagFilterGroups.some(andGroup =>
                // Check if *all* tags within the AND group are present in the entry's tags
                andGroup.every(requiredTag => entryTagsLower.includes(requiredTag))
            );
        });
        if (filesToLoad.length === 0) {
            throw new Error(`No brand files matched desired tags: ${tagFilterGroups.map(group => group.join(', ')).join(', ')}`);
        }

        console.log(`[fetchBrands] Loading ${filesToLoad.length} brand files...`);

        // Fetch all brand files in parallel
        const filePromises = filesToLoad.map(async entry => {
            try {
                const response = await fetch(entry.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const json = await response.json();
                if (!json || !Array.isArray(json.items)) throw new Error('Invalid structure: items array missing');
                // Annotate each item with vendor name for later vendor config lookup
                json.items.forEach((itm: any) => (itm._vendorConfig = entry.vendorConfig));
                return json.items;
            } catch (e: any) {
                console.error(`[fetchBrands] Failed to load brand file '${entry.url}':`, e);
                return [];
            }
        });

        const brandItemsArrays = await Promise.all(filePromises);
        console.log(`[fetchBrands] Loaded ${brandItemsArrays.length} brand files.`, brandItemsArrays);
        const aggregatedItems: any[] = ([] as any[]).concat(...brandItemsArrays);

        if (aggregatedItems.length === 0) {
            throw new Error('No organization records loaded from brand files.');
        }

        console.log(`[fetchBrands] Loaded ${aggregatedItems.length} organization records from brand files.`);

        allBrandItems = aggregatedItems;
        currentFilteredItems = collapseBrandItems(allBrandItems, aggregatedItems, new Map());
        // Alphabetical order by brand displayName on initial load
        currentFilteredItems.sort((a, b) => safeLower(a.displayName).localeCompare(safeLower(b.displayName)));

        brandInitialLoadingMessage.style.display = 'none';
        brandResultsContainer.style.display = 'grid';
        brandSearchInput.disabled = false;

        currentPage = 1;
        renderCurrentPage();

        // Autofocus search input
        brandSearchInput.focus();

        // Attach listeners
        brandSearchInput.addEventListener('input', debouncedBrandSearchHandler);
        if (brandModalCancel) brandModalCancel.addEventListener('click', hideBrandModal);
        if (brandModalConnect) brandModalConnect.addEventListener('click', handleBrandConnect);
        if (brandModalBackdrop) brandModalBackdrop.addEventListener('click', (event) => { if (event.target === brandModalBackdrop) hideBrandModal(); });
        if (brandPrevBtn) brandPrevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; pendingPageFocus = true; renderCurrentPage(); } });
        if (brandNextBtn) brandNextBtn.addEventListener('click', () => { const totalPages = Math.ceil(currentFilteredItems.length / ITEMS_PER_PAGE); if (currentPage < totalPages) { currentPage++; pendingPageFocus = true; renderCurrentPage(); } });

    } catch (error: any) {
        console.error('[fetchBrands] Error:', error);
        if (brandInitialLoadingMessage) {
            setResultStatus(`The organization directory could not be loaded: ${error.message} Reload the page to try again.`);
        }
        brandResultsContainer.style.display = 'none';
        brandSearchInput.disabled = true;

    } finally {
        brandSearchSpinner.style.display = 'none';
    }
}

// --- Main Application Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Get All DOM References Once ---
    brandSelectorContainer = document.getElementById('brand-selector-container');
    brandSearchInput = document.getElementById('brand-search-input') as HTMLInputElement | null;
    brandSearchSpinner = document.getElementById('brand-search-spinner');
    brandResultsContainer = document.getElementById('brand-results-container');
    brandModalBackdrop = document.getElementById('brand-modal-backdrop');
    brandModal = document.getElementById('brand-modal');
    brandModalTitle = document.getElementById('brand-modal-title');
    brandModalDetails = document.getElementById('brand-modal-details');
    brandModalCancel = document.getElementById('brand-modal-cancel') as HTMLButtonElement | null;
    brandModalConnect = document.getElementById('brand-modal-connect') as HTMLButtonElement | null;
    brandInitialLoadingMessage = document.getElementById('brand-initial-loading-message');
    brandPaginationControls = document.getElementById('brand-pagination-controls');
    brandPrevBtn = document.getElementById('brand-prev-btn') as HTMLButtonElement | null;
    brandNextBtn = document.getElementById('brand-next-btn') as HTMLButtonElement | null;
    brandPageInfo = document.getElementById('brand-page-info');

    // Registered here, not in the brand-load success path: a directory load failure must
    // not leave Escape dead in a dialog the user can still open.
    document.addEventListener('keydown', onModalKeydown);
    // REMOVED fetching references for deleted form elements
    // formContainer = document.getElementById('form-container');
    // ehrForm = document.getElementById('ehr-form') as HTMLFormElement | null;
    // ehrBaseUrlInput = document.getElementById('ehr_base_url') as HTMLInputElement | null;
    // ehrClientIdInput = document.getElementById('ehr_client_id') as HTMLInputElement | null;
    // ehrScopesInput = document.getElementById('ehr_scopes') as HTMLInputElement | null;
    // ehrRedirectUriInput = document.getElementById('redirect_uri') as HTMLInputElement | null;
    statusContainer = document.getElementById('status-container');
    statusMessageElement = document.getElementById('status-message');
    progressContainer = document.getElementById('progress-container');
    progressBar = document.getElementById('fetch-progress') as HTMLProgressElement | null;
    progressText = document.getElementById('progress-text');
    // ---------------------------------

    // --- NEW: Get Download Button Reference ---
    downloadDataBtn = document.getElementById('download-data-btn') as HTMLButtonElement | null;
    // ------------------------------------

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Define the default redirect URI (this page)
    const defaultRedirectUri = window.location.origin + window.location.pathname;

    if (error) {
        // Handle error response from EHR authorization
        try { history.replaceState({}, document.title, window.location.pathname); } catch (e) {}
        showStatusContainer(true);
        updateStatus(`Authorization Error: ${error} - ${errorDescription || 'No description provided.'}`, true);
        sessionStorage.removeItem(AUTH_STORAGE_KEY); // Clean up state on error
        return;
    }

    if (code && state) {
        // The authorization code and state are captured above; drop them from the visible
        // URL before anything else runs. Left in place they persist in browser history,
        // in any link the user copies or screenshot they take, and in edge/provider request
        // logs. The code is single-use and short-lived, but it is a bearer credential for
        // this patient's record until it is exchanged.
        //
        // replaceState rather than pushState: a Back press must not return to a URL that
        // re-triggers the exchange with an already-spent code.
        try {
            history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.warn('Could not strip the authorization code from the URL:', e);
        }

        // --- Phase 2: Handle Redirect ---
        (async () => { // Wrap redirect handling in an async IIFE
            showStatusContainer(true);
            updateStatus('Received authorization code. Validating...');
            console.log('Detected redirect from EHR.');
            console.log(`Code: ${code.substring(0, 10)}...`, `State: ${state}`);

            // *** HIDE BRAND SELECTOR UI IMMEDIATELY ON REDIRECT ***
            if (brandSelectorContainer) brandSelectorContainer.style.display = 'none';
            showProgressContainer(false); // Ensure progress is hidden initially in this phase too
            showConfirmationContainer(false); // Ensure confirmation is hidden initially too

            const storedStateString = sessionStorage.getItem(AUTH_STORAGE_KEY);
            if (!storedStateString) {
                updateStatus('Error: Auth state missing from storage. Please start over.', true);
                return;
            }

            let storedState: StoredAuthState;
            try {
                storedState = JSON.parse(storedStateString);
            } catch (e) {
                updateStatus('Error: Could not parse stored auth state.', true);
                sessionStorage.removeItem(AUTH_STORAGE_KEY);
                return;
            }

            // Validate state
            if (state !== storedState.state) {
                updateStatus('Error: State parameter mismatch. Potential CSRF attack.', true);
                sessionStorage.removeItem(AUTH_STORAGE_KEY);
                return;
            }

            updateStatus('State validated. Exchanging code for token...');

            const { tokenEndpoint, codeVerifier, clientId, redirectUri, fhirBaseUrl } = storedState;
            console.log(`Using redirect_uri for token exchange: ${redirectUri}`);

            try {
                // 1. Exchange code for token
                const tokenParams = new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri, // Must match the URI used in the initial auth request
                    client_id: clientId,
                    code_verifier: codeVerifier,
                });

                const tokenResponse = await fetch(tokenEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json' // Explicitly accept JSON
                    },
                    body: tokenParams.toString(),
                });

                const tokenData = await tokenResponse.json(); // Attempt to parse JSON regardless of status

                if (!tokenResponse.ok) {
                    const errorDetails = tokenData.error_description || tokenData.error || JSON.stringify(tokenData);
                    throw new Error(`Token exchange failed (${tokenResponse.status}): ${errorDetails}`);
                }

                const accessToken = tokenData.access_token;
                const patientId = tokenData.patient;
                const grantedScopes = tokenData.scope;

                if (!accessToken || !patientId) {
                    throw new Error('Token response missing required access_token or patient ID.');
                }

                updateStatus('Token received successfully.');
                console.log(`Access Token: ${accessToken.substring(0, 8)}...`);
                console.log(`Patient ID: ${patientId}`);
                console.log(`Granted Scopes: ${grantedScopes || 'N/A'}`);

                // Clear sensitive state now that exchange is successful
                sessionStorage.removeItem(AUTH_STORAGE_KEY);
                console.log('Cleared auth state from sessionStorage.');

                // 2. Fetch FHIR data
                updateStatus('Fetching EHR data (this may take a while)...');
                showProgressContainer(true); // Show progress bar early
                updateProgress(0, 0, 'Initiating fetch...'); // Initial progress message

                // *** Store fetched data in a variable accessible later ***
                let fetchedClientFullEhrObject: any | null = null; // Renamed for clarity
                try {
                    fetchedClientFullEhrObject = await fetchAllEhrDataClientSideParallel(
                        accessToken,
                        fhirBaseUrl,
                        patientId,
                        updateProgress // Pass the progress update function
                    );
                } catch (fetchError: any) {
                    // Handle fetch error specifically
                    updateStatus(`Error fetching EHR data: ${fetchError.message}`, true);
                    console.error("Error during fetchAllEhrDataClientSideParallel:", fetchError);
                     // Hide progress bar on fetch error
                    showProgressContainer(false);
                    // Clear sensitive state if not already cleared
                    sessionStorage.removeItem(AUTH_STORAGE_KEY);
                    return; // Stop execution here
                }

                console.log("Returned from fetchAllEhrDataClientSideParallel. EHR data:", fetchedClientFullEhrObject);

                // Hide progress bar on successful completion
                showProgressContainer(false);

                // 3. Log the result
                console.log("--- ClientFullEHR Object ---");
                console.log(fetchedClientFullEhrObject);
                console.log("----------------------------");

                // 4. Calculate Totals & Prepare Initial Final Status
                let totalResources = 0;
                let resourceTypeCount = 0;
                if (fetchedClientFullEhrObject?.fhir) {
                    resourceTypeCount = Object.keys(fetchedClientFullEhrObject.fhir).length;
                    for (const resourceType in fetchedClientFullEhrObject.fhir) {
                        if (Object.prototype.hasOwnProperty.call(fetchedClientFullEhrObject.fhir, resourceType) && Array.isArray(fetchedClientFullEhrObject.fhir[resourceType])) {
                            totalResources += fetchedClientFullEhrObject.fhir[resourceType].length;
                        }
                    }
                }
                const attachmentCount = fetchedClientFullEhrObject?.attachments?.length || 0;

                let finalStatus = `Data fetched successfully! ${resourceTypeCount} resource types, ${totalResources} total resources, and ${attachmentCount} attachments retrieved.`;
                updateStatus(finalStatus); // Update status initially

                // --- 5. Offer the download ---
                //
                // The retrieved record is handed to the user and nowhere else. There is
                // deliberately no delivery mechanism here: an earlier version could POST the
                // record to a configured endpoint, or postMessage it to an arbitrary origin
                // named in the URL hash. The latter never checked that origin against the
                // actual opener, so any site could open this page with its own origin in the
                // hash and receive a complete medical record, using this app's registered
                // client id to obtain it. See docs/health.circlejtp.me-plan.md 9.4.
                finalStatus += ` Your record is assembled in this browser and has not been sent anywhere.`;
                updateStatus(finalStatus);
                if (downloadDataBtn) {
                    downloadDataBtn.style.display = 'inline-flex';
                    downloadDataBtn.onclick = () => {
                        // Dated, so two downloads do not collide and the user can tell
                        // later which is which.
                        const stamp = new Date().toISOString().slice(0, 10);
                        triggerJsonDownload(fetchedClientFullEhrObject, `health-record-${stamp}.json`);
                        // Deliberately left enabled. The old code disabled the button with
                        // no explanation, which is a dead end if the save dialog was
                        // dismissed; and a second copy is a reasonable thing to want.
                        updateStatus(`Saved to your device as health-record-${stamp}.json. Protect this file \u2014 HIPAA does not cover it once it is yours.`);
                    };
                    // The user has been waiting through a long fetch; nothing otherwise
                    // tells a screen reader that it is over.
                    window.setTimeout(() => statusMessageElement?.focus(), 0);
                }

            } catch (err: any) {
                // Catch errors during token exchange or *outer* fetch block (like JSON parsing of token)
                updateStatus(`Error during authorization or data processing: ${err.message}`, true);
                console.error("Unhandled error in redirect handler:", err);
                // Hide progress/confirmation, show status
                showProgressContainer(false);
                showConfirmationContainer(false);
                showStatusContainer(true);
                if (downloadDataBtn) downloadDataBtn.style.display = 'none'; // Ensure download not shown on these errors
                // Clear state even on error during these steps
                sessionStorage.removeItem(AUTH_STORAGE_KEY);
            }
        })(); // Immediately invoke the async function

    } else {
        // --- Phase 1: Initial Load - Setup Brand Selector ---
        console.log('Initial page load. Setting up brand selector.');
        // Ensure correct initial visibility (includes pagination)
        if (brandSelectorContainer) brandSelectorContainer.style.display = 'block';
        if (brandPaginationControls) brandPaginationControls.style.display = 'none'; // Ensure hidden initially
        if (statusContainer) statusContainer.style.display = 'none';
        showProgressContainer(false); // Ensure progress is hidden

        // Fetch brand data and initialize the selector UI
        fetchBrandsAndInitialize().then(() => {
            // The delivery-target hashes (#deliver-to: and #deliver-to-opener:) were
            // removed; see the note at the download step. Any such hash is ignored.
        })


        // Ensure confirmation UI is hidden on initial load
        showConfirmationContainer(false);
        // Ensure download button is hidden on initial load
        if (downloadDataBtn) downloadDataBtn.style.display = 'none';

    }
});

// --- NEW: Helper Function to Trigger JSON Download ---
function triggerJsonDownload(data: any, filename: string) {
    if (!data) {
        console.error("Download triggered but data is null.");
        alert("Error: No data available to download.");
        return;
    }
    try {
        const jsonString = JSON.stringify(data, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a); // Required for Firefox
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up
        console.log(`Successfully triggered download of ${filename}`);
    } catch (error: any) {
        console.error(`Error creating or triggering download for ${filename}:`, error);
        alert(`Failed to initiate download: ${error.message}`);
    }
}
// --- END NEW HELPER FUNCTION --- 
