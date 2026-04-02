# Founder Served Case Pack Canonical V1

Date: 2026-04-01

## Status

- Frozen for current recovery workstream
- Source artifact: [evaluation/cases/founder_served_case_pack_canonical_v1.json](evaluation/cases/founder_served_case_pack_canonical_v1.json)
- Verification owner: [scripts/founder-served-verification-canonical.mjs](scripts/founder-served-verification-canonical.mjs)

## Rule

Do not swap cases midstream.

The founder case pack changes only if founder explicitly approves a case-pack update.

## Pack composition

- Locked strong: `HV2_01`, `HV2_10`, `HV2_12`
- Weak rescue: `WK1_01`, `WK1_05`, `WK1_06`
- Ambiguous mixed-signal: `HV2_11`, `CT1_01`
- Founder regression: `HV2_01_TRUNC`, `FR1_CRAYONS`
- Production smoke: `HV2_01_PROD`

## FR1_CRAYONS provenance

- Frozen raw input source: [docs/engineering/PAGE_THREE_PIPELINE_ARCHITECTURE_AUDIT_SPEC_V1.md](docs/engineering/PAGE_THREE_PIPELINE_ARCHITECTURE_AUDIT_SPEC_V1.md#L624-L640)
- Frozen raw input lines:
  - "While helping in a preschool classroom, I kept organizing crayons and routines."
  - "I noticed one child sitting apart and sat beside her instead."
  - "That changed what I thought care looked like."

This case is now active, runnable, and required in every canonical founder served verification pass.
