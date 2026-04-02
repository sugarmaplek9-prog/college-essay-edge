# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_ROLLBACK_CONDITIONS_V1

## Immediate rollback / pause triggers

Trigger immediate pause or rollback if any of the following occur after activation:

- meaningful trust regression in reviewed live cases
- broken route transitions from blank-page question flow
- repeated loop behavior beyond bounded second-question policy
- spike in `too_thin_to_recover` beyond expected validation envelope
- spike in abandonment beyond expected validation envelope
- telemetry outage on required blank-page lifecycle events
- route-audit debug trace outage or unusable records
- severe mismatch between rendered state and route state
- evidence of fake-forward promotion from unrecovered signal

## No-ship blockers (pre-release)

Do not ship if any are true:

- `npm run test:product:screen-trust` fails
- `npm run test:product:flow-break` fails
- `npm run test:product:session-state` fails
- `npm run test:product:real-user-sim` fails
- `npm run test:nds:evidence-grounding` fails
- `npm run test:nds:direction-line-fit` fails
- `npm run test:nds:direction-stability` fails
- `npm test` fails
- `npm run build` fails
- required telemetry events are missing/not analyzable
- required debug route audit is incomplete
- source composition real-input threshold fails for major pack
- required release review artifacts are missing

## Investigation-required triggers (pause unless cleared)

- route distribution implausibility by mode
- generic-question collapse in reviewed traces
- unexplained divergence between assignment counts and question-render counts
- unresolved anomalies in validation run output

## Decision path

- owner: engineering release reviewer
- recommendation states one of: `pass`, `pause`, `rollback`
- unresolved no-ship blockers force `pause` or `rollback`
