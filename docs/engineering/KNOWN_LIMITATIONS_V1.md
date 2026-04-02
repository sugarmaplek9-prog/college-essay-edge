# KNOWN_LIMITATIONS_V1

## The College Admissions Edge

## v1 Product and Operational Limitations

## 1. Purpose

This document defines the official known limitations of v1.

It exists to ensure that:

* product does not overpromise
* support does not promise behavior the system does not have
* engineering does not accidentally treat v1 limitations as bugs
* operations and launch communications stay accurate
* future releases can clearly distinguish between defects and intentional constraints

This document is not a defect list.
It is not a roadmap.
It is the explicit record of what v1 intentionally does not do, does only partially, or does with known constraints.

---

## 2. How to use this document

Use this document when:

* writing product copy
* answering support questions
* training internal operators
* evaluating whether a reported issue is a bug or a known limitation
* preparing launch or post-launch communications
* deciding what belongs in later releases

If a user expectation conflicts with this document, the team should not improvise a promise. The team should explain the limitation clearly and accurately.

---

## 3. Classification model

Each limitation should be understood as one of the following:

### Intentional v1 scope limitation

A capability intentionally not included in v1.

### Partial implementation limitation

A capability that exists in v1, but with deliberately limited depth or breadth.

### Data limitation

A limitation caused by data coverage, verification, or source quality.

### UX/interaction limitation

A limitation in how the product behaves or what interaction patterns are supported.

### Operational limitation

A limitation in admin/support/notification/process maturity.

---

## 4. Product positioning limitations

## 4.1 Not a ghostwriting tool

### Limitation type

Intentional v1 scope limitation

### Description

The product does not write final admissions essays on behalf of the student as a ghostwriter.

### What this means in practice

* AI guidance is structured and assistive
* the product helps students discover themes, directions, outlines, and revisions
* the student is expected to remain the author

### What support/product must not promise

* “The app writes your final essay for you.”
* “You can submit AI-produced content directly.”

---

## 4.2 Not a luxury counseling replacement in full scope

### Limitation type

Intentional v1 scope limitation

### Description

The product is a structured admissions platform, not a full-service one-on-one admissions consultancy.

### What this means in practice

* no live private counselor workflow in v1
* no hand-held end-to-end human advising process inside product
* no human editor marketplace built into v1

### What support/product must not promise

* unlimited individualized admissions strategy from human experts
* direct application management by staff

---

## 4.3 Not a full Common App integration product

### Limitation type

Intentional v1 scope limitation

### Description

v1 is not directly integrated with a user’s Common App account.

### What this means in practice

* no automatic sync of Common App account data
* no direct import/export of active applications from Common App user account
* no official submission flow through third-party admissions platforms

### What support/product must not promise

* automatic pulling of student Common App account details
* direct submission into college application platforms

---

## 5. Student workflow limitations

## 5.1 One guided writing workflow at a time, not full collaborative editing

### Limitation type

Intentional v1 scope limitation

### Description

The product supports structured individual writing workflows, not real-time multi-user collaborative editing.

### What this means in practice

* no Google Docs–style live co-authoring
* no simultaneous multi-user editing
* no in-line comments from parents/counselors inside drafts

---

## 5.2 No advanced rich-text editing suite

### Limitation type

Intentional v1 scope limitation

### Description

The writing experience in v1 is intentionally simple and stable, not a full publishing editor.

### What this means in practice

* basic drafting and revision support only
* no complex formatting system
* no advanced layout or export formatting controls

### What support/product must not promise

* Word/Docs-level formatting capabilities
* advanced revision markup systems

---

## 5.3 Personal statement and supplements are supported, but broader admissions artifacts are not

### Limitation type

Intentional v1 scope limitation

### Description

v1 focuses on the core writing surfaces it was designed to support.

### What this means in practice

* no interview prep workflows in v1
* no scholarship essay system beyond what users adapt manually
* no transfer or graduate admissions workflows
* no resume builder or portfolio submission tooling in v1

---

## 5.4 Story Vault is student-owned and non-collaborative in v1

### Limitation type

Intentional v1 scope limitation

### Description

Story Vault exists for the student’s internal use, not as a family-shared editing workspace.

### What this means in practice

* supporting adults do not read raw story entries in v1
* no shared annotation layer exists in Story Vault

---

## 6. Supporting-adult limitations

## 6.1 Supporting adults cannot edit student writing in v1

### Limitation type

Intentional v1 scope limitation

### Description

Supporting adults may view progress and deadlines, but they do not directly edit student-authored writing within the app.

### What this means in practice

* no parent editing of personal statement drafts
* no parent editing of supplement drafts
* no parent access to raw Story Vault entries

### What support/product must not promise

* “Parents can go in and rewrite or mark up the essay in the platform.”

---

## 6.2 Supporting-adult visibility is summary-based

### Limitation type

Intentional v1 scope limitation

### Description

The supporting-adult experience is intentionally summary-oriented.

### What this means in practice

* visibility into progress, milestones, and deadlines
* no raw draft review experience
* no deep editorial or commenting surface

---

## 6.3 Supporting-adult behavior depends on explicit linking

### Limitation type

Partial implementation limitation

### Description

Supporting-adult access is based on a deliberate account-link relationship.

### What this means in practice

* no implicit family discovery or automatic relationship inference
* unlinked adults cannot view student data
* link flow must complete successfully first

---

## 7. School and deadline limitations

## 7.1 School data is broad, but not guaranteed perfect for every institution at all times

### Limitation type

Data limitation

### Description

The system is designed to provide broad institution coverage, but institutional and deadline data may not always be fully complete or perfectly current for every school.

### What this means in practice

* some records may be partial
* some deadline records may require source verification
* fallback UX may indicate partial confidence or “see source/website” states

### What support/product must not promise

* every date for every school is always fully verified in real time

---

## 7.2 Deadline confidence varies by source quality and freshness

### Limitation type

Data limitation

### Description

Deadline data in v1 includes confidence states because not all source data is equally complete or recently verified.

### What this means in practice

* verified, source_partial, and stale states may exist
* users may occasionally need to confirm directly with school source information

---

## 7.3 No automatic synchronization with live third-party admissions portals

### Limitation type

Intentional v1 scope limitation

### Description

The school planner is an internal planning system, not a live sync with external application portals.

### What this means in practice

* application status updates are user-managed within the app
* deadlines are displayed based on internal data and source ingestion, not account-level live sync

---

## 7.4 School planner is structured, but not a submission engine

### Limitation type

Intentional v1 scope limitation

### Description

The school planner helps organize work but does not submit applications.

### What this means in practice

* no application submission through the platform
* no official school-side status tracking integrations in v1

---

## 8. AI limitations

## 8.1 AI guidance is structured, not omniscient

### Limitation type

Intentional/technical limitation

### Description

The AI is designed to guide, not to act as a perfect admissions oracle.

### What this means in practice

* it provides structured recommendations and critique
* it can surface strong directions and weak spots
* it does not guarantee optimal narrative strategy in every case

### What support/product must not promise

* guaranteed “best” topic selection
* guaranteed admissions outcomes
* perfect understanding of every institutional preference

---

## 8.2 AI output quality depends on student input quality

### Limitation type

Practical limitation

### Description

The product’s outputs depend heavily on the quality, honesty, and depth of the student’s responses and draft material.

### What this means in practice

* weak or shallow onboarding answers may yield weaker guidance
* vague drafts may produce less specific feedback

---

## 8.3 AI feedback is structured and bounded, not infinite freeform tutoring

### Limitation type

Intentional v1 scope limitation

### Description

AI feedback is intentionally delivered in productized structures, not as unlimited open-ended tutoring.

### What this means in practice

* users should expect guided outputs, not endless conversational advising
* workflows are optimized around product steps and modules

---

## 8.4 AI may require retries or fallback handling when generation fails

### Limitation type

Operational/technical limitation

### Description

As with any AI-assisted system, model or orchestration failures may occur and are handled through explicit failure states and retry paths.

### What this means in practice

* generation is not guaranteed to succeed instantly every time
* the UI may show retry states for snapshot, outline, feedback, or suggestion generation

---

## 9. Billing and account limitations

## 9.1 Billing ownership matters in v1

### Limitation type

Intentional scope/permissions limitation

### Description

The user who owns the billing relationship is the one with billing controls.

### What this means in practice

* linked non-owners may not see billing portal access
* supporting adults may have visibility differences depending on ownership model

---

## 9.2 Subscription status may affect premium access with explicit states

### Limitation type

Operational limitation

### Description

Premium access is tied to subscription state and may reflect statuses like active, trialing, past_due, canceled, or unpaid according to system rules.

### What this means in practice

* support should not overpromise uninterrupted premium access when subscription state is invalid
* some account questions require billing-state diagnosis

---

## 10. Notification and reminder limitations

## 10.1 Reminder systems are helpful, but not a substitute for user responsibility

### Limitation type

Intentional limitation

### Description

Reminders support the process, but they are not a contractual guarantee that every user action will always occur on time without user attention.

### What this means in practice

* users remain responsible for verifying deadlines and progress
* reminders should not be described as infallible or sole deadline protection

---

## 10.2 Notification behavior respects preference and eligibility logic

### Limitation type

Operational limitation

### Description

Not every event will necessarily notify every linked user.

### What this means in practice

* supporting-adult notifications depend on preferences and role boundaries
* duplicate-send prevention may intentionally suppress repeated sends

---

## 11. Admin and support limitations

## 11.1 Admin tooling is operational, not a full enterprise back office

### Limitation type

Intentional v1 scope limitation

### Description

Admin/support surfaces in v1 are built for practical operations, not large-scale enterprise administration.

### What this means in practice

* useful diagnostics and correction tools exist
* but not full CRM/case-management or advanced workflow orchestration

---

## 11.2 Some support resolutions may still require engineering involvement

### Limitation type

Operational limitation

### Description

Not every issue will be fully resolvable from admin UI alone.

### What this means in practice

* deeper data, billing, or platform anomalies may still require engineering or provider-level inspection

---

## 12. Performance and scale limitations

## 12.1 v1 is built for disciplined early scale, not infinite scale assumptions

### Limitation type

Operational/engineering limitation

### Description

The architecture is built cleanly for early growth, but v1 should not be described as having arbitrary enterprise-scale guarantees.

### What this means in practice

* the product is designed to scale sensibly, but not marketed as unlimited or hardened for every extreme edge case on day one

---

## 12.2 Some asynchronous workflows may involve visible generation states

### Limitation type

UX/technical limitation

### Description

AI and data-driven workflows may take time and show loading or generating states.

### What this means in practice

* some responses are not instant
* users may encounter explicit “in progress” states for certain modules

---

## 13. Mobile and platform limitations

## 13.1 v1 is a web application, not a native mobile app

### Limitation type

Intentional v1 scope limitation

### Description

The product is built as a responsive web app.

### What this means in practice

* no iOS or Android native app in v1
* mobile use is supported through responsive web experience

---

## 13.2 Browser/device behavior may vary slightly within responsive limits

### Limitation type

Practical limitation

### Description

The product is designed responsively, but users may experience some variance by browser, device size, or input mode.

### What this means in practice

* support should avoid overpromising perfect identical behavior across every environment

---

## 14. Support and communication limitations

## 14.1 Support must not reinterpret limitations as hidden functionality

### Limitation type

Operational limitation

### Description

If the product does not do something in v1, support must not imply that it exists “somewhere in the app.”

### What this means in practice

* support answers should remain factual
* known limitations should be acknowledged directly

---

## 14.2 Users should be told when the system is summary-based rather than exhaustive

### Limitation type

Communication limitation

### Description

When the product is intentionally summary-driven, communication must reflect that clearly.

### What this means in practice

* parent/supporting-adult dashboards should be described as visibility tools, not full authoring surfaces
* school/deadline data should be described with appropriate confidence language where relevant

---

## 15. Known limitations summary table

| ID     | Limitation                                                          | Type              | User Impact                | Internal Guidance                               |
| ------ | ------------------------------------------------------------------- | ----------------- | -------------------------- | ----------------------------------------------- |
| KL-001 | No ghostwriting                                                     | Intentional scope | Medium expectation-setting | Never promise done-for-you essays               |
| KL-002 | No live Common App sync                                             | Intentional scope | Medium                     | Position planner as internal workflow           |
| KL-003 | Supporting adults cannot edit writing                               | Intentional scope | High expectation-setting   | Reinforce student-first authorship              |
| KL-004 | Deadline coverage may be partial/stale for some schools             | Data              | Medium to High             | Use confidence language and source transparency |
| KL-005 | AI quality depends on user input quality                            | Practical         | Medium                     | Encourage better student inputs                 |
| KL-006 | No native mobile app in v1                                          | Intentional scope | Low to Medium              | Position responsive web clearly                 |
| KL-007 | Admin/support tools are practical, not enterprise CRM-grade         | Intentional scope | Low internal               | Set internal expectations appropriately         |
| KL-008 | Some support cases still require engineering/provider investigation | Operational       | Medium internal            | Do not overpromise instant support resolution   |

---

## 16. How to use known limitations in support responses

When responding to a user about a limitation:

1. acknowledge the question directly
2. explain the current v1 behavior clearly
3. avoid defensive language
4. do not invent a workaround if one does not exist
5. point to the supported path if one exists

### Example pattern

“Right now, v1 supports X, but it does not yet support Y. The current supported workflow is Z.”

---

## 17. Review cadence

This document should be reviewed:

* before launch
* after launch if user expectations diverge from product reality
* before major product messaging changes
* before v1.0.1 or v1.1 scope discussions

---

## 18. Non-negotiables

1. Do not overpromise beyond what v1 actually does.
2. Do not treat intentional limitations as hidden bugs.
3. Do not let support imply unavailable features exist.
4. Do not describe data quality as perfect when it is not.
5. Do not blur the line between AI guidance and student authorship.

---

## 19. Final directive

This document is the trust boundary for v1.

It defines what the team should say honestly about the product’s limits.
That honesty protects:

* user trust
* support clarity
* engineering focus
* release discipline

If a capability is not clearly supported in v1, no one should imply that it is.

---

## 20. Recommended next artifacts

Create next:

* `V1_0_1_RELEASE_NOTES.md`
* `WEEK_1_METRICS_REVIEW_V1.md`
* `POSTMORTEM_TEMPLATE_V1.md`
* `SUPPORT_RESPONSE_GUIDELINES_V1.md`
