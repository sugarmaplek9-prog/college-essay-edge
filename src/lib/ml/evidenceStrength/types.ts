// =============================================================
// src/lib/ml/evidenceStrength/types.ts
//
// Re-exports shared governance types from the canonical
// intake type contract. ML modules must import from here,
// not directly from @/types/intake, to keep the ML layer
// cleanly scoped.
// =============================================================

export type {
  ProductMode,
  EvidenceStrengthPrediction,
} from '@/types/intake';
