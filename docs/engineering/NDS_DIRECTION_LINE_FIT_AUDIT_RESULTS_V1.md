# NDS_DIRECTION_LINE_FIT_AUDIT_V1 Results

> **STATUS: PASS — NDS_DIRECTION_LINE_FIT_AUDIT_V1**

## Audit purpose

Verify that the selected direction_line correctly names the true story axis.
Core question: does the direction line describe what the story is actually about,
or does it flatten the story into a generic frame?

## Case mix

- 6 realization | 6 action | 4 ambiguity | 4 other_domain
- Total: 20 cases (DLF_01–DLF_20)
- Failure-trap coverage: performed_well×3, handled_pressure×2, leadership_challenge×2, growth_difficult×2, meaningful_personal×2

## Global pass/fail summary

- ✓ PASS  strong_fit_count ≥ 16: 20/20
- ✓ PASS  specific_count ≥ 16: 20/20
- ✓ PASS  over_generic_count ≤ 3: 0/20
- ✓ PASS  misfit_count ≤ 3: 0/20
- ✓ PASS  better_alt_yes_count ≤ 4: 0/20

### "other" domain sub-gate (4 cases)

- ✓ PASS  not_over_generic ≥ 3/4: 4/4
- ✓ PASS  misfit_count ≤ 1/4: 0/4

## Case-level results

| ID | Class | Direction Line | Fit | Specificity | Genericity | Better Alt |
|----|-------|----------------|-----|-------------|------------|------------|
| DLF_01 | realization | What you owed the room once the conflict stopped being … | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_02 | realization | What your response to failure showed about your respons… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_03 | realization | The moment responsibility stopped being performance and… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_04 | realization | The moment effort stopped fixing the problem and you re… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_05 | realization | The moment pushing harder became the wrong pattern and … | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_06 | realization | The moment you stopped being the bottleneck and started… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_07 | action | What real help looked like once you paid attention to t… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_08 | action | How you found a way to contribute through the hardest s… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_09 | action | The moment effort stopped fixing the problem and you re… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_10 | action | The moment effort stopped fixing the problem and you re… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_11 | action | The moment effort stopped fixing the problem and you re… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_12 | action | The moment effort stopped fixing the problem and you re… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_13 | ambiguity | How your decisions affected the people around you, not … | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_14 | ambiguity | The moment effort stopped fixing the problem and you re… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_15 | ambiguity | The moment effort stopped fixing the problem and you re… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_16 | ambiguity | The moment effort stopped fixing the problem and you re… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_17 | other_domain | How you adjusted your approach once you paid attention … | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_18 | other_domain | How your changed approach affected the other people in … | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_19 | other_domain | The moment your first approach stopped helping and you … | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |
| DLF_20 | other_domain | The moment the story became about who you were becoming… | ✓ strong_fit | ✓ specific | ✓ not_generic | ✓ no |

## Misfit cases

- None by automated pre-audit.

## Over-generic line cases

- None by automated pre-audit.

## "other" domain findings

- **DLF_17** (Family caregiving note with almost no recoverable hinge): fit=strong_fit, specificity=specific, genericity=not_generic
- **DLF_18** (Bench season sports note with no concrete role change): fit=strong_fit, specificity=specific, genericity=not_generic
- **DLF_19** (Generic internship leadership reflection with no recoverable event): fit=strong_fit, specificity=specific, genericity=not_generic
- **DLF_20** (Language identity shift from competitor to complement): fit=strong_fit, specificity=specific, genericity=not_generic

## Cases with better alternate lines

- None by automated pre-audit.

## Remediation recommendations

- Any case labeled misfit or over_generic is a release blocker.
- If more than 4 cases have better_alternate_line_exists = yes, review direction-line builder logic for those domains.
- "other" domain violations require updating buildCompetenceDirectionLine / buildResponsibilityDirectionLine for the relevant domain key.
- Re-run this locked set after any direction-line or domain-frame change.

## Human review requirement

- Primary reviewer: required for all 20 cases
- Second reviewer: required for any case labeled misfit, over_generic, or better_alternate_line_exists = yes
- Final adjudication must be written into the serialized audit packet before rollout expansion.
- Use inject-human-reviews script to populate human_review fields once review is complete.

---
_Generated by NDS_DIRECTION_LINE_FIT_AUDIT_V1 | Cases: 20 | Protocol locked_