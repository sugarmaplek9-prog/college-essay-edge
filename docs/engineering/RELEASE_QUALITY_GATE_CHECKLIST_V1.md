# RELEASE_QUALITY_GATE_CHECKLIST_V1
## The College Admissions Edge
### v1 Release Quality Gate Checklist

---

## 1. Purpose

This checklist defines the minimum conditions required for v1 release.

It exists to answer one question only:

> Are we actually ready to ship a paid product that feels clearly better than generic AI in the specific places that matter most?

This is not a broad launch checklist.
This is the quality gate for product truth.

If this checklist is not satisfied, the correct action is not optimism.
The correct action is to delay, tighten, or reduce scope.

---

## 2. Core Release Principle

v1 should only ship if the product already demonstrates real differentiated value in a small number of important workflow moments.

The goal is not:

- broad feature coverage
- maximum AI surface area
- theoretical extensibility
- “good enough” generic assistance

The goal is:

- sharp outputs
- authentic outputs
- student-specific outputs
- trustworthy outputs
- outputs that feel worth paying for

**Core release rule**

> Do not ship a broad system with weak differentiation. Ship a narrower system with real edge.

---

## 3. Release Gate Categories

v1 release readiness must be confirmed across seven categories:

- scope discipline
- module quality
- anti-generic protection
- authenticity protection
- benchmark performance
- operational review readiness
- post-launch learning readiness

All seven must be reviewed.

---

## 4. Scope Discipline Gate

### Required conditions

- v1 launch modules are explicitly locked
- non-launch modules are explicitly deferred
- manual review dependencies are understood
- no hidden feature creep exists inside launch modules
- every launch module has a bounded schema, validator, and fallback behavior
- product and engineering agree on what “done” means for each launch module

### Release decision rule

If the team cannot describe v1 scope in under 3 minutes, scope is not locked.

### Pass / fail

- `pass` — scope is clear and frozen
- `fail` — scope is still shifting or ambiguous

---

## 5. Module Quality Gate

Every launch module must pass its own quality bar.

### Required for each launch module

- module returns valid structured output
- output is stable across representative inputs
- output is meaningfully useful in its workflow stage
- fallback behavior works
- needs-more-input behavior works
- module-specific validator profile is active
- output is not dependent on raw model prose alone
- output feels like product behavior, not chatbot behavior

### Minimum launch modules recommended

- Edge Snapshot
- Story Vault Analysis
- Narrative Direction Selection
- Essay Feedback
- Supplement Angle Suggestion

### Optional or later

- Outline Generation as lighter v1 support
- Overlap Warning as v1.1 if needed

### Release decision rule

If even one core moat module still feels generic, the system is not launch-ready.

---

## 6. Anti-Generic Protection Gate

This is one of the most important release gates.

### Required conditions

- generic trait summaries are reliably rejected or reduced
- generic praise is not common in production candidates
- school-name insertion is not mistaken for school specificity
- direction selection does not flatten all options into equality
- essay feedback does not rely on broad writing-center language
- supplement angle suggestions do not read like generic why-school templates
- benchmark generic failure cases are clearly outperformed
- substitution-risk for core moat modules is not high by default

### Core anti-generic release questions

- Would a serious user say this feels like free AI with formatting?
- Are strong outputs actually unique to the student?
- Are weaker outputs being caught before they ship?
- Is the system making real choices instead of producing broad possibility lists?

### Release decision rule

If a user could reasonably describe the output as “basically ChatGPT,” release fails.

---

## 7. Authenticity Protection Gate

The system must help without taking over.

### Required conditions

- no core workflow depends on ghostwriting behavior
- essay feedback does not become rewrite behavior
- outline generation does not become disguised prose generation
- supplement support does not produce ready-to-submit answers
- authenticity-risk outputs are caught by validators or review
- low-quality drafts are handled through diagnosis, not replacement
- student-owned material remains the main anchor for outputs
- polished overreach is operationally visible

### Release decision rule

If the product helps by sounding better than the student instead of helping the student think better, release fails.

---

## 8. Benchmark Performance Gate

The system must perform credibly against the benchmark library.

### Required conditions

- all launch modules have benchmark coverage
- all core moat modules have both gold-standard and failure-case coverage
- benchmark cases were run against the actual current system
- benchmark review found no unresolved critical failure patterns
- generic failure examples are clearly distinguishable from strong outputs
- hard cases do not collapse into generic fallback behavior by default

### Minimum benchmark expectation

For each launch module:

- no catastrophic authenticity failure
- no repeated generic-failure pattern left unresolved
- at least acceptable performance on representative cases
- strong performance on at least some high-value cases

### Release decision rule

If benchmarks are theoretical rather than tested against live module outputs, release fails.

---

## 9. Operational Review Gate

The team must be able to inspect and improve quality after launch.

### Required conditions

- review workflow exists
- flagged outputs can be inspected
- benchmark candidate capture exists
- reviewers can label genericity, authenticity risk, and substitution risk
- false-pass outputs can be logged
- false-block outputs can be logged
- post-change review process exists
- one named owner is responsible for quality review operations

### Release decision rule

If the team cannot see and label the product’s failures after launch, release fails.

---

## 10. Learning-Readiness Gate

The product must be able to improve from use.

### Required conditions

- module execution metadata is stored
- prompt/schema/validator provenance is stored
- rubric-compatible labels can be captured
- benchmark candidates can be promoted from real cases
- user follow-through signals are captured where possible
- validator outcomes are stored
- retry and fallback outcomes are stored
- the system is not architected in a way that blocks future ranking/scoring models

### Release decision rule

If the system cannot learn from real usage without major rework, release should be reconsidered.

---

## 11. Minimum Paid-Value Gate

This is the most honest gate in the entire release process.

### Required question

Would a reasonable student or parent feel that the product delivers value clearly beyond what they could get from free AI?

### Strong evidence of paid value

- clearer decisions
- stronger story selection
- better revision prioritization
- stronger anti-overlap logic
- more student-specific outputs
- more trustworthy boundaries
- less fluff
- more strategic usefulness

### Release failure signals

- output feels broad and familiar
- output is too easy to imitate with a simple prompt
- output is polished but not decisive
- output sounds helpful but does not move the student forward
- output does not feel personal enough to justify payment

### Release decision rule

If the answer is “not yet” for core workflows, release fails.

---

## 12. Launch Blocker List

The following are automatic launch blockers:

- repeated ghostwriting drift in live candidate outputs
- repeated school-agnostic supplement behavior
- narrative direction outputs that routinely fail to choose
- essay feedback dominated by generic praise or broad commentary
- benchmark generic-failure cases not clearly outperformed
- core moat modules rated high substitution risk
- no operational review path
- no rollback or post-change quality visibility
- unclear v1 scope

---

## 13. Release Decision Classes

After running the checklist, one of four outcomes must be selected:

- `ship`
  - Core quality gates passed. Remaining issues are minor and visible.
- `ship_narrowed`
  - Release only with reduced scope or reduced module set.
- `delay_and_patch`
  - Quality issues are fixable but still too material to ignore.
- `do_not_ship`
  - The product is still too generic, too weak, or too uncontrolled.

---

## 14. Ownership

Release gate review should include at minimum:

- product owner
- engineering owner
- quality/review owner
- one person explicitly responsible for defending anti-generic standards

No release should proceed without named accountability.

---

## 15. Final Directive

The purpose of this checklist is to prevent the team from launching a broad, impressive-looking system that still feels replaceable.

v1 does not need to do everything.

It needs to do a few important things well enough that users feel:

- this understands me
- this is sharper than free AI
- this protects my voice
- this is worth paying for

That is the release bar.
