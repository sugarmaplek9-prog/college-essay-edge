# PAGE THREE — HOLDOUT REPORT V-NEXT

**Generated:** 2026-03-24  
**Spec section:** I.6  
**Holdout script:** `scripts/page3-holdout-v2.mjs`  
**Evaluator (frozen):** `scripts/frozen/page3-evaluator-frozen-2026-03-23.mjs`  
**Cases:** `scripts/data/page3-holdout-v2-cases.json`  
**Output summary:** `evaluation_outputs/page3_holdout_v2/summary.json`

---

## Final Tally

| Metric | Value | Gate | Status |
|--------|-------|------|--------|
| Product wins | **11** | ≥ 10 | ✅ PASS |
| OpenAI wins | 1 | — | — |
| Ties | 0 | — | — |
| Cases evaluated | 12 | 12 | ✅ |
| Unknown-blocked | 0 | — | ✅ |

**Win rate: 91.7%**

---

## Case-by-Case Results

| Case ID | Title | Pattern | Signal | Product Avg | OpenAI Avg | Winner |
|---------|-------|---------|--------|-------------|-----------|--------|
| HV2_01 | Chem lab checklist | `competence_vs_responsibility` | strong | — | — | Product |
| HV2_02 | Peer tutoring | `usefulness_vs_intention` | strong | — | — | Product |
| HV2_03 | Coffee kiosk inventory | `failure_reinterpretation` | strong | — | — | Product |
| HV2_04 | District bus stop | `responsibility_shift` | strong | — | — | Product |
| HV2_05 | Marching band conflict | `conflict_reframe` | strong | — | — | Product |
| HV2_06 | Hackathon project credit | `identity_shift` | strong | — | — | Product |
| HV2_07 | Clinic intake translation | `competence_vs_responsibility` | strong | — | — | Product |
| HV2_08 | Cafeteria allergy labeling | `responsibility_shift` | strong | — | — | Product |
| HV2_09 | History day citation collapse | `failure_reinterpretation` | strong | — | — | Product |
| HV2_10 | Robotics pit decision | `conflict_reframe` | strong | — | — | Product |
| **HV2_11** | **Split focus** | **`unknown`** | **weak** | **1.86** | **2.86** | **OpenAI** |
| HV2_12 | Grandparents interpretation | `identity_shift` | strong | — | — | Product |

---

## Failure Analysis — HV2_11

**Title:** Split focus — art portfolio and cross-country  
**Signal quality:** Weak (no turning point, no before-after structure)  
**Product behavior:** Correctly returned empty direction output (unknown path — no arc present)  
**OpenAI behavior:** Generated a direction suggestion ("Focus on the intersection of painting and cross-country")  
**Automated scorer verdict:** OpenAI wins (more content = higher score on evidence/recommendation dimensions)

**Assessment:** The product's behavior is correct. A student with no turning point should not receive a fabricated direction. The OpenAI response made up an essay direction from insufficient signal. The scorer's limitation (favoring content volume over signal discipline) is acknowledged in the holdout summary.

**This is not a product regression.** The product is doing the right thing; the automated scorer does not penalize hallucination.

---

## Pre-Sprint vs Post-Sprint Comparison

| Sprint | Wins | Win Rate | Unknown Rate |
|--------|------|----------|-------------|
| Pre-sprint (V1 spec) | 11 | 91.7% | 50.0% (6/12) |
| **Post-sprint (V-NEXT)** | **11** | **91.7%** | **8.3% (1/12)** |

**Holdout win rate is maintained at 11/12.** The sprint significantly improved unknown-rate (50% → 8.3%) without degrading the holdout win rate.

---

## Evaluator Freeze Note

The evaluator used for this holdout is frozen at `scripts/frozen/page3-evaluator-frozen-2026-03-23.mjs`. This evaluator is used for all holdout runs to prevent evaluator drift from affecting comparisons across sprints.

---

## Scorer Limitation

> "hasConcreteEntity whitelist covers only 5 training-packet entities; both product and OpenAI affected equally on new domains"

This limitation applies symmetrically to both product and OpenAI outputs and does not introduce systematic bias toward either system. It is not a blocker for release.

---

## Release Gate Status

- Automated holdout: **11/12 wins (91.7%)** ✅
- Unknown rate: **8.3%** ✅ (target < 15%)
- Build: **PASS** ✅
- Tests: **51/51 pass** ✅
- Human blind review: **Pending** (see `PAGE_THREE_HUMAN_BLIND_REVIEW_RESULTS_V_NEXT.md`)

**Holdout gate: PASSED. Awaiting human blind review for final release approval.**
