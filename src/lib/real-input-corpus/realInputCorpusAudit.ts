import type { RicAuditSink } from '@/types/realInputCorpusService';
import type { SqlTransactionalClient } from '@/lib/real-input-corpus/realInputCorpusDb';
import { writeAuditLog } from '@/lib/real-input-corpus/realInputCorpusDb';

export class SqlRicAuditSink implements RicAuditSink {
  constructor(private readonly db: SqlTransactionalClient) {}

  async write(entry: {
    actorId: string;
    actionType: string;
    targetTable: string;
    targetId?: string;
    caseId?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await writeAuditLog(this.db, {
      caseId: entry.caseId,
      actorId: entry.actorId,
      actionType: entry.actionType,
      targetTable: entry.targetTable,
      targetId: entry.targetId,
      payload: entry.payload,
    });
  }
}
