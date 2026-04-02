import type { SqlExecutor, SqlTransactionalClient } from './realInputCorpusDb';

export async function withRicTransaction<T>(
  client: SqlTransactionalClient,
  fn: (tx: SqlExecutor) => Promise<T>,
): Promise<T> {
  if (typeof client.transaction === 'function') {
    return client.transaction(fn);
  }

  return fn(client);
}
