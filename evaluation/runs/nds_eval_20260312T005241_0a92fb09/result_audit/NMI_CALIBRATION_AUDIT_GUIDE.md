# Needs-More-Input Calibration Audit

Purpose: determine whether NDS `needs_more_input` routing is correctly cautious or overused.

Latest run baseline facts:
- `nds_needs_more_input_cases = 25`
- `baseline_needs_more_input_cases = 5`

Source: [summary.json](../summary.json)

## Required reviewer outputs per NMI case
For each row in `nmi_calibration_audit_table.csv`, complete:
- Was NMI appropriate? (`Yes` / `Borderline` / `No`)
- Should a constrained recommendation have been possible? (`Yes` / `Maybe` / `No`)
- Primary cause of NMI
- Recovery question quality (`Strong` / `Acceptable` / `Weak` / `Wrong question`)
- Would a user feel helped? (`Yes` / `Somewhat` / `No`)
- NMI classification (`Correctly cautious` / `Over-cautious` / `Wrong` / `Needs rewrite only`)
- Reviewer note

## Allowed primary-cause values
- Truly thin input
- Conflicting evidence
- Missing turning point
- Missing stakes
- School-context insufficiency
- Resume-list only
- Parent/advisor contamination
- Validator too strict
- Readiness evaluator too strict
- Prompt under-reaching
- Other

## NMI decision rules
### Correctly cautious
Use when input does not support a trustworthy direction and recovery question improves next-step clarity.

### Over-cautious
Use when there is enough signal for constrained recommendation but system routes to NMI anyway.

### Wrong
Use when a direction should clearly have been made and NMI reflects failure in readiness/prompt/validation.

### Needs rewrite only
Use when NMI routing is right but phrasing/recovery question is poor.

## Required summaries after review
1) NMI by difficulty (weak/medium/strong)
2) NMI correctness counts
3) Primary-cause breakdown counts
4) UX helpfulness counts

## Calibration thresholds
### Healthy
- >=70% correctly cautious
- <20% wrong
- <25% over-cautious

### Warning
- 25–40% over-cautious
- medium/strong frequently route to NMI
- recovery questions often weak

### Broken
- >40% over-cautious or wrong
- medium/strong regularly fail to get a direction

## Remediation mapping
- `Readiness evaluator too strict` -> adjust readiness thresholds; allow more reduced-scope outputs
- `Validator too strict` -> recalibrate semantic rejection thresholds
- `Prompt under-reaching` -> strengthen reduced-scope recommendation prompt behavior
- `Truly thin input` -> keep routing; improve recovery question quality and weak-input UX
- `Parent/advisor contamination` or `Conflicting evidence` -> strengthen context assembly and contamination handling
