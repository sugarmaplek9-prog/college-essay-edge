# NDS Evidence Grounding Audit Results V1

## Audit purpose

This audit checks whether the selected strongest direction is genuinely supported by the student text, whether the cited evidence is actually probative, and whether the explanation stays within the bounds of that evidence. These packets are deterministic audit-layer outputs and still require human review before release decisions.

## Case mix

- 20 locked cases total
- 8 clear winner cases
- 6 ambiguous cases
- 4 weak-input cases
- 2 genericity-trap cases

## Pass / fail summary

- Overall result: PASS
- Strong evidence relevance: 20/20
- Sufficient evidence: 20/20
- Grounded explanations: 16/20
- Defensible winners from evidence only: 16/20
- Better-grounded alternatives = yes: 0/20

## Aggregate grounding metrics

- Weak evidence relevance cases: 0
- Insufficient evidence cases: 0
- Ungrounded explanation cases: 0
- Not defensible winner cases: 0

## Cases with weak grounding

- None by automated pre-audit.

## Cases with better-grounded alternatives

- None by automated pre-audit.

## Remediation recommendations

- Human reviewers should inspect every packet and only judge whether the evidence shown actually justifies the winner.
- Cases flagged with weak / insufficient / ungrounded labels should be treated as release blockers until adjudicated.
- If more than 3 cases remain with clearly better-grounded alternatives after human review, rollout should remain blocked.
- Re-run this locked set after any scorer or evidence-routing change to confirm that selected winners stay grounded in the student notes.

## Human review requirement

- Primary reviewer: required
- Secondary reviewer: optional for contested packets
- Final adjudication must be written into the serialized audit packet before rollout expansion.