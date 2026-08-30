import { Database } from 'bun:sqlite';
import { ProcessedAttachment } from './types';
import { ClientFullEHR, ClientProcessedAttachment } from '../clientTypes';

/**
 * Populates a SQLite database with data from a FullEHR object.
 * Creates necessary tables and indexes for efficient querying.
 * 
 * @param fullEhr - The FullEHR object containing FHIR resources and attachments
 * @param db - An open SQLite database connection
 * @returns The same database instance after population
 */
/** Columns the current schema expects on each table, beyond the originals. */
const RESOURCE_COLUMNS = ['source', 'source_format', 'ingested_at'];
const ATTACHMENT_COLUMNS = ['source', 'source_format', 'ingested_at'];

function tableExists(db: Database, table: string): boolean {
    return db.query<{ n: number }, []>(
        `SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='${table}'`
    ).get()!.n > 0;
}

function columnsOf(db: Database, table: string) {
    return db.query<{ name: string; pk: number }, []>(`PRAGMA table_info(${table})`).all();
}

/**
 * True when fhir_resources is still keyed (resource_type, resource_id).
 *
 * That key is safe only while every id comes from a FHIR server and is opaque enough
 * that two health systems will not collide. Once ids are synthesised locally — as the
 * C-CDA path must do — a collision would let one provider's record silently overwrite
 * another's, so `source` has to be part of the key.
 */
function needsSourceInPrimaryKey(db: Database): boolean {
    if (!tableExists(db, 'fhir_resources')) return false;
    return !columnsOf(db, 'fhir_resources').some(c => c.name === 'source' && c.pk > 0);
}

/**
 * Rebuilds both tables with `source` in the primary key.
 *
 * SQLite cannot alter a primary key in place, so this is the standard
 * create/copy/drop/rename dance. Runs in its own transaction and must NOT be called
 * from inside one.
 */
function migrateToSourceKeyedSchema(db: Database): void {
    console.log('[DB:SCHEMA] Migrating: adding `source` to the primary key of fhir_resources');

    const hadAttachments = tableExists(db, 'fhir_attachments');
    const resCols = columnsOf(db, 'fhir_resources').map(c => c.name);
    const attCols = hadAttachments ? columnsOf(db, 'fhir_attachments').map(c => c.name) : [];
    // A column only exists to be copied if the old table already had it.
    const pick = (cols: string[], name: string, fallback = 'NULL') =>
        cols.includes(name) ? name : fallback;

    // ALTER TABLE ... RENAME rewrites foreign-key clauses in *other* tables to follow the
    // rename. We are replacing those tables wholesale, so switch that off for the swap.
    db.exec('PRAGMA legacy_alter_table = ON;');
    db.exec('BEGIN TRANSACTION;');
    try {
        db.exec(`
            CREATE TABLE fhir_resources_new (
                source TEXT NOT NULL DEFAULT '',
                resource_type TEXT NOT NULL,
                resource_id TEXT NOT NULL,
                json TEXT NOT NULL,
                source_format TEXT,
                ingested_at TEXT,
                PRIMARY KEY (source, resource_type, resource_id)
            );
        `);
        db.exec(`
            INSERT OR REPLACE INTO fhir_resources_new
                (source, resource_type, resource_id, json, source_format, ingested_at)
            SELECT coalesce(${pick(resCols, 'source', "''")}, ''), resource_type, resource_id, json,
                   ${pick(resCols, 'source_format')}, ${pick(resCols, 'ingested_at')}
            FROM fhir_resources;
        `);
        db.exec('DROP TABLE fhir_resources;');
        db.exec('ALTER TABLE fhir_resources_new RENAME TO fhir_resources;');

        if (hadAttachments) {
            db.exec(`
                CREATE TABLE fhir_attachments_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source TEXT NOT NULL DEFAULT '',
                    resource_type TEXT NOT NULL,
                    resource_id TEXT NOT NULL,
                    path TEXT NOT NULL,
                    content_type TEXT NOT NULL,
                    json TEXT NOT NULL,
                    content_raw BLOB,
                    content_plaintext TEXT,
                    source_format TEXT,
                    ingested_at TEXT,
                    FOREIGN KEY (source, resource_type, resource_id)
                        REFERENCES fhir_resources(source, resource_type, resource_id)
                );
            `);
            db.exec(`
                INSERT OR IGNORE INTO fhir_attachments_new
                    (source, resource_type, resource_id, path, content_type, json,
                     content_raw, content_plaintext, source_format, ingested_at)
                SELECT coalesce(${pick(attCols, 'source', "''")}, ''), resource_type, resource_id,
                       path, content_type, json, content_raw, content_plaintext,
                       ${pick(attCols, 'source_format')}, ${pick(attCols, 'ingested_at')}
                FROM fhir_attachments;
            `);
            db.exec('DROP TABLE fhir_attachments;');
            db.exec('ALTER TABLE fhir_attachments_new RENAME TO fhir_attachments;');
        }
        db.exec('COMMIT;');
    } catch (error) {
        try { db.exec('ROLLBACK;'); } catch { /* nothing to roll back */ }
        throw error;
    } finally {
        db.exec('PRAGMA legacy_alter_table = OFF;');
    }
    console.log('[DB:SCHEMA] Migration complete');
}

/**
 * Creates the schema on a fresh database and migrates an older one in place.
 *
 * Beyond the original schema:
 *  - `source` on both tables and in the primary key, so records from different health
 *    systems stay distinguishable and can never overwrite one another;
 *  - `source_format` ('fhir' | 'ccda'), so a suspect row can be traced back to whether
 *    it came from an API or from a lossy document mapping;
 *  - `ingested_at`, distinct from any clinical date on the resource;
 *  - a uniqueness constraint on attachments, so re-ingesting a provider updates rather
 *    than duplicates.
 *
 * Manages its own transactions — do NOT call this from inside one.
 */
export function ensureSchema(db: Database): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS fhir_resources (
            source TEXT NOT NULL DEFAULT '',
            resource_type TEXT NOT NULL,
            resource_id TEXT NOT NULL,
            json TEXT NOT NULL,
            source_format TEXT,
            ingested_at TEXT,
            PRIMARY KEY (source, resource_type, resource_id)
        );

        CREATE TABLE IF NOT EXISTS fhir_attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL DEFAULT '',
            resource_type TEXT NOT NULL,
            resource_id TEXT NOT NULL,
            path TEXT NOT NULL,
            content_type TEXT NOT NULL,
            json TEXT NOT NULL,
            content_raw BLOB,
            content_plaintext TEXT,
            source_format TEXT,
            ingested_at TEXT,
            FOREIGN KEY (source, resource_type, resource_id)
                REFERENCES fhir_resources(source, resource_type, resource_id)
        );
    `);

    // Older databases predate these columns. SQLite has no ADD COLUMN IF NOT EXISTS.
    for (const [table, wanted] of [['fhir_resources', RESOURCE_COLUMNS], ['fhir_attachments', ATTACHMENT_COLUMNS]] as const) {
        const present = new Set(columnsOf(db, table).map(c => c.name));
        for (const col of wanted) {
            if (!present.has(col)) {
                console.log(`[DB:SCHEMA] Adding '${col}' column to ${table}`);
                db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT`);
            }
        }
    }

    if (needsSourceInPrimaryKey(db)) {
        migrateToSourceKeyedSchema(db);
    }

    // Collapse duplicates left by an append that predates the unique index.
    const removed = db.prepare(`
        DELETE FROM fhir_attachments
        WHERE id NOT IN (
            SELECT MIN(id) FROM fhir_attachments
            GROUP BY source, resource_type, resource_id, path, content_type
        )
    `).run().changes;
    if (removed > 0) {
        console.log(`[DB:SCHEMA] Removed ${removed} duplicate attachment row(s) left by an earlier append`);
    }

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_fhir_resources_type ON fhir_resources(resource_type);
        CREATE INDEX IF NOT EXISTS idx_fhir_resources_source ON fhir_resources(source);
        CREATE INDEX IF NOT EXISTS idx_fhir_attachments_resource ON fhir_attachments(resource_type, resource_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_fhir_attachments_unique
            ON fhir_attachments(source, resource_type, resource_id, path, content_type);
    `);
}

export async function ehrToSqlite(
    fullEhr: ClientFullEHR,
    db: Database,
    source: string | null = null,
    sourceFormat: 'fhir' | 'ccda' = 'fhir'
): Promise<Database> {
    console.log(`[DB:POPULATE] Starting database population from FullEHR${source ? ` (source: ${source}, format: ${sourceFormat})` : ''}`);

    // Schema work manages its own transactions (the primary-key migration cannot run
    // inside one), so it has to happen before the data transaction opens.
    ensureSchema(db);

    const ingestedAt = new Date().toISOString();

    try {
        // Begin a transaction for better performance
        db.exec('BEGIN TRANSACTION;');

        // Prepare statements for better performance
        const insertResourceStmt = db.prepare(
            'INSERT OR REPLACE INTO fhir_resources (source, resource_type, resource_id, json, source_format, ingested_at) VALUES (?, ?, ?, ?, ?, ?)'
        );
        
        // OR IGNORE plus the unique index makes re-ingesting a provider idempotent:
        // an attachment already on file is left alone instead of duplicated.
        const insertAttachmentStmt = db.prepare(
            'INSERT OR IGNORE INTO fhir_attachments (source, resource_type, resource_id, path, content_type, json, content_raw, content_plaintext, source_format, ingested_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        
        // Insert FHIR resources
        let resourceCount = 0;
        for (const [resourceType, resources] of Object.entries(fullEhr.fhir)) {
            for (const resource of resources) {
                if (resource && resource.id) {
                    insertResourceStmt.run(source ?? '', resourceType, resource.id, JSON.stringify(resource), sourceFormat, ingestedAt);
                    resourceCount++;
                }
            }
        }
        console.log(`[DB:POPULATE] Inserted ${resourceCount} FHIR resources`);
        
        // Insert attachments
        if (fullEhr.attachments && fullEhr.attachments.length > 0) {
            let attachmentCount = 0;
            let skippedCount = 0;
            for (const attachment of fullEhr.attachments) {
                const { changes } = insertAttachmentStmt.run(
                    source ?? '',
                    attachment.resourceType,
                    attachment.resourceId,
                    attachment.path,
                    attachment.contentType,
                    attachment.json,
                    attachment.contentBase64,
                    attachment.contentPlaintext,
                    sourceFormat,
                    ingestedAt
                );
                if (changes > 0) attachmentCount++; else skippedCount++;
            }
            console.log(`[DB:POPULATE] Inserted ${attachmentCount} attachments${skippedCount > 0 ? ` (${skippedCount} already present, skipped)` : ''}`);
        } else {
            console.log('[DB:POPULATE] No attachments to insert');
        }
        
        // Commit transaction
        db.exec('COMMIT;');
        console.log("[DB:POPULATE] Database population completed successfully");
        
        return db;
    } catch (error) {
        // Rollback on error
        try {
            db.exec('ROLLBACK;');
        } catch (rollbackError) {
            console.error('[DB:POPULATE] Error during rollback:', rollbackError);
        }
        console.error('[DB:POPULATE] Error populating database:', error);
        throw error;
    }
}

interface ResourceRow {
    resource_type: string;
    json: string;
}

interface AttachmentRow {
    resource_type: string;
    resource_id: string;
    path: string;
    content_type: string;
    json: string;
    content_raw: ArrayBuffer | null;
    content_plaintext: string | null;
}

/**
 * Reconstructs a FullEHR object from a SQLite database.
 * Retrieves all FHIR resources and attachments.
 * 
 * @param db - An open SQLite database connection
 * @returns A Promise resolving to a FullEHR object
 */
export async function sqliteToEhr(db: Database): Promise<ClientFullEHR> {
    // console.log("[DB:RECONSTRUCT] Reconstructing FullEHR from database");
    
    try {
        // Initialize the FullEHR structure
        const fhir: Record<string, any[]> = {};
        
        // Fetch all resources grouped by type
        const resourcesQuery = db.query<ResourceRow, []>(`
            SELECT resource_type, json 
            FROM fhir_resources
            ORDER BY resource_type
        `);
        
        for (const row of resourcesQuery.all()) {
            const resourceType = row.resource_type;
            const content = JSON.parse(row.json);
            
            if (!fhir[resourceType]) {
                fhir[resourceType] = [];
            }
            
            fhir[resourceType].push(content);
        }
        
        // Fetch all attachments
        const attachmentsQuery = db.query<AttachmentRow, []>(`
            SELECT resource_type, resource_id, path, content_type, json, content_raw, content_plaintext
            FROM fhir_attachments
        `);
        
        const attachments: ClientProcessedAttachment[] = attachmentsQuery.all().map(row => ({
            resourceType: row.resource_type,
            resourceId: row.resource_id,
            path: row.path,
            contentType: row.content_type,
            json: row.json,
            contentBase64: row.content_raw ? Buffer.from(row.content_raw).toString('base64') : null,
            contentPlaintext: row.content_plaintext
        }));
        
        const resourceCount = Object.values(fhir).reduce((sum, arr) => sum + arr.length, 0);
        // console.log(`[DB:RECONSTRUCT] Reconstructed ${resourceCount} resources and ${attachments.length} attachments`);
        
        return { fhir, attachments };
    } catch (error) {
        console.error('[DB:RECONSTRUCT] Error reconstructing FullEHR from database:', error);
        throw error;
    }
} 