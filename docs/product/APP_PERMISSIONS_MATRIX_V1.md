# APP_PERMISSIONS_MATRIX_V1

## The College Admissions Edge

## 1. Purpose

This document defines the authoritative permissions matrix for v1.

It exists to ensure that:

* product behavior is consistent
* UI gating is consistent
* API authorization is consistent
* database access rules are consistent
* free vs paid entitlements are enforced consistently

This is the reference for:

* engineering
* product
* QA
* security review

If this document conflicts with a UI assumption or implementation shortcut, this document wins.

---

## 2. Role model

### 2.1 System roles

The application supports three top-level roles:

* `student`
* `supporting_adult`
* `admin`

### 2.2 Supporting adult subtypes

Supporting adult may be one of:

* `parent`
* `guardian`
* `counselor`
* `family_member`
* `other`

Supporting-adult subtype does **not** create different technical permissions in v1 unless explicitly stated.

---

## 3. Commercial access model

### 3.1 Free plan

Free users can access:

* signup and login
* role selection
* onboarding
* Edge Snapshot
* limited school additions
* limited saved snapshot state

Free users cannot access:

* full Story Vault
* personal statement workspace
* supplements workspace
* full school planner behavior
* parent dashboard
* premium reminders
* premium progress persistence

### 3.2 Paid plan

Paid users can access:

* full Story Vault
* personal statement workspace
* supplements workspace
* full school planner
* parent dashboard
* premium reminders
* premium progress features

### 3.3 Entitlement enforcement rule

Entitlements must be enforced:

1. in UI
2. in server handlers
3. in data access logic

UI-only gating is not sufficient.

---

## 4. Permission principles

### 4.1 Student ownership

Student-authored content belongs to the student.

### 4.2 Supporting-adult visibility is explicit, not assumed

A supporting adult may only view student data when a valid `student_support_link` exists.

### 4.3 Supporting adults are read-only for writing content in v1

Supporting adults may view progress and planning information, but may not edit student writing.

### 4.4 Admin override exists, but admin is internal only

Admin may read and manage system records as required for operations.

### 4.5 Free vs paid is separate from role

A student may be free or paid.
A supporting adult may be free or paid through linked account access.
Permissions depend on both role and entitlement.

---

## 5. Access definitions

For the matrix below:

* **View** = read access
* **Create** = insert access
* **Edit** = update access
* **Delete** = delete or soft-delete access
* **Use** = execute workflow / interact meaningfully
* **No** = not allowed
* **Limited** = allowed with free-plan restrictions
* **Linked only** = only if explicit student/supporting-adult relationship exists

---

## 6. Page-level permissions matrix

| Surface / Page     | Free Student | Paid Student | Free Supporting Adult |    Paid Supporting Adult |       Admin |
| ------------------ | -----------: | -----------: | --------------------: | -----------------------: | ----------: |
| Homepage           |         View |         View |                  View |                     View |        View |
| How It Works       |         View |         View |                  View |                     View |        View |
| Pricing            |         View |         View |                  View |                     View |        View |
| FAQ                |         View |         View |                  View |                     View |        View |
| About              |         View |         View |                  View |                     View |        View |
| Signup             |          Use |          Use |                   Use |                      Use |         Use |
| Login              |          Use |          Use |                   Use |                      Use |         Use |
| Role Select        |          Use |          Use |                   Use |                      Use |         Use |
| Student Onboarding |          Use |          Use |                    No |                       No | View/Assist |
| Parent Onboarding  |           No |           No |                   Use |                      Use | View/Assist |
| Edge Snapshot      |         View |         View |             No direct |                No direct |        View |
| Upgrade Page       |         View |         View |                  View |                     View |        View |
| Checkout           |          Use |          Use |                   Use |                      Use |   View/Test |
| Student Dashboard  |      Limited |         View |                    No |                       No |        View |
| Story Vault        |           No |          Use |                    No |                       No |        View |
| Personal Statement |           No |          Use |                    No |                       No |        View |
| Supplements        |           No |          Use |                    No |                       No |        View |
| School List        |      Limited |          Use |             No direct | Linked read summary only |        View |
| Progress Page      |      Limited |         View |             No direct | Linked read summary only |        View |
| Parent Dashboard   |           No |    No direct |                    No |        Use (Linked only) |        View |
| Parent Deadlines   |           No |    No direct |                    No |        Use (Linked only) |        View |
| Settings           |          Use |          Use |                   Use |                      Use |         Use |
| Admin Pages        |           No |           No |                    No |                       No |         Use |

---

## 7. Domain-level permissions matrix

## 7.1 User profile domain

| Action                            | Student | Supporting Adult | Admin |
| --------------------------------- | ------: | ---------------: | ----: |
| View own user profile             |     Yes |              Yes |   Yes |
| Edit own user profile             |     Yes |              Yes |   Yes |
| View another user profile         |      No |               No |   Yes |
| Change own top-level role         |      No |               No |   Yes |
| Delete own user profile in app UI |   No v1 |            No v1 |   Yes |

### Notes

* Users may view and update their own name/email-level profile data, subject to auth rules.
* Top-level role changes are admin-only.

---

## 7.2 Student profile domain

| Action                     | Free Student | Paid Student | Supporting Adult | Admin |
| -------------------------- | -----------: | -----------: | ---------------: | ----: |
| View own student profile   |          Yes |          Yes | Linked read only |   Yes |
| Create own student profile |          Yes |          Yes |               No |   Yes |
| Edit own student profile   |          Yes |          Yes |               No |   Yes |
| Delete own student profile |        No v1 |        No v1 |               No |   Yes |

### Notes

* Supporting adults may only view student profile if linked.
* Supporting adults may not edit student profile in v1.

---

## 7.3 Supporting adult profile domain

| Action                               |                             Student | Supporting Adult | Admin |
| ------------------------------------ | ----------------------------------: | ---------------: | ----: |
| View own supporting-adult profile    |                                  No |              Yes |   Yes |
| Create own supporting-adult profile  |                                  No |              Yes |   Yes |
| Edit own supporting-adult profile    |                                  No |              Yes |   Yes |
| View linked supporting-adult profile | Limited (relationship context only) |               No |   Yes |
| Delete own supporting-adult profile  |                               No v1 |            No v1 |   Yes |

### Notes

* Students may only access minimal relationship context where necessary.
* Full supporting-adult profile access is not part of student-facing v1 UX.

---

## 7.4 Student/support link domain

| Action                           | Student | Supporting Adult | Admin |
| -------------------------------- | ------: | ---------------: | ----: |
| View own links                   |     Yes |              Yes |   Yes |
| Create link involving self       |     Yes |              Yes |   Yes |
| Remove link involving self       |     Yes |              Yes |   Yes |
| Create link between other people |      No |               No |   Yes |
| View all links                   |      No |               No |   Yes |

### Notes

* A student may invite a supporting adult.
* A supporting adult may accept and create a valid link involving themselves.
* No user may create arbitrary links between unrelated accounts.

---

## 7.5 Onboarding domain

| Action                                   | Free Student | Paid Student | Free Supporting Adult | Paid Supporting Adult | Admin |
| ---------------------------------------- | -----------: | -----------: | --------------------: | --------------------: | ----: |
| Start onboarding                         |          Yes |          Yes |                   Yes |                   Yes |   Yes |
| Save onboarding progress                 |          Yes |          Yes |                   Yes |                   Yes |   Yes |
| Resume own onboarding                    |          Yes |          Yes |                   Yes |                   Yes |   Yes |
| Complete onboarding                      |          Yes |          Yes |                   Yes |                   Yes |   Yes |
| View another user’s onboarding responses |           No |           No |                    No |                    No |   Yes |

### Notes

* Supporting adults do not see student onboarding responses unless surfaced through linked dashboards at a summarized level.

---

## 7.6 Edge Snapshot domain

| Action                                                   | Free Student | Paid Student |            Supporting Adult | Admin |
| -------------------------------------------------------- | -----------: | -----------: | --------------------------: | ----: |
| Generate own snapshot                                    |          Yes |          Yes |                          No |   Yes |
| View own snapshot                                        |          Yes |          Yes |                   No direct |   Yes |
| Regenerate own snapshot                                  |      Limited |          Yes |                          No |   Yes |
| View linked student snapshot raw content                 |           No |           No |                          No |   Yes |
| View summarized snapshot output through parent dashboard |           No |           No | Limited, if product chooses |   Yes |

### Notes

* In v1, raw snapshot content is student-facing.
* Supporting-adult-facing experience should emphasize progress, not raw writing analysis.

---

## 7.7 Story Vault domain

| Action                                            | Free Student | Paid Student |      Supporting Adult | Admin |
| ------------------------------------------------- | -----------: | -----------: | --------------------: | ----: |
| View Story Vault                                  |           No |          Yes |                    No |   Yes |
| Create story entry                                |           No |          Yes |                    No |   Yes |
| Edit story entry                                  |           No |          Yes |                    No |   Yes |
| Delete story entry                                |           No |          Yes |                    No |   Yes |
| Analyze story set                                 |           No |          Yes |                    No |   Yes |
| View story titles/count only via parent dashboard |           No |           No | Optional summary only |   Yes |

### Notes

* Story Vault is student-owned content.
* Supporting adults may not view or edit raw story content in v1.

---

## 7.8 Personal statement domain

| Action                                 | Free Student | Paid Student | Supporting Adult | Admin |
| -------------------------------------- | -----------: | -----------: | ---------------: | ----: |
| View personal statement workspace      |           No |          Yes |               No |   Yes |
| Create essay project                   |           No |          Yes |               No |   Yes |
| Edit essay draft                       |           No |          Yes |               No |   Yes |
| Request AI feedback                    |           No |          Yes |               No |   Yes |
| View essay feedback                    |           No |          Yes |               No |   Yes |
| View version history                   |           No |          Yes |               No |   Yes |
| Edit student essay as supporting adult |           No |           No |               No |    No |

### Notes

* This is a hard boundary.
* Supporting adults do not edit writing content in v1.

---

## 7.9 Supplements domain

| Action                     | Free Student | Paid Student | Supporting Adult | Admin |
| -------------------------- | -----------: | -----------: | ---------------: | ----: |
| View supplements workspace |           No |          Yes |               No |   Yes |
| Create supplement          |           No |          Yes |               No |   Yes |
| Edit supplement            |           No |          Yes |               No |   Yes |
| Request AI suggestions     |           No |          Yes |               No |   Yes |
| View overlap warnings      |           No |          Yes |               No |   Yes |
| Delete supplement          |           No |          Yes |               No |   Yes |

### Notes

* Supplements follow the same ownership rules as essays.

---

## 7.10 School planner domain

| Action                                  | Free Student | Paid Student |             Supporting Adult | Admin |
| --------------------------------------- | -----------: | -----------: | ---------------------------: | ----: |
| Search institutions                     |          Yes |          Yes | Yes if linked context needed |   Yes |
| View institution details                |          Yes |          Yes |                          Yes |   Yes |
| Add school to student list              |      Limited |          Yes |                           No |   Yes |
| Edit school application type/status     |      Limited |          Yes |                           No |   Yes |
| Edit school notes                       |      Limited |          Yes |                           No |   Yes |
| View linked student school list summary |           No |    No direct |             Yes, linked only |   Yes |
| Delete school from student list         |      Limited |          Yes |                           No |   Yes |

### Notes

* Free plan may allow limited number of added schools.
* Supporting adults may view planning summary if linked, but may not modify the student's school list in v1.

---

## 7.11 Institution and deadline master data domain

| Action                        | Student | Supporting Adult | Admin |
| ----------------------------- | ------: | ---------------: | ----: |
| Search institutions           |     Yes |              Yes |   Yes |
| View institution records      |     Yes |              Yes |   Yes |
| View deadline records         |     Yes |              Yes |   Yes |
| Create institution record     |      No |               No |   Yes |
| Update institution record     |      No |               No |   Yes |
| Delete institution record     |      No |               No |   Yes |
| Create/update deadline record |      No |               No |   Yes |

### Notes

* Institution and deadline master data are system-managed.
* End users do not directly edit the master dataset in v1.

---

## 7.12 Parent dashboard domain

| Action                        |           Student |        Supporting Adult | Admin |
| ----------------------------- | ----------------: | ----------------------: | ----: |
| View parent dashboard         |         No direct | Yes, if paid and linked |   Yes |
| View student progress summary |         No direct |        Yes, linked only |   Yes |
| View milestone completion     |         No direct |        Yes, linked only |   Yes |
| View upcoming deadlines       |         No direct |        Yes, linked only |   Yes |
| View billing summary          | Limited, if owner |           Yes, if owner |   Yes |
| View raw essay content        |                No |                      No |   Yes |

### Notes

* Parent dashboard is a summary and confidence surface.
* It is not a writing editor.

---

## 7.13 Notifications domain

| Action                                 | Student | Supporting Adult | Admin |
| -------------------------------------- | ------: | ---------------: | ----: |
| View own notifications                 |     Yes |              Yes |   Yes |
| Mark own notifications read            |     Yes |              Yes |   Yes |
| Trigger own invite flow                |     Yes |              Yes |   Yes |
| Send arbitrary notifications to others |      No |               No |   Yes |
| View all notification events           |      No |               No |   Yes |

---

## 7.14 Billing domain

| Action                              | Free Student | Paid Student | Free Supporting Adult | Paid Supporting Adult |      Admin |
| ----------------------------------- | -----------: | -----------: | --------------------: | --------------------: | ---------: |
| View own billing status             |          Yes |          Yes |                   Yes |                   Yes |        Yes |
| Start checkout                      |          Yes |          Yes |                   Yes |                   Yes |        Yes |
| Manage own billing portal           |     If owner |     If owner |              If owner |              If owner |        Yes |
| View another user’s billing records |           No |           No |                    No |                    No |        Yes |
| Update subscription state manually  |           No |           No |                    No |                    No | Yes/System |

### Notes

* Account ownership matters.
* Supporting adults should only see billing if they are the billing owner or product explicitly exposes shared account billing.
* This is one of the most sensitive domains and should remain narrow.

---

## 7.15 Audit domain

| Action                       | Student | Supporting Adult |      Admin |
| ---------------------------- | ------: | ---------------: | ---------: |
| View audit records           |      No |               No |        Yes |
| Create audit record manually |      No |               No | Yes/System |

---

## 8. Action-level permission rules

## 8.1 Student-specific actions

| Action                          | Free Student | Paid Student |
| ------------------------------- | -----------: | -----------: |
| Complete onboarding             |          Yes |          Yes |
| View Edge Snapshot              |          Yes |          Yes |
| Upgrade account                 |          Yes |          Yes |
| Invite supporting adult         |          Yes |          Yes |
| Add more than free school limit |           No |          Yes |
| Use Story Vault                 |           No |          Yes |
| Start personal statement        |           No |          Yes |
| Start supplements               |           No |          Yes |
| Receive premium reminders       |           No |          Yes |

---

## 8.2 Supporting-adult actions

| Action                               | Free Supporting Adult | Paid Supporting Adult |
| ------------------------------------ | --------------------: | --------------------: |
| Create supporting-adult account      |                   Yes |                   Yes |
| Link to student                      |                   Yes |                   Yes |
| View linked student progress summary |                    No |                   Yes |
| View linked student deadlines        |                    No |                   Yes |
| Edit linked student writing          |                    No |                    No |
| Edit linked student school list      |                    No |                    No |
| Manage billing if account owner      |                   Yes |                   Yes |

---

## 9. Page gating rules

## 9.1 Hard route gate pages

These routes must be protected at the routing layer and server layer:

* `/app/*`
* `/parent/*`
* `/admin/*`

## 9.2 Paid feature gates

These pages must enforce paid entitlements before meaningful use:

* `/app/story-vault`
* `/app/personal-statement`
* `/app/supplements`
* premium school planner interactions
* `/parent/*`

## 9.3 Admin-only routes

These routes must require admin role:

* `/admin`
* `/admin/users`
* `/admin/schools`
* `/admin/deadlines`
* `/admin/analytics`
* `/admin/support`

---

## 10. Data visibility matrix

## 10.1 Student-authored writing data

| Data Type                   | Student Owner | Linked Supporting Adult | Admin |
| --------------------------- | ------------: | ----------------------: | ----: |
| Story entries               |          Full |                      No |  Full |
| Personal statement draft    |          Full |                      No |  Full |
| Essay feedback              |          Full |                      No |  Full |
| Supplement drafts           |          Full |                      No |  Full |
| Supplement overlap warnings |          Full |                      No |  Full |

### Rule

Supporting adults do not access raw writing content in v1.

---

## 10.2 Student progress data

| Data Type                    | Student Owner | Linked Supporting Adult | Admin |
| ---------------------------- | ------------: | ----------------------: | ----: |
| Onboarding completion        |          Full |            Summary only |  Full |
| Snapshot completion state    |          Full |   Optional summary only |  Full |
| Story Vault completion count |          Full |            Summary only |  Full |
| Essay status                 |          Full |            Summary only |  Full |
| Supplement status            |          Full |            Summary only |  Full |
| School list status           |          Full |            Summary only |  Full |
| Deadlines                    |          Full |            Summary only |  Full |

---

## 10.3 Billing data

| Data Type                                | Billing Owner | Linked Non-owner | Admin |
| ---------------------------------------- | ------------: | ---------------: | ----: |
| Subscription status                      |          Full | Optional limited |  Full |
| Payment portal access                    |          Full |               No |  Full |
| Provider ids / internal billing metadata |         No UI |               No |  Full |

### Rule

Do not expose raw provider ids in UI.

---

## 11. API authorization rules

## 11.1 General rules

Every API handler must do all of the following:

1. verify authenticated session
2. resolve user role
3. resolve entitlement state if feature-gated
4. verify resource ownership or linked visibility
5. return explicit authorization failure when denied

## 11.2 Student resource rules

For resources with `student_user_id`:

* student owner may read/write unless feature-gated by plan
* linked supporting adult may read only where explicitly allowed by domain
* admin may read/write

## 11.3 Admin resource rules

Admin endpoints are never callable by non-admin roles.

---

## 12. RLS alignment rules

The following tables must align with this matrix exactly:

* `student_profiles`
* `supporting_adult_profiles`
* `student_support_links`
* `onboarding_sessions`
* `onboarding_responses`
* `snapshot_results`
* `story_entries`
* `essay_projects`
* `essay_versions`
* `essay_feedback`
* `student_school_lists`
* `supplement_projects`
* `subscriptions`
* `notification_events`
* `audit_events`

If product decisions change later, RLS must be updated with the same change.

---

## 13. QA permission test cases

QA must explicitly verify:

### Student

* free student cannot access Story Vault
* paid student can access Story Vault
* student cannot access another student's data
* student can edit own school list
* student can invite supporting adult

### Supporting adult

* unlinked supporting adult cannot view student dashboard
* linked paid supporting adult can view progress summary
* linked supporting adult cannot edit story entries
* linked supporting adult cannot edit essays
* linked supporting adult cannot alter school list in v1

### Admin

* admin can access admin routes
* admin can view support-linked records
* admin can modify institution/deadline records

### Billing

* non-owner cannot access payment portal
* paid entitlements unlock only after valid subscription state
* free entitlement leakage does not occur

---

## 14. Non-negotiable boundaries

1. Supporting adults do not edit student writing in v1.
2. Free users do not access paid writing workflows.
3. Institution and deadline master data are admin-managed only.
4. Student/support visibility requires explicit link record.
5. Admin override must exist, but admin surface must remain internal.
6. Server authorization and database authorization must match.

---

## 15. Final directive

This matrix is the authorization source of truth for v1.

Product copy, UI states, route guards, API handlers, database RLS, and QA test cases must all conform to it.

If any implementation layer diverges from this matrix, that is a defect.

---

## 16. Recommended next artifacts

Create next:

* `ROUTE_INVENTORY_V1.md`
* `COMPONENT_INVENTORY_V1.md`
* `SPRINT_01_TICKETS.md`
* `SPRINT_02_TICKETS.md`
* `QA_AUTHORIZATION_TEST_MATRIX_V1.md`