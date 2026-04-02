# NDS_AXIS_COVERAGE_TEST_RESULTS_V1

## Protocol purpose

Verify that when a story clearly belongs to a specific axis family, the candidate generator includes that family in the non-rejected candidate set.

## Case inventory by family

- system_redesign: 4
- delegation_distributed_responsibility: 2
- pattern_breaking: 2
- identity_transformation: 2
- relationship_or_listening: 2

## Aggregate pass/fail summary

- target_family_present present: 12/12 (PASS)
- target_family_present partial: 0/12 (PASS)
- target_family_present missing: 0/12 (PASS)
- best_family_fit strong_fit: 12/12 (PASS)
- generic_competence_fallback_present yes: 0/12 (PASS)

### Family-level thresholds

- system_redesign present 4/4, missing 0/4 (PASS)
- delegation_distributed_responsibility present 2/2 (PASS)
- pattern_breaking present 2/2 (PASS)
- identity_transformation present 2/2 (PASS)
- relationship_or_listening present 2/2 (PASS)

**OVERALL: PASS**

## Missing-family cases

- None

## Partial-family cases

- None

## Generic competence fallback cases

- None

## Remediation recommendations

- For any missing family case, add family-specific candidate constructors in the runtime candidate path.
- If partial cases exceed threshold, tighten family-specific line templates so they explicitly name axis nouns (system, delegation, pattern break, identity, listening).
- If generic fallback cases exceed threshold, expand hard/soft rejection filters for competence/challenge phrasing.
- Re-run NDS_DIRECTION_LINE_FIT_AUDIT_V1 after any candidate-family changes.