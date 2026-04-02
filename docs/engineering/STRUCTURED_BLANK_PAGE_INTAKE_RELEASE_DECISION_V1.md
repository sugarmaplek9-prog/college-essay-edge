# STRUCTURED_BLANK_PAGE_INTAKE_RELEASE_DECISION_V1

## Release decision

- final_decision: `release approved`
- decision_mode: `controlled rollout`
- release_id: `blank_page_phase6_rc2_2026-03-18`
- decision_date_utc: `2026-03-18`

## Rollout scope

Structured Blank-Page Intake lane is approved for controlled production rollout with guard-constrained activation:
- blank-page candidates remain classifier-driven
- activation requires rollout guard pass
- fallback remains available per guard configuration
- rollback triggers remain active during rollout window

## Active production env settings

- `BLANK_PAGE_ROLLOUT_ENABLED=true`
- `BLANK_PAGE_ROLLOUT_ALLOWED_MODES=topic_probe,theme_probe,activity_probe,scope_reframe,blank_page_discovery`
- `BLANK_PAGE_ROLLOUT_MIN_CONFIDENCE=medium`
- `BLANK_PAGE_ROLLOUT_ALLOWED_ENVS=production`

Reference snapshot:
- [.env.phase6.prod](.env.phase6.prod)

## Validation artifact references

- [Phase 6 validation run](docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_VALIDATION_RUN_V1.md)
- [Phase 6 release review packet](docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_RELEASE_REVIEW_PACKET_V1.md)
- [Phase 6 rollout note](docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_ROLLOUT_NOTE_V1.md)
- [Phase 6 rollback conditions](docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_ROLLBACK_CONDITIONS_V1.md)
- [Phase verification matrix](docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_VERIFICATION_MATRIX_V1.md)
- [Phase 5 observability review packet](docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_OBSERVABILITY_REVIEW_PACKET_V1.md)

## Smoke evidence references

- [Phase 6 live smoke](evaluation_outputs/blank_page_phase6_live_smoke_v1/phase6-live-smoke.json)
- [Phase 6 surface diff](evaluation_outputs/blank_page_phase6_surface_diff_v1/surface-diff.json)
- [Phase 6 release input validation](evaluation_outputs/blank_page_phase6_release_validation_v1/blank-page-phase6-release-input-validation.json)

## Rollback triggers (active)

Immediate pause/rollback if any occur:
- trust regression in reviewed live traces
- broken route transitions or submission path failures
- evidence of fake-forward promotion
- spike in `too_thin_to_recover`
- spike in abandonment
- telemetry/debug outage for blank-page lane
- severe UI/backend route mismatch

Canonical rollback policy:
- [Phase 6 rollback conditions](docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_ROLLBACK_CONDITIONS_V1.md)

## Approval statement

This release is approved under controlled-rollout conditions documented above. Any rollback trigger supersedes approval and requires immediate pause/rollback handling.
