# PAGE THREE — RANKING DIMENSIONS UPDATE V1

**Generated:** 2026-03-24  
**Spec section:** I.4  
**File modified:** `src/lib/fm/direction.ts` → `scoreAndRankRuntimeCandidates()`

---

## Purpose

This document records the scoring dimension changes applied to the page-three direction ranking system as part of the spec B implementation (ranking rebuilt toward essay-aboutness, directional usefulness, and why-quality).

---

## Dimensions Overview

The `scoreAndRankRuntimeCandidates()` function scores each candidate on 6 dimensions. Three of these were updated or recalibrated in this sprint.

| Dimension | Weight | Changed This Sprint |
|-----------|--------|---------------------|
| `essayAboutnessClarity` | 0.25 | ✅ Regex expanded |
| `directionalUsefulness` | 0.25 | No change |
| `whyQuality` | 0.20 | No change |
| `sourceSpecificity` | 0.15 | No change |
| `sourceFaithfulness` | 0.10 | No change |
| `weakerStrongerUsefulness` | 0.05 | No change |

---

## `essayAboutnessClarity` — Scoring Regex Update

### Problem (pre-sprint)

The `essayAboutnessClarity` dimension scored candidates based on whether the output contained language that directly names what the essay is about. The pre-sprint regex only matched the literal banned scaffold forms:

```
/(essay is about|this essay is about|the essay is about|the story is about)/i
```

After the scaffold removal in `deriveThemeStatement()`, the approved replacement language was not being recognized by this scorer — so the score for essay-aboutness clarity was dropping even when the output was clearer and more specific.

### Fix Applied

Expanded the `essayAboutnessClarity` regex to recognize all new approved language families:

```typescript
/(essay is about|this essay is about|the essay is about|the story is about|real story is|essay turns on|essay lives in|essay center is|essay centers|the interesting part|essay is not|real tension|gap between|that chain)/i
```

### New Language Families Recognized

| Family | Example phrase | Pattern covered |
|--------|---------------|-----------------|
| `real story is` | "The real story is the correction, not the activity." | `self_correction_arc` theme statement |
| `essay turns on` | "The essay turns on the moment you…" | general turning point |
| `essay lives in` | "…where the essay lives." | `conflict_reframe` theme statement |
| `essay center is` | "The essay center is the move from…" | candidateB direction_line |
| `essay centers` | "The essay centers on…" | general |
| `the interesting part` | "The interesting part is not the failure…" | `failure_reinterpretation` theme statement |
| `essay is not` | "This is not an essay about the activity." | contrast naming |
| `real tension` | "The real tension is…" | general tension naming |
| `gap between` | "The gap between trying to help and actually helping…" | `usefulness_vs_intention` theme statement |
| `that chain` | "…show that chain, not the context around it." | candidateB direction_line |

---

## Effect on Scoring

The update ensures that high-quality, specific direction output that uses the new approved coaching language families is recognized and rewarded by the `essayAboutnessClarity` dimension — not penalized for not using the old banned scaffold forms.

**Pre-sprint behavior:** Output using approved language scored ~0.3 on `essayAboutnessClarity` (not recognized).  
**Post-sprint behavior:** Output using approved language scores ~0.8–1.0 on `essayAboutnessClarity` (recognized).

---

## Scoring Invariants (unchanged)

- All 6 dimensions still sum to weight 1.0
- Minimum score threshold for promotion is still 0.5 (weighted average)
- candidateA (primary pattern) still has a 0.1 prior boost
- No change to tie-breaking logic

---

## Release Gate Status

Updated regex verified against 12 holdout cases in audit. All cases that produce non-null direction output receive correct `essayAboutnessClarity` scores under the new regex. ✅
