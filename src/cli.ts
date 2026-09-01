import { Command } from 'commander';
import { Database } from 'bun:sqlite';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'bun'; // Needed for running build

// --- Imports for --create-db mode ---
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import https from 'https'; // Import https
import cors from 'cors';
// --- End imports for --create-db ---

// Corrected MCP SDK imports
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Implementation } from "@modelcontextprotocol/sdk/types.js"; // Import common types

// Corrected local module imports (assuming cli.ts is in src/)
import { ClientFullEHR } from '../clientTypes.js'; // Assumes clientTypes.ts is in project root
import { sqliteToEhr, ehrToSqlite, ensureSchema } from './dbUtils.js';
import { ccdaToEhr } from './ccdaToEhr.js'; // Assumes dbUtils.ts is in src/
import { AppConfig, loadConfig } from './config.ts'; // Import config loading and AppConfig type

// --- Tool Schemas & Logic (Imported) ---
import {
    GrepRecordInputSchema, QueryRecordInputSchema, EvalRecordInputSchema, grepRecordLogic,
    queryRecordLogic,
    evalRecordLogic,
    registerEhrTools
} from './tools.js'; // Assumes tools.ts is in src/

// --- Server Info ---
const SERVER_INFO: Implementation = { name: "EHR-Search-MCP-CLI", version: "0.1.0" };

// --- Function for --create-db mode ---

async function startEhrFetchServer(
    dbPath: string,
    serverConfig: AppConfig['server'], // Use the server part of AppConfig
    source: string | null // Label recording which health system this pull came from
): Promise<void> {
    return new Promise(async (resolve, reject) => { // Make the outer function async for cert loading
        const app = express();
        app.use(cors());
        app.use(express.json({ limit: '50mb' })); // For receiving EHR data

        let server: http.Server | https.Server | null = null; // Union type
        const protocol = serverConfig.https.enabled ? 'https' : 'http';
        const port = serverConfig.port; // Use port from config
        const host = serverConfig.host; // Use host from config
        const baseUrl = serverConfig.baseUrl || `${protocol}://${host}:${port}`; // Construct base URL

        const shutdown = (error?: Error) => {
            if (server) {
                server.close((closeErr) => {
                    if (closeErr) {
                        console.error(`[Server] Error closing server: ${closeErr.message}`);
                    } else {
                        console.error('[Server] Web server stopped.');
                    }
                    // Resolve or reject the main promise
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
                // Force close after timeout
                setTimeout(() => {
                    console.error('[Server] Forcing shutdown after timeout.');
                     if (error) reject(error); else resolve(); // Might resolve/reject twice, but ensures exit
                }, 5000);
            } else {
                 if (error) reject(error); else resolve();
            }
        };

        // 1. Serve static files (Retriever HTML/JS)
        // Assuming cli.ts is in src/, static is one level up
        const staticPath = path.resolve(__dirname, '..', 'static');
        console.error(`[Server] Serving static files from: ${staticPath}`);
        // Serve static files relative to the base URL
        app.use(express.static(staticPath));

        // 2. Initial endpoint to start the flow
        app.get('/start', (req, res) => {
            console.error('[Server] /start requested. Redirecting to retriever UI...');
            // Construct URL relative to the dynamic base URL
            const retrieverUrl = `/ehretriever.html#deliver-to:cli-callback`;
            res.redirect(retrieverUrl);
        });

        // 3. Placeholder Redirect URI for SMART flow within retriever
        app.get('/ehr-callback', (req, res) => {
            console.error('[Server] /ehr-callback hit (intermediate step). Redirecting back to retriever base.');
            // Construct URL relative to the dynamic base URL
            const originalUrl = req.originalUrl;
            const queryIndex = originalUrl.indexOf('?');
            const queryString = (queryIndex !== -1) ? originalUrl.substring(queryIndex) : '';
            // Redirect back to the retriever's root path
            res.redirect(`/ehretriever.html${queryString}`);
        });

        // 4. Endpoint to receive final EHR data FROM the retriever
        // Ensure this path matches the 'cli-callback' postUrl built into the retriever
        app.post('/ehr-data', async (req: Request, res: Response) => {
            console.error('[Server] /ehr-data received POST request.');
            try {
                const clientFullEhr: ClientFullEHR = req.body;
                // Basic validation
                if (!clientFullEhr || typeof clientFullEhr !== 'object' || !clientFullEhr.fhir || !clientFullEhr.attachments) {
                    throw new Error("Invalid or missing ClientFullEHR data structure in request body.");
                }
                console.error(`[Server] Received EHR data. Resource types: ${Object.keys(clientFullEhr.fhir).length}, Attachments: ${clientFullEhr.attachments.length}`);

                // resolveExistingDb() already decided whether an existing file is
                // deleted or appended to, so only re-check for access problems here.
                 try {
                     await fs.access(dbPath);
                     console.error(`[Server] Adding to existing database file "${dbPath}".`);
                 } catch (accessError: any) {
                     if (accessError.code !== 'ENOENT') {
                         throw new Error(`Cannot access target database path "${dbPath}": ${accessError.message}`);
                     }
                     // ENOENT is expected, means file doesn't exist yet
                     console.error(`[Server] Output database file "${dbPath}" does not exist, will be created.`);
                 }


                console.error(`[Server] Initializing database at: ${dbPath}`);
                const db = new Database(dbPath); // Bun automatically creates/opens

                try {
                    console.error('[Server] Populating database...');
                    await ehrToSqlite(clientFullEhr, db, source);
                    console.error(`[Server] Successfully saved EHR data to ${dbPath}`);
                    // Tell the retriever JS that the POST was successful.
                    // The retriever JS doesn't expect a redirect URL in this flow.
                    res.status(200).json({ success: true });
                    // Initiate graceful shutdown after success
                    console.error('[Server] Data saved. Shutting down server...');
                    shutdown();
                } finally {
                    // Ensure DB is closed even if ehrToSqlite fails
                    try { db.close(); } catch (e) { console.error('[Server] Error closing DB:', e); }
                }

            } catch (error: any) {
                console.error('[Server] Error processing /ehr-data:', error.message);
                res.status(500).json({ success: false, error: "processing_failed", error_description: error.message });
                // Shut down server on failure too
                shutdown(error);
            }
        });

        // Error handling middleware
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error("[Server] Unhandled Error:", err.stack);
             res.status(500).send('Internal Server Error');
             shutdown(err); // Shut down on unhandled errors
        });

        // --- Create Server (HTTP or HTTPS based on config) ---
        try {
            if (serverConfig.https.enabled) {
                console.log("[Server] HTTPS is enabled. Loading certificates...");
                 if (!serverConfig.https.keyPath || !serverConfig.https.certPath) {
                     throw new Error("HTTPS enabled but keyPath or certPath missing in server config.");
                 }
                try {
                    const key = await fs.readFile(serverConfig.https.keyPath);
                    const cert = await fs.readFile(serverConfig.https.certPath);
                    const serverOptions: https.ServerOptions = { key: key, cert: cert };
                    console.log(`[Server] Certificates loaded successfully.`);
                    server = https.createServer(serverOptions, app);
                 } catch (certError: any) {
                    console.error(`[Server] FATAL ERROR loading certificate files:`, certError.message);
                     // Reject the main promise, triggering shutdown logic if needed
                     return reject(new Error(`Failed to load certificates: ${certError.message}`));
                 }
            } else {
                console.log("[Server] HTTPS is disabled. Creating HTTP server.");
                server = http.createServer(app);
            }

            server.listen(port, host, () => { // Use host from config
                 console.error(`[Server] Temporary ${protocol.toUpperCase()} server listening on ${baseUrl}`);
                 console.error(`[Action Required] Please open your web browser to: ${baseUrl}/start`);
                 console.error('[Server] Fill in the EHR details in the browser UI to connect and fetch data.');
                 console.error(`[Server] Waiting for data to be received at ${baseUrl}/ehr-data...`);
            });

            server.on('error', (error: NodeJS.ErrnoException) => {
                console.error(`[Server] Failed to start server on ${host}:${port}: ${error.message}`);
                if (error.code === 'EADDRINUSE') {
                    console.error(`[Server] Address ${host}:${port} is already in use. Check config or processes using the port.`);
                }
                server = null; // Ensure server is null so shutdown doesn't try to close it
                shutdown(error); // Reject the promise
            });
        } catch (serverSetupError: any) {
             console.error(`[Server] Error during server setup:`, serverSetupError.message);
             reject(serverSetupError); // Reject promise if initial setup (like cert loading check) fails
        }
    });
}

// --- Shared: decide what to do when the target DB file already exists ---
// Used by both --create-db and --import-json. Exits the process on an
// unrecoverable condition, otherwise returns once the path is ready to write.
async function resolveExistingDb(
    dbPath: string,
    options: { forceOverwrite?: boolean; forceConcat?: boolean }
): Promise<void> {
    // Validate flag combination up front, so a contradictory invocation is rejected
    // regardless of whether the target file happens to exist yet.
    if (options.forceOverwrite && options.forceConcat) {
        console.error('[CLI] Error: --force-overwrite and --force-concat cannot be used together.');
        process.exit(1);
    }

    try {
        await fs.access(dbPath); // Check if file exists (throws if not)
        console.warn(`[CLI] Database file "${dbPath}" already exists.`);
        if (options.forceOverwrite) {
            console.warn(`[CLI] --force-overwrite specified. Deleting existing file: ${dbPath}`);
            try {
                await fs.unlink(dbPath);
                console.error(`[CLI] Successfully deleted existing file.`);
            } catch (unlinkError: any) {
                console.error(`[CLI] Error deleting existing file "${dbPath}": ${unlinkError.message}`);
                process.exit(1);
            }
        } else if (options.forceConcat) {
            console.warn(`[CLI] --force-concat specified. New data will be added to the existing file.`);
            // No action needed here, the database will be opened and appended to later.
        } else {
            console.error(`[CLI] Error: Database file "${dbPath}" already exists.`);
            console.error('[CLI] Use --force-overwrite to delete it or --force-concat to add to it.');
            process.exit(1);
        }
    } catch (accessError: any) {
        if (accessError.code === 'ENOENT') {
            // File doesn't exist, which is the normal case, proceed silently.
            console.error(`[CLI] Database file "${dbPath}" does not exist, will be created.`);
        } else {
            // Other access error (e.g., permissions)
            console.error(`[CLI] Error checking database path "${dbPath}": ${accessError.message}`);
            process.exit(1);
        }
    }
}

// --- Shared: label pre-existing records that predate the `source` column ---
// A database built before `source` existed holds records from a known health
// system, but no record of which one. This stamps those rows in one pass so the
// history is attributable alongside data ingested later. Only rows with a NULL
// source are touched, so a database already holding several providers is safe.
async function backfillSource(
    dbPath: string,
    options: { source?: string; backfillSource?: boolean }
): Promise<void> {
    if (!options.backfillSource) return;

    if (!options.source) {
        console.error('[CLI] Error: --backfill-source requires --source <name>.');
        process.exit(1);
    }

    try {
        await fs.access(dbPath);
    } catch {
        console.error('[CLI] --backfill-source specified but no existing database to backfill; skipping.');
        return;
    }

    const db = new Database(dbPath);
    try {
        // ensureSchema manages its own transactions (the primary-key migration cannot
        // run inside one), so it goes before the update transaction opens.
        ensureSchema(db);
        db.exec('BEGIN TRANSACTION;');
        // Rows predating the source column read as NULL; rows created by the keyed
        // schema default to the empty string. Both mean "unlabelled".
        const unlabelled = `WHERE source IS NULL OR source = ''`;
        const resources = db.prepare(`UPDATE fhir_resources SET source = ? ${unlabelled}`).run(options.source).changes;
        const attachments = db.prepare(`UPDATE fhir_attachments SET source = ? ${unlabelled}`).run(options.source).changes;
        db.exec('COMMIT;');
        console.error(`[CLI] Backfilled source="${options.source}" onto ${resources} resource(s) and ${attachments} attachment(s).`);
    } catch (error: any) {
        try { db.exec('ROLLBACK;'); } catch { /* nothing to roll back */ }
        console.error(`[CLI] Error backfilling source: ${error.message}`);
        process.exit(1);
    } finally {
        try { db.close(); } catch (e) { console.error('[CLI] Error closing DB:', e); }
    }
}

// --- Function for --import-json mode ---
// Reads a ClientFullEHR JSON file (as downloaded from the standalone SMART on FHIR
// web client) and persists it to SQLite via the same ehrToSqlite path --create-db uses.
async function importJsonToDb(jsonPath: string, dbPath: string, source: string | null): Promise<void> {
    console.error(`[CLI] Reading ClientFullEHR JSON from: ${jsonPath}`);

    let clientFullEhr: ClientFullEHR;
    try {
        const raw = await fs.readFile(jsonPath, 'utf-8');
        clientFullEhr = JSON.parse(raw);
    } catch (readError: any) {
        if (readError.code === 'ENOENT') {
            console.error(`[CLI] Error: JSON file not found at ${jsonPath}`);
        } else {
            console.error(`[CLI] Error reading or parsing "${jsonPath}": ${readError.message}`);
        }
        process.exit(1);
    }

    // Same shape check the /ehr-data endpoint performs; a truncated download should
    // fail loudly here rather than produce a half-populated database.
    if (!clientFullEhr || typeof clientFullEhr !== 'object' || !clientFullEhr.fhir || !clientFullEhr.attachments) {
        console.error(`[CLI] Error: "${jsonPath}" is not a valid ClientFullEHR object (missing 'fhir' or 'attachments').`);
        process.exit(1);
    }

    const resourceTypeCount = Object.keys(clientFullEhr.fhir).length;
    const totalResources = Object.values(clientFullEhr.fhir).reduce((sum, arr) => sum + arr.length, 0);
    console.error(`[CLI] Loaded EHR data. Resource types: ${resourceTypeCount}, Total resources: ${totalResources}, Attachments: ${clientFullEhr.attachments.length}`);

    console.error(`[CLI] Initializing database at: ${dbPath}`);
    const db = new Database(dbPath); // Bun automatically creates/opens
    try {
        console.error('[CLI] Populating database...');
        await ehrToSqlite(clientFullEhr, db, source);
        console.error(`[CLI] Successfully saved EHR data to ${dbPath}`);
    } finally {
        try { db.close(); } catch (e) { console.error('[CLI] Error closing DB:', e); }
    }
}

// --- Function for --import-ccda mode ---
// Reads a C-CDA clinical document (bare .xml, or a .zip as exported by patient
// portals) and persists it through the same ehrToSqlite path the FHIR importers use.
async function importCcdaToDb(inputPath: string, dbPath: string, source: string): Promise<void> {
    console.error(`[CLI] Reading C-CDA from: ${inputPath}`);

    let xmlPath = inputPath;
    let pdfPath: string | null = null;
    let tempDir: string | null = null;

    if (inputPath.toLowerCase().endsWith('.zip')) {
        // These archives carry absolute paths ("/Document_XML/..."), so extract with
        // -j to flatten them: never trust archive-supplied paths (zip-slip).
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccda-'));
        // stderr is inherited rather than piped: `Response` is shadowed by the express
        // type import in this file, so letting unzip write straight through is simpler
        // than capturing the stream.
        const proc = spawn(['unzip', '-o', '-j', inputPath, '-d', tempDir], { stdio: ['ignore', 'ignore', 'inherit'] });
        // unzip exits 1 for warnings, not errors -- and stripping the archive's absolute
        // paths (which is exactly what we want -j to do) raises one. Only 2+ is a failure.
        const exitCode = await proc.exited;
        if (exitCode > 1) {
            console.error(`[CLI] Error: failed to extract "${inputPath}" (unzip exit ${exitCode}).`);
            process.exit(1);
        }
        const names = await fs.readdir(tempDir);
        const xmls = names.filter(n => n.toLowerCase().endsWith('.xml'));
        if (xmls.length !== 1) {
            console.error(`[CLI] Error: expected exactly one .xml in the archive, found ${xmls.length}: ${xmls.join(', ')}`);
            process.exit(1);
        }
        xmlPath = path.join(tempDir, xmls[0]);
        const pdfs = names.filter(n => n.toLowerCase().endsWith('.pdf'));
        if (pdfs.length === 1) pdfPath = path.join(tempDir, pdfs[0]);
        console.error(`[CLI] Extracted ${xmls[0]}${pdfPath ? ` and ${pdfs[0]}` : ''}`);
    }

    try {
        const documentBytes = await fs.readFile(xmlPath);
        const pdfBytes = pdfPath ? await fs.readFile(pdfPath) : undefined;

        const parsed = ccdaToEhr(documentBytes.toString('utf-8'), {
            documentBytes,
            pdfBytes,
            pdfName: pdfPath ? path.basename(pdfPath) : undefined,
        });

        console.error('[CLI] Section mapping:');
        for (const sec of parsed.sectionSummary) {
            if (!sec.entries) continue;
            const flag = sec.mapped === 0 ? '  (UNMAPPED - retained in source XML only)' : '';
            console.error(`[CLI]   ${sec.title.padEnd(28)} entries=${String(sec.entries).padStart(3)}  resources=${sec.mapped}${flag}`);
        }

        const total = Object.values(parsed.fhir).reduce((n, a) => n + a.length, 0);
        console.error(`[CLI] Parsed ${total} resources across ${Object.keys(parsed.fhir).length} types, ${parsed.attachments.length} attachments.`);

        const db = new Database(dbPath);
        try {
            console.error('[CLI] Populating database...');
            await ehrToSqlite({ fhir: parsed.fhir, attachments: parsed.attachments }, db, source, 'ccda');
            console.error(`[CLI] Successfully saved C-CDA data to ${dbPath}`);
        } finally {
            try { db.close(); } catch (e) { console.error('[CLI] Error closing DB:', e); }
        }
    } finally {
        if (tempDir) await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
}

// --- Main CLI Function ---
async function main() {
    const program = new Command();

    program
        .name('ehr-mcp-cli')
        .description('Exposes EHR tools (grep, query, eval) over stdio or fetches EHR data to a DB.')
        .version(SERVER_INFO.version)
        .requiredOption('-d, --db <path>', 'Path to the SQLite database file (read for stdio mode, write for --create-db mode).')
        // Options for --create-db mode
        .option('--create-db', 'Initiate EHR fetch via browser UI and save to the --db path.')
        // Import an already-downloaded ClientFullEHR JSON (e.g. from https://mcp.fhir.me/ehr-connect)
        .option('--import-json <path>', 'Import a ClientFullEHR JSON file into the --db path.')
        .option('-c, --config <path>', 'Optional path to config file (used by retriever build and server settings in --create-db mode).', './config.circlejtp.json') // Default config path
        // .option('--port <port>', 'Port for the temporary web server (for --create-db).', '8088') // Port now comes from config
        // Add new mutually exclusive flags for handling existing DB in --create-db mode
        .option('--force-overwrite', 'If --db exists in --create-db mode, delete it before creating a new one.')
        .option('--force-concat', 'If --db exists in --create-db mode, add new data to the existing file.')
        .option('--import-ccda <path>', 'Import a C-CDA clinical document (.xml, or .zip as exported by a patient portal) into the --db path. Requires --source.')
        .option('--source <name>', 'Label the ingested records with the health system they came from (e.g. "MultiCare"). Stored in the "source" column of both tables.')
        .option('--backfill-source', 'Before ingesting, stamp every record that currently has no source with the --source value. Use once on a database built before the source column existed.')
        .parse(process.argv);

    const options = program.opts();
    const dbPath = path.resolve(options.db);

    if (options.importCcda) {
        // --- Import C-CDA Mode ---
        console.error('[CLI] Running in --import-ccda mode.');

        if (options.createDb || options.importJson) {
            console.error('[CLI] Error: --import-ccda cannot be combined with --create-db or --import-json.');
            process.exit(1);
        }
        // Unlike a FHIR pull there is no endpoint to infer a provider name from, and an
        // unlabelled row in a multi-source database is very hard to attribute later.
        if (!options.source) {
            console.error('[CLI] Error: --import-ccda requires --source <name> (e.g. --source "ZoomCare").');
            process.exit(1);
        }

        const ccdaPath = path.resolve(options.importCcda);
        await resolveExistingDb(dbPath, options);
        await backfillSource(dbPath, options);
        await importCcdaToDb(ccdaPath, dbPath, options.source);
        process.exit(0);
    }

    if (options.importJson) {
        // --- Import JSON Mode ---
        console.error('[CLI] Running in --import-json mode.');

        if (options.createDb) {
            console.error('[CLI] Error: --import-json and --create-db cannot be used together.');
            process.exit(1);
        }

        const jsonPath = path.resolve(options.importJson);
        await resolveExistingDb(dbPath, options);
        await backfillSource(dbPath, options);
        await importJsonToDb(jsonPath, dbPath, options.source ?? null);
        process.exit(0);
    }

    if (options.createDb) {
        // --create-db drove the browser flow through the retriever's delivery mechanism:
        // it opened /ehretriever.html#deliver-to:cli-callback and waited for a POST to
        // /ehr-data. Both were removed from the retriever (see
        // docs/health.circlejtp.me-plan.md 9.4) because the delivery path let any origin
        // named in the URL hash receive a complete medical record. Nothing here can put
        // that back without reinstating the mechanism.
        //
        // --import-json covers the same ground in two steps rather than one, and is what
        // this project actually uses.
        console.error('[CLI] --create-db is no longer available.');
        console.error('');
        console.error('  It relied on the retriever delivering the record back to this');
        console.error('  process, which was removed for security reasons.');
        console.error('');
        console.error('  Use the two-step flow instead:');
        console.error('    1. Download your record from the web retriever.');
        console.error('    2. bun run src/cli.ts --import-json <file> --db <db> --source <name>');
        console.error('');
        process.exit(1);
    }

        // --- Stdio Mode (Original Logic) ---
        console.error(`[CLI] Running in stdio mode.`);
        console.error(`[CLI] Using database: ${dbPath}`);

        // --- Database and Data Loading ---
        let db: Database | undefined = undefined; // Initialize as potentially undefined
        let fullEhr: ClientFullEHR;

        try {
            await fs.access(dbPath, fs.constants.R_OK);
            console.error(`[CLI] Database file found. Opening...`);
            db = new Database(dbPath, { readonly: true });
            console.error(`[CLI] Database opened successfully.`);
            console.error(`[CLI] Loading EHR data from database...`);
            fullEhr = await sqliteToEhr(db);
            console.error(`[CLI] EHR data loaded. Resources: ${Object.values(fullEhr.fhir).flat().length}, Attachments: ${fullEhr.attachments.length}`);
        } catch (error: any) {
            console.error(`[CLI] FATAL ERROR loading database or EHR data from "${dbPath}":`, error.message);
            if (error.code === 'ENOENT') console.error(`[CLI] Error: Database file not found at ${dbPath}. Use --create-db mode to generate one.`);
            else if (error.code === 'EACCES') console.error(`[CLI] Error: Permission denied reading database file at ${dbPath}`);
            // Attempt to close DB if it was opened before the error during loading
            if (db) {
                 try { db.close(); console.error("[CLI] Closed DB connection after load error."); } catch (closeErr) {}
            }
            process.exit(1);
        }

        // --- MCP Server Setup ---
        const server = new McpServer(SERVER_INFO, {
            capabilities: { tools: {}, sampling: {} },
            instructions: `Server providing tools to interact with EHR data loaded from ${path.basename(dbPath)}.`
        });

        // --- Register Tools (Using Imported Logic) ---

        // Context retrieval function for CLI stdio environment
        async function getCliContext(
            _toolName: string,
            extra?: Record<string, any> 
        ): Promise<{ fullEhr?: ClientFullEHR, db?: Database }> {
             // In CLI stdio mode, db and fullEhr are pre-loaded in the outer scope
             // We don't need 'extra' here
             return { fullEhr, db };
        }

        // Register tools using the centralized function
        registerEhrTools(server, getCliContext);

        // --- Start Stdio Transport ---
        const transport = new StdioServerTransport();

        // Graceful shutdown handling
        const shutdown = async (signal: string) => {
            console.error(`\n[CLI] Received ${signal}. Shutting down...`);
            try { await server.close(); console.error("[CLI] MCP server closed."); }
            catch (e) { console.error("[CLI] Error closing MCP server:", e); }
            try {
                // Check if db object exists and attempt to close
                if (db) {
                    db.close(); // Just attempt to close
                    console.error("[CLI] Database connection closed.");
                }
            }
            catch(e) { console.error("[CLI] Error closing database:", e); }
            console.error("[CLI] Shutdown complete.");
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        console.error("[CLI] MCP Server initialized. Connecting to stdio transport...");
        try {
            await server.connect(transport);
            console.error("[CLI] Connected. Waiting for MCP messages on stdin...");
        } catch (error: any) {
            console.error("[CLI] FATAL ERROR connecting MCP server to stdio transport:", error.message);
            // Attempt to close db if it exists
            if (db) {
                 try { db.close(); } catch (closeErr) {}
            }
            process.exit(1);
        }
}

// Run the main function
main().catch(err => {
    console.error("[CLI] Unhandled error in main function:", err);
    process.exit(1);
});
