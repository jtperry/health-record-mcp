# health-record-mcp

Tools for assembling a **personal longitudinal medical record** from more than one health
system, and serving it to an LLM over the Model Context Protocol.

A record is retrieved in the browser over SMART on FHIR — or imported from a C-CDA export where
a provider offers no usable FHIR API — stored in local SQLite keyed by which health system it
came from, and queried through MCP tools. The record stays on your machine: no server we run
ever receives it.

Hosted at **[health.circlejtp.me](https://health.circlejtp.me)**, where the connect flow is not
yet open to the public — see [below](#1-standalone-smart-on-fhir-web-client).

## Built on jmandel/health-record-mcp

This is a fork of **[jmandel/health-record-mcp](https://github.com/jmandel/health-record-mcp)**
by [Josh Mandel](https://github.com/jmandel), and it exists because that project already solved
the hard part: a browser-only SMART on FHIR client that authenticates against a real health
system, walks the FHIR graph, pulls attachments, and hands back a complete record without a
server ever touching the data. The retriever, the MCP tool design (`grep_record`,
`query_record`, `eval_record`), the SQLite representation, and the privacy architecture that
makes all of it defensible are Josh's work. Go look at the upstream project.

Josh's walkthrough of the original project: <https://youtu.be/K0t6MRyIqZU>

**This fork is not a drop-in replacement for upstream, and it is not maintained by Josh.** File
issues about anything here against *this* repository, not upstream.

## Quick start

```bash
# Build a database from a record downloaded via a hosted web client.
bun run src/cli.ts --import-json ~/health-records/ehr-data.json \
  --db ~/health-records/my_record.sqlite --source MultiCare

# Add a second health system later.
bun run src/cli.ts --db ~/health-records/my_record.sqlite --create-db \
  --force-concat --source "Other Health System"

# Serve the combined record over MCP.
bun run src/cli.ts --db ~/health-records/my_record.sqlite
```

Back up the database before any run that writes to an existing file: `--force-concat` mutates
it in place and `--force-overwrite` deletes it outright.

## You have the file. Now what?

The download is a single JSON file — every resource your health system returned, plus the
text of any notes and documents attached to them. Two things to do with it, in order.

### 1. Protect it, because nothing else will

**HIPAA stopped applying the moment it reached your disk.** It governs your health system,
not you and not this software. That file is likely the most sensitive document you own, and
it cannot be un-disclosed: unlike a password, you cannot rotate a diagnosis.

- Turn on **full-disk encryption** — FileVault on macOS, BitLocker on Windows, LUKS on Linux.
  Without it, anyone holding the device holds the record.
- **Move it out of `~/Downloads`.** Downloads, Desktop and Documents are synced to iCloud,
  OneDrive, Dropbox or Google Drive on most machines by default, often without the owner
  realising. Check before you assume otherwise.
- **Tighten the permissions:** `chmod 600 health-record-*.json` and `chmod 700` its directory.
- **Think hard before pasting it into anything**, an AI assistant included. Whatever you paste
  may be retained, reviewed by humans, and used for training.
- **Delete it when you are done**, and empty the trash.
- On a shared or public computer, do not download it at all.

### 2. Load it into a database and ask questions

```bash
bun run src/cli.ts --import-json ~/health-records/health-record-2026-09-01.json \
  --db ~/health-records/my_record.sqlite --source "Your Health System"
```

`--source` is a label of your choosing and it matters: it is part of the primary key, so it is
what lets a second health system's data live alongside the first without one overwriting the
other. Use the same string when you re-import from the same provider.

Keep the database somewhere deliberate, not in this repository — `data/`, `*.sqlite` and
`*.pem` are gitignored as a safety net, but the safer habit is to keep records outside the
working tree entirely.

Then serve it to an LLM over MCP:

```bash
bun run src/cli.ts --db ~/health-records/my_record.sqlite
```

That exposes three tools over stdio — `grep_record` for text and regex search across
resources *and* attachment text, `query_record` for read-only SQL against the FHIR tables, and
`eval_record` for JavaScript over the whole record. Point any MCP client at it. The record
never leaves your machine.

If a provider gives you a C-CDA export instead of a working FHIR API — common with
athenahealth-backed practices — `--import-ccda <file.xml|file.zip> --source "Name"` puts it in
the same database alongside everything else.

**Re-importing is safe.** Resources upsert and attachments are unique on
`(source, resource_type, resource_id, path, content_type)`, so pulling the same provider again
updates rather than duplicating.

## What this fork changes

**A record that spans health systems.** Resources and attachments carry a `source`, and `source`
is part of the primary key on `fhir_resources` and `fhir_attachments`. Two health systems can
issue the same `resource_id` for different resources, so keying without it silently loses data.
The schema migrates in place, and `--backfill-source` labels a database built before the column
existed. Re-ingesting a provider is idempotent: attachments are unique on
`(resource_type, resource_id, path, content_type)` and inserted with `OR IGNORE`, where upstream
used a bare `INSERT` that stored every note again on each pull.

**C-CDA ingestion (`src/ccdaToEhr.ts`).** Not every provider offers a usable FHIR API. Some —
athenahealth-backed practices in particular — export C-CDA XML instead, so this converts a C-CDA
document into the same `ClientFullEHR` shape the FHIR path produces, and it lands in the same
database alongside everything else.

**Import without registering an app (`--import-json`).** Load a downloaded record straight into
SQLite without re-running the SMART flow, so you can authenticate once through a hosted client
and then iterate locally.

**A deployable website (`site/`).** A Cloudflare Worker serving a landing page and the retriever,
which is a thing upstream does not ship. See [`site/README.md`](site/README.md).

**Retriever fixes.** FHIR URLs were built by joining a base that usually already ends in `/` with
another `/`; Epic tolerated the doubled slash on most paths but rejected it on some, which cost
real resources. Expected crawl outcomes — a 403 for a resource outside the granted scope — are
reported as skips rather than errors. Patient-scoped searches for `Practitioner` and
`Organization` were dropped, since neither defines a `patient` search parameter in FHIR R4.

**PHI hygiene.** `data/`, `*.sqlite` and `*.pem` are gitignored and the docs steer records
outside the working tree. A safety net, not the primary protection.

## What was removed from the fork, and why

So that nobody has to guess which parts of this tree are live, everything not used here has been
deleted rather than left to rot. All of it remains in
[upstream](https://github.com/jmandel/health-record-mcp) and in this repository's git history.

| Removed | Why |
|---|---|
| `a4a/` | Josh's agent-to-agent subproject. Nothing here imports it. Every test in this repository lived here and none of them ran. |
| `intrabrowser/`, `src/IntraBrowserTransport.ts`, `src/tools-browser-entry.ts` | In-browser MCP transport, along with the `build:ehr-tool` script and the GitHub Pages workflow that packaged it. This fork deploys to Cloudflare instead. |
| `static/brands/epic.json`, `user-access-brands-endpoint-bundle-epic.json` | 92 MB of brand directory snapshots from 2025. Regenerated weekly into R2 now; `site/public/brands/epic-sample.json` covers local work. |
| `config.{jmandel,claude,epicprod,epicsandbox,epic-gh-pages,stdio,smartsandbox}.json` | Upstream's own deployment configs, carrying its client ids and host names. `config.circlejtp.json` is this fork's; `sample-config.json` remains as the template. |
| `Dockerfile` | Its entrypoint was `index.ts`, which does not exist in this repository or upstream. |
| `src/utils.ts`, `src/__tests__/dataFlow.test.ts`, `opener.html`, `static/ehretriever_caller.html`, `static/brands/index.html` | Unreferenced. The test imported a module that does not exist. |

Known broken and left alone: `src/sse.ts` — the `start` script — imports `./streamable-http.ts`,
which is absent here and upstream. `start:http` works. Fixing it is out of scope for this fork.

## If you fork or host this

Please do — that is the point of publishing it. Two conditions, and they are about identity
rather than code.

**Remove every reference to JT Perry and to `health.circlejtp.me`, and supply your own.** A
deployment of this software must name *its own* operator, with *its own* contact details, in its
public documentation, terms, and any app registration. Do not represent, imply, or leave standing
any suggestion that a deployment you run is operated by, endorsed by, or affiliated with the
maintainer of this repository.

**Your deployment is yours.** If you register this application with Epic or any other health
system, that registration, the attestations in it, and everything that follows from it are
yours. The maintainer of this repository is not a party to it and is not responsible for it. The same goes for anything
that happens to records your deployment handles.

This is a statement of intent, not legal advice, and it is written by a non-lawyer. The MIT
licence in [`LICENSE.txt`](LICENSE.txt) governs; nothing here narrows the rights it grants.

## The Core Idea

The system works in three main stages:

1.  **SMART on FHIR Client (Implemented within this project):** Connects securely to an EHR using the standard SMART App Launch framework. It extracts a wide range of patient information, including both structured data (like conditions, medications, labs) and unstructured clinical notes or attachments.
2.  **MCP Server (This Project):** Takes the extracted EHR data and makes it available through a set of powerful tools accessible via the Model Context Protocol. These tools allow external systems (like AI models) to query and analyze the data without needing direct access to the EHR itself.
3.  **AI / LLM Interface (External Consumer):** An AI agent or Large Language Model connects to the MCP Server and uses the provided tools to "ask questions" about the patient's record, perform searches, or run custom analyses.

## Available Tools

The MCP Server offers several tools for interacting with the loaded EHR data:

*   `grep_record`: Performs text or regular expression searches across *all* parts of the fetched record (structured FHIR data + text from notes/attachments). Ideal for finding keywords or specific mentions (e.g., "diabetes", "aspirin").
*   `query_record`: Executes read-only SQL `SELECT` queries directly against the structured FHIR data. Useful for precise lookups based on known FHIR resource structures (e.g., finding specific lab results by LOINC code).
*   `eval_record`: Executes custom JavaScript code directly on the fetched data (FHIR resources + attachments). Offers maximum flexibility for complex calculations, combining data from multiple sources, or custom formatting.

This setup allows AI tools to leverage comprehensive EHR data through a standardized and secure interface.

*(Developer setup and usage details can be found within the codebase and specific module documentation.)*

---

## Components & Usage

This project offers different ways to fetch EHR data and expose it via MCP tools:

### 1. Standalone SMART on FHIR Web Client

This project includes a self-contained web application that allows users to connect to their EHR via SMART on FHIR and fetch their data.

*   **Our hosted version:** [`https://health.circlejtp.me`](https://health.circlejtp.me)

    This is the deployment this repository builds, and it differs from upstream's. It leads with
    a warning about what you are taking on by downloading your own record, gates the connect
    button behind acknowledging it, strives to meet WCAG 2.2 AA, and refreshes the Epic brand
    directory weekly so providers that move endpoints do not silently vanish from the list.

    **The connect flow is not open to the public yet.** The Epic app registration has not been
    approved for production, and until it is, the site says so plainly rather than offering a
    button that cannot work. There is no timeline for opening it.

    Upstream also publishes a hosted client at
    [`https://mcp.fhir.me/ehr-connect`](https://mcp.fhir.me/ehr-connect), a separate deployment
    run by Josh, not by us. Both are pure browser clients, but they are no longer the same
    application — see the note on delivery below.
*   **Getting your data out:** with the fetch complete, the client shows a **Download** button
    that saves the `ClientFullEHR` object as JSON to your device. You can then load it into a
    local database with `--import-json` (see section 2). That is the only way data leaves the
    page.

    **Removed: delivery to another origin.** Upstream can also POST the record to a configured
    endpoint, or `postMessage` it to an origin named in the URL hash
    (`#deliver-to-opener:$origin`). Both are gone from this fork. The postMessage path never
    checked the named origin against the actual opener, so any website could open the retriever
    with its own origin in the hash and receive a complete medical record — obtained under this
    application's registered client id, with the patient seeing only their health system's
    normal consent screen. That is a data flow this deployment does not describe and does not
    want. Downloading a file is the whole feature.

*   **Privacy note:** this page is a pure browser client (SMART public client + PKCE). It exchanges
    the auth code directly with your health system's token endpoint and fetches FHIR resources
    straight from the EHR. In the download flow above there is no POST anywhere — the site
    serves the JavaScript and never receives your record. That is a property of the architecture,
    not a promise: there is no endpoint that could receive it.
*   **Filtering Brands (`?brandTags`):** You can filter the list of EHR providers shown on the connection page by adding the `brandTags` query parameter to the URL. Provide a comma-separated list of tags. Only brands matching *all* provided tags (from their configuration in `brandFiles`) will be displayed.
    It supports both OR (comma-separated) and AND (caret `^` separated) logic, with AND taking precedence.
    *   `?brandTags=epic,sandbox`: Shows brands tagged with `epic` OR `sandbox`.
    *   `?brandTags=epic^dev`: Shows brands tagged with both `epic` AND `dev`.
    *   `?brandTags=epic^dev,sandbox^prod`: Shows brands tagged with (`epic` AND `dev`) OR (`sandbox` AND `prod`).
    *   If the parameter is omitted, it defaults to showing brands tagged with `prod`.
    *   Example: `.../ehr-connect?brandTags=hospital^us`: Shows brands tagged with `hospital` AND `us`.
*   **How it Works:** When opened, this page prompts the user to select their EHR provider. It then initiates the standard SMART App Launch flow, redirecting the user to their EHR's login page. After successful authentication and authorization, the client fetches a comprehensive set of FHIR resources (Patient, Conditions, Observations, Medications, Documents, etc.) and attempts to extract plaintext from any associated attachments (like PDFs, RTF, HTML found in `DocumentReference`).
*   **Data Output (`ClientFullEHR`):** Once fetching is complete, the client gathers all the data into a `ClientFullEHR` JSON object. This object contains:
    *   `fhir`: A dictionary where keys are FHIR resource types (e.g., "Patient") and values are arrays of the corresponding FHIR resources.
    *   `attachments`: An array of processed attachment objects, each including metadata (source resource, path, content type) and the content itself (`contentBase64` for raw data, `contentPlaintext` for extracted text).
*   **Data Delivery:** none. The `ClientFullEHR` object is offered to the user as a download and goes nowhere else. Upstream's `#deliver-to:` and `#deliver-to-opener:` hashes are not implemented in this fork; such hashes are ignored.

### 2. Local MCP Server via Stdio (`src/cli.ts`)

This mode is ideal for running the MCP server locally, often used with tools like Cursor or other command-line AI clients.

*   **Importing a downloaded JSON (`--import-json`):** If you already have a `ClientFullEHR` JSON
    file — e.g. downloaded from the hosted client in section 1 — you can load it straight into a
    database without re-running the SMART flow. This lets you authenticate once against the hosted
    client (using *its* registered client ID, so you don't need to register an app with your health
    system) and then iterate locally against the saved file.
    ```bash
    bun run src/cli.ts \
      --import-json ~/health-records/ehr-data.json \
      --db ~/health-records/my_record.sqlite
    ```
    If the target database already exists the command refuses by default; pass `--force-overwrite`
    to replace it or `--force-concat` to add to it. Then start the server with
    `bun run src/cli.ts --db ~/health-records/my_record.sqlite` as usual.

    **Keep records outside the repo.** These files are real medical records. Prefer a location such
    as `~/health-records/` (`chmod 700`) rather than anywhere in the working tree; `data/` and
    `*.sqlite` are gitignored as a safety net, not as the primary protection.

*   **Combining several health systems (`--source`):** One database can hold records from more than
    one provider. Both `--import-json` and `--create-db` accept `--source <name>`, which labels every
    ingested row with the health system it came from, stored in the `source` column of
    `fhir_resources` and `fhir_attachments` and queryable from the `query_record` tool.

    Refreshing a provider you already have is safe to repeat. Resources upsert on
    `(resource_type, resource_id)`, and attachments are unique on
    `(resource_type, resource_id, path, content_type)`, so re-ingesting the same pull updates rows
    rather than duplicating them.

    ```bash
    # Refresh an existing provider, labelling the records already on file (see below).
    bun run src/cli.ts --db ~/health-records/my_record.sqlite --create-db \
      --force-concat --source MultiCare --backfill-source

    # Add a second health system to the same database.
    bun run src/cli.ts --db ~/health-records/my_record.sqlite --create-db \
      --force-concat --source "Other Health System"
    ```

    `--backfill-source` stamps the `--source` value onto every row that has **no** source yet. It is
    meant for a database built before the `source` column existed, where the existing records are
    known to come from one provider. It only touches unlabelled rows, so it will never relabel data
    from another health system — but for that reason, pass it only alongside the provider the
    unlabelled records actually came from.

    Note that this records *provenance*, not clinical de-duplication. If two health systems both
    hold the same lab result (common where records are shared between systems), they arrive as two
    resources with different IDs. The `source` column lets you filter to one system where a query
    would otherwise double-count.

*   **Two-Step Process:**
    1.  **Fetch Data to Database:** First, run the command-line interface with the `--create-db` and `--db` flags. This starts a temporary web server and uses the same SMART on FHIR web client logic described above to fetch data. It saves the `ClientFullEHR` data into a local SQLite database file.
        ```bash
        # Example: Fetch data and save to data/my_record.sqlite
        bun run src/cli.ts --create-db --db ./data/my_record.sqlite
        ```
        Follow the prompts (opening a link in your browser) to connect to your EHR.
    2.  **Run MCP Server:** Once the database file is created, run the CLI again, pointing only to the database file. This loads the data into memory and starts the MCP server, listening for commands on standard input/output.
        ```bash
        # Example: Start the MCP server using the saved data
        bun run src/cli.ts --db ./data/my_record.sqlite
        ```
    *   **Configuration (`config.*.json`):** This process relies on a configuration file (e.g., `config.circlejtp.json`) which defines available EHR brands/endpoints in a `brandFiles` array. Each entry in this array specifies the brand's details, including:
        *   `url`: Path/URL to the brand definition file (like `static/brands/epic-sandbox.json`).
        *   `tags`: An array of strings (e.g., `["epic", "sandbox"]`) used for categorization or filtering.
        *   `vendorConfig`: Contains SMART on FHIR client details (`clientId`, `scopes`).
*   **Client Configuration (e.g., Cursor):** Configure your MCP client to execute this command. **Crucially, use absolute paths** for both `src/cli.ts` and the database file.
    ```json
    {
      "mcpServers": {
        "local-ehr": {
          "name": "Local EHR Search",
          "command": "bun", // Or the absolute path to bun
          "args": [
              "/home/user/projects/smart-mcp/src/cli.ts", // Absolute path to cli.ts
              "--db",
              "/home/user/projects/smart-mcp/data/my_record.sqlite" // Absolute path to DB file
            ]
        }
      }
    }
    ```

### 3. Full MCP Server via SSE (`src/sse.ts`)

This mode runs a persistent server suitable for scenarios where multiple clients might connect over the network. It uses Server-Sent Events (SSE) for the MCP communication channel.

*   **Authentication:** Client authentication relies on OAuth 2.1, as specified by the Model Context Protocol. The server provides standard endpoints (`/authorize`, `/token`, `/register`, etc.).
*   **Data Fetch:** When a client initiates an OAuth connection, the server handles the SMART on FHIR flow *itself*, fetches the `ClientFullEHR` data *during* the authorization process, and keeps it in memory (or a persisted session) for the duration of the client's connection.
*   **Status:** While functional, the MCP specification for OAuth 2.1 client interaction is still evolving. Client support for this authentication method is **extremely limited** at present, making it difficult to test this mode with standard clients outside of specialized developer or debugging tools. This SSE mode should be considered **experimental**.
