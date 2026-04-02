// realInputCorpusExport.ts
// Deterministic export helpers for real-input corpus eval packs

import type {
  EvalPackCaseExport,
  ExportEvalPackResponse,
} from "./api/realInputCorpusApi";

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, "en", { sensitivity: "base", numeric: true });
}

function sortCaseExport(caseItem: EvalPackCaseExport): EvalPackCaseExport {
  const expectedFailureModes = [...caseItem.expectedFailureModes].sort(compareStrings);

  const expectedScoreProfile = Object.fromEntries(
    Object.entries(caseItem.expectedScoreProfile).sort(([a], [b]) => compareStrings(a, b)),
  );

  const context = sortObjectKeys(caseItem.context);

  return {
    ...caseItem,
    expectedFailureModes,
    expectedScoreProfile,
    context,
  };
}

function sortObjectKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sortObjectKeys(v)) as T;
  }

  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => compareStrings(a, b))
      .map(([k, v]) => [k, sortObjectKeys(v)]);

    return Object.fromEntries(sortedEntries) as T;
  }

  return value;
}

export function normalizeEvalPackExport(
  payload: ExportEvalPackResponse,
): ExportEvalPackResponse {
  const sortedCases = [...payload.cases]
    .map(sortCaseExport)
    .sort((a, b) => compareStrings(a.caseKey, b.caseKey));

  return {
    evalPackKey: payload.evalPackKey,
    version: payload.version,
    packType: payload.packType,
    labelVersion: payload.labelVersion,
    createdAt: payload.createdAt,
    cases: sortedCases,
  };
}

export function stringifyDeterministicJson(value: unknown): string {
  return JSON.stringify(sortObjectKeys(value), null, 2);
}

export function serializeEvalPackExport(
  payload: ExportEvalPackResponse,
): string {
  return stringifyDeterministicJson(normalizeEvalPackExport(payload));
}
