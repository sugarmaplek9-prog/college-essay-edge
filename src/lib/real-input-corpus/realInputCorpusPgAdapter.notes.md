# realInputCorpusPgAdapter.notes.md

## Why this note exists

The uploaded archive included:
- `realInputCorpusPgAdapter.ts`
- `realInputCorpusDb.ts`
- `realInputCorpusHandlers.ts`

but **did not include** the actual `realInputCorpusService.ts` repository interface file.

Because of that, I did not generate a fake "final adapter" here that claims to exactly satisfy an unseen interface.

## What is now known exactly

From `realInputCorpusDb.ts`:
- `SqlExecutor`
- `SqlTransactionalClient`
- `RicDbCaseRow`
- `mapCaseRowToRecord()`
- `writeAuditLog()`
- `createSqlClient()` placeholder

From `realInputCorpusHandlers.ts`:
- the actual service method call signatures
- the repository-native error classes used at the handler boundary

## Conclusion

The next compile-credible adapter pass requires the actual `realInputCorpusService.ts` file so the adapter can be checked against the true `RicRepository` interface instead of inferred from usage alone.
