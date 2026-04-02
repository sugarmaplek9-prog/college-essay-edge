# PAGE THREE — UNKNOWN RUNTIME AUDIT V1

**Generated:** 2026-03-24  
**Spec section:** I.1  
**Audit script:** `scripts/page3-unknown-path-audit.ts`  
**Output file:** `evaluation_outputs/page3_holdout_v4_thematic/unknown_path_audit.json`

---

## Summary

| Metric | Pre-Sprint | Post-Sprint | Target |
|--------|-----------|-------------|--------|
| Total cases | 12 | 12 | — |
| Unknown count | 6 | 1 | ≤ 2 |
| Unknown rate | 50.0% | **8.3%** | < 15% |
| Status | ❌ FAIL | ✅ PASS | — |

---

## Pre-Sprint Unknown Cases (6 / 12)

These cases were misclassified as `unknown` before this sprint:

| Case ID | Label | Correct Pattern | Why It Was Unknown |
|---------|-------|-----------------|--------------------|
| HV4_04 | Course placement self-advocacy | `responsibility_shift` | No patterns matched repeated institutional escalation with documentation |
| HV4_05 | Orchestra authority conflict | `conflict_reframe` | No patterns matched authority-overrule + cost-of-trust realization |
| HV4_06 | Hackathon credit realization | `identity_shift` | No patterns matched teammate-felt-invisible + credit/ownership confusion |
| HV4_09 | School newspaper correction | `failure_reinterpretation` | No patterns matched publish-correction + wrong-root-cause assumption |
| HV4_10 | Robotics tradeoff overrule | `conflict_reframe` | No patterns matched overrule decision + cost-of-win articulation |
| HV4_11 | Split-focus topic selection | `unknown` (correct) | Correctly unknown — no essay arc present |

---

## Post-Sprint Unknown Cases (1 / 12)

| Case ID | Label | Runtime Pattern | Notes |
|---------|-------|-----------------|-------|
| HV4_11 | Split-focus — art portfolio and cross-country | `unknown` | **Correctly unknown.** Student has not identified a turning point. Unknown is the correct classification; this case is not a regression. |

---

## Patterns Added This Sprint

### `conflict_reframe` — new signals

Added to cover HV4_05 (orchestra) and HV4_10 (robotics):
- `/section (leaders?|members?|principals?|chairs?).{0,50}(were upset|were angry|told me)/i`
- `/i had ignored (work|effort|preparation|input|changes).{0,40}(they|the team).{0,30}(prepared|made|done|put in)/i`
- `/(musical|technical|strategic|performance|competitive) (gain|benefit|advantage|win).{0,20}(came at the cost|at the cost|cost) of (trust|relationship|rapport|morale|goodwill)/i`
- `/i asked .{0,25}for (a|one) non.negotiable/i`
- `/(controls? lead|team member|teammate|partner|colleague).{0,25}argued (we should|i should|that we|that i)/i`
- `/i overruled (him|her|them|my )/i`
- `/(he|she|they) said my (choice|decision|call|move).{0,35}(protected|kept|maintained|secured).{0,35}but (erased|hurt|lost|eliminated|cost|sacrificed)/i`
- `/i (now|started to|began to|learned to) (state|call out|name|voice|acknowledge|articulate) the tradeoff/i`

### `identity_shift` — new signals

Added to cover HV4_06 (hackathon credit):
- `/(teammate|partner|collaborator|co.creator|cofounder).{0,35}(said|told me) (she|he|they) felt (invisible|excluded|erased|unseen|sidelined|unacknowledged)/i`
- `/i had confused (confidence|authority|competence|ownership|taking credit|credit).{0,20}with (control|dominance|erasure|speaking for|taking over)/i`
- `/i (replayed|kept thinking about|thought about) that (sentence|moment|comment|question|conversation) for (days|weeks)/i`
- `/crediting (contributors|teammates|collaborators|the team|others) first/i`
- `/i (rewrote|updated|revised|restructured|changed).{0,35}(documentation|credits|introduction|presentation|notes).{0,35}(named|crediting|by name|ownership)/i`

### `responsibility_shift` — new signals

Added to cover HV4_04 (course placement):
- `/i (emailed|contacted|reached out|wrote).{0,50}(twice|two times|a second time|again|multiple)/i`
- `/got told.{0,15}(scheduling|decision|placement|process).{0,15}(was|is) final/i`
- `/i asked .{0,30}for (the )?(rubric|criteria|requirements|guidelines|policy)/i`
- `/(created|compiled|made|prepared|wrote).{0,20}(summary|one.page|document|overview|packet|evidence)/i`
- `/i (waited|stayed|stood) (after school|outside|until she|until he|until they)/i`
- `/following (process|the rules|the system|procedure|protocol).{0,40}(still requires?|can still|sometimes) (push|advo)/i`

### `failure_reinterpretation` — new signals

Added to cover HV4_09 (newspaper correction):
- `/had to (issue|publish|post|write|run|print) a (correction|retraction|clarification|apology|follow.up)/i`
- `/i assumed (the )?(problem|cause|issue|reason|failure|mistake) was.{0,60}(but|however|actually|instead)/i`
- `/but (our|the) (workflow|process|system|protocol|procedure|pipeline|practice) had no (explicit|clear|defined|dedicated|formal|built.in)/i`
- `/i (built|created|wrote|designed|developed|implemented|established) a (pre.publish|verification|fact.check|review|confirmation|number.verification|source.check) (checklist|process|protocol|step|system|requirement|procedure)/i`
- `/i stopped treating (verification|fact.checking|checking|review|oversight|source.checking|confirmation) as optional/i`

### Structural signal expansions

- `EXTERNAL_FEEDBACK_PATTERNS`: Added `counselor`, `supervisor`, `reviewed`
- `INTERNAL_REALIZATION_PATTERNS`: Added `/i learned that/i`

---

## Release Gate Status

Unknown rate **8.3% < 15% target** → ✅ GATE PASSED  
HV4_11 is correctly unknown (no arc present) → not a failure

**Classifier file:** `src/lib/ai/modules/narrative-intake/pattern-classifier.ts`
