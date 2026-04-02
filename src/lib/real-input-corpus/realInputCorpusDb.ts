import type { RicCaseRecord } from '@/types/realInputCorpus';
import { Pool, type PoolClient, type QueryResult } from 'pg';

export interface SqlQueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
}

export interface SqlExecutor {
  query<T = unknown>(sql: string, params?: readonly unknown[]): Promise<SqlQueryResult<T>>;
}

export interface SqlTransactionalClient extends SqlExecutor {
  transaction?<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T>;
}

export type RicDbCaseRow = {
  id: string;
  case_key: string;
  case_type: RicCaseRecord['caseType'];
  product_surface: RicCaseRecord['productSurface'];
  source_channel: RicCaseRecord['sourceChannel'];
  lifecycle_status: RicCaseRecord['lifecycleStatus'];
  review_priority: RicCaseRecord['reviewPriority'];
  current_truth_status: RicCaseRecord['currentTruthStatus'];
  label_schema_version: string;
  routing_policy_version: string | null;
  prompt_template_version: string | null;
  release_version: string | null;
  tags_json: string[];
  notes_internal: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export function mapCaseRowToRecord(row: RicDbCaseRow): RicCaseRecord {
  return {
    id: row.id,
    caseKey: row.case_key,
    caseType: row.case_type,
    productSurface: row.product_surface,
    sourceChannel: row.source_channel,
    lifecycleStatus: row.lifecycle_status,
    reviewPriority: row.review_priority,
    currentTruthStatus: row.current_truth_status,
    labelSchemaVersion: row.label_schema_version,
    routingPolicyVersion: row.routing_policy_version,
    promptTemplateVersion: row.prompt_template_version,
    releaseVersion: row.release_version,
    tags: row.tags_json,
    notesInternal: row.notes_internal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export async function writeAuditLog(
  db: SqlExecutor,
  entry: {
    caseId?: string;
    actorId: string;
    actionType: string;
    targetTable: string;
    targetId?: string;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  const sql = `
    insert into case_audit_log (case_id, actor_id, action_type, target_table, target_id, payload_json)
    values ($1, $2, $3, $4, $5, $6::jsonb)
  `;

  await db.query(sql, [
    entry.caseId ?? null,
    entry.actorId,
    entry.actionType,
    entry.targetTable,
    entry.targetId ?? null,
    JSON.stringify(entry.payload ?? {}),
  ]);
}

export async function createSqlClient(): Promise<SqlTransactionalClient> {
  const connectionString =
    process.env.RIC_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      'Missing DB connection string. Set one of RIC_DATABASE_URL, DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL.',
    );
  }

  const pool = getRicPool(connectionString);

  const client: SqlTransactionalClient = {
    async query<T = unknown>(sql: string, params?: readonly unknown[]): Promise<SqlQueryResult<T>> {
      const result: QueryResult = await pool.query(sql, params as unknown[] | undefined);
      return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
    },

    async transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> {
      const txClient = await pool.connect();
      try {
        await txClient.query('begin');

        const txExecutor: SqlExecutor = {
          async query<T = unknown>(
            sql: string,
            params?: readonly unknown[],
          ): Promise<SqlQueryResult<T>> {
            const result: QueryResult = await txClient.query(
              sql,
              params as unknown[] | undefined,
            );
            return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
          },
        };

        const out = await fn(txExecutor);
        await txClient.query('commit');
        return out;
      } catch (error) {
        await rollbackQuietly(txClient);
        throw error;
      } finally {
        txClient.release();
      }
    },
  };

  return client;
}

const globalRic = globalThis as typeof globalThis & { __ricPool?: Pool };

function getRicPool(connectionString: string): Pool {
  if (!globalRic.__ricPool) {
    globalRic.__ricPool = new Pool({ connectionString });
  }
  return globalRic.__ricPool;
}

async function rollbackQuietly(client: PoolClient): Promise<void> {
  try {
    await client.query('rollback');
  } catch {
    // ignore rollback errors; original error is thrown by caller
  }
}
