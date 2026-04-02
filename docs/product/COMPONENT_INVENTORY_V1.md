# COMPONENT_INVENTORY_V1

## The College Admissions Edge

## 1. Purpose

This document defines the authoritative UI component inventory for v1.

It exists to ensure that:

* the interface is built systematically
* components are reusable across routes
* ownership is clear
* state handling is clear
* engineering does not reinvent patterns page by page
* design, frontend, and QA work from the same UI map

This document covers:

* global layouts
* navigation
* design-system primitives
* shared workflow components
* route-level page compositions
* loading, empty, error, and upgrade-gate components
* admin and operational components

If implementation diverges from this document without a conscious product decision, that is a defect.

---

## 2. Component architecture principles

### 2.1 Build primitives first

All page components should be assembled from a stable set of reusable primitives.

### 2.2 Separate container from presentation

Components that fetch or orchestrate data should be separated from presentational UI where practical.

### 2.3 One pattern for each interaction type

Do not create multiple competing versions of:

* cards
* modals
* steppers
* progress bars
* empty states
* upgrade gates

### 2.4 Loading, empty, and error states are first-class

Every major module must have explicit states for:

* loading
* empty
* success
* failure
* gated/upgrade

### 2.5 Student UX and supporting-adult UX must feel related, not identical

The parent/supporting-adult experience should share design language with the student product, but not reuse student writing surfaces directly.

---

## 3. Component layers

The system is divided into five component layers:

1. **Design-system primitives**
2. **Shared layout and navigation components**
3. **Workflow and state components**
4. **Module components**
5. **Route composition components**

---

## 4. Design-system primitive inventory

These components must be built before route implementation begins.

## 4.1 Buttons

### Required variants

* primary
* secondary
* tertiary / ghost
* destructive
* link-style
* loading button state

### Required states

* default
* hover
* active
* disabled
* loading

### Usage areas

* CTAs
* form submission
* dashboard actions
* modal actions
* upgrade prompts

---

## 4.2 Text inputs

### Required variants

* single-line input
* email input
* password input
* search input
* numeric input if needed

### Required states

* default
* focused
* invalid
* disabled
* loading where relevant

---

## 4.3 Textarea

### Required usage

* onboarding open responses
* story entry body
* essay draft areas
* supplement draft areas
* notes fields

### Required features

* label
* helper text
* error state
* optional autosave indicator integration

---

## 4.4 Select and dropdown components

### Required components

* single select
* multi-select
* searchable combobox
* institution typeahead dropdown

### Usage areas

* grade selection
* academic profile selection
* relationship type
* application type
* school selection

---

## 4.5 Radio group

### Usage areas

* role selection
* onboarding multiple-choice questions
* plan selection

---

## 4.6 Checkbox group

### Usage areas

* interests
* activity categories
* optional preference selections

---

## 4.7 Toggle / switch

### Usage areas

* email opt-in
* reminder preferences
* notification settings

---

## 4.8 Labels and form messaging

### Required pieces

* field label
* helper text
* inline validation message
* success message

---

## 4.9 Cards

### Required variants

* standard content card
* dashboard summary card
* story card
* school card
* supplement card
* pricing card
* upgrade card

### Required states

* default
* interactive/selectable
* highlighted/recommended
* disabled/gated

---

## 4.10 Progress indicators

### Required components

* linear progress bar
* stepper progress indicator
* circular progress summary optional

### Usage areas

* onboarding
* dashboard progress
* parent summary
* writing workflow completion

---

## 4.11 Badges / chips / pills

### Usage areas

* status tags
* story strength labels
* supplement status
* deadline confidence
* plan labels
* prompt categories

---

## 4.12 Tabs

### Usage areas

* settings sections
* admin views
* page sub-sections where appropriate

---

## 4.13 Modals / dialogs

### Required modal types

* upgrade modal
* confirm delete modal
* invite parent modal
* plan confirmation modal
* error/retry dialog optional

---

## 4.14 Toast / inline alerts

### Usage areas

* save success
* save failure
* invite sent
* billing success/failure
* AI generation failure

---

## 4.15 Skeleton loaders

### Usage areas

* dashboard loading
* snapshot loading
* school search loading
* parent dashboard loading

---

## 4.16 Empty state blocks

### Usage areas

* no story entries
* no essay started
* no supplements created
* no schools added
* no linked student for supporting adult

---

## 4.17 Error state blocks

### Usage areas

* failed onboarding save
* failed snapshot generation
* failed essay feedback
* failed school lookup
* failed billing sync

---

## 4.18 Section headers

### Required structure

* title
* optional subtitle
* optional action
* optional status badge

---

## 5. Global layout components

## 5.1 MarketingLayout

### Purpose

Shared layout for public routes.

### Must include

* top navigation
* footer
* consistent content width system
* auth CTA area

### Used by

* homepage
* how-it-works
* pricing
* faq
* about

---

## 5.2 AuthLayout

### Purpose

Shared layout for login/signup/verification/reset.

### Must include

* centered auth shell
* brand header
* support copy zone
* minimal distraction

### Used by

* login
* signup
* verify-email
* reset-password
* role-select

---

## 5.3 StudentAppLayout

### Purpose

Shared authenticated layout for student routes.

### Must include

* authenticated top bar
* optional side navigation on desktop
* mobile navigation
* page header area
* content container
* support for status banners

### Used by

* `/app/*`

---

## 5.4 ParentAppLayout

### Purpose

Shared authenticated layout for supporting-adult routes.

### Must include

* supporting-adult nav
* summary-first design
* billing/settings access

### Used by

* `/parent/*`

---

## 5.5 AdminLayout

### Purpose

Shared internal operations layout.

### Must include

* admin nav
* denser data views
* status and audit visibility

### Used by

* `/admin/*`

---

## 6. Navigation components

## 6.1 MarketingTopNav

### Used by

MarketingLayout

### Required items

* logo / wordmark
* How It Works
* Pricing
* FAQ
* About
* Login
* Get Started CTA

---

## 6.2 AuthenticatedTopBar

### Used by

StudentAppLayout, ParentAppLayout

### Required items

* brand
* current user context
* settings access
* logout

---

## 6.3 StudentSideNav

### Required items

* Dashboard
* Snapshot
* Story Vault
* Personal Statement
* Supplements
* Schools
* Progress
* Settings

### Behavior

Premium items may show gated state when user is free.

---

## 6.4 ParentSideNav

### Required items

* Dashboard
* Progress
* Deadlines
* Settings

---

## 6.5 AdminSideNav

### Required items

* Overview
* Users
* Schools
* Deadlines
* Analytics
* Support

---

## 6.6 MobileNavSheet

### Purpose

Provide mobile navigation pattern for authenticated surfaces.

---

## 7. Shared workflow/state components

## 7.1 RouteGuardShell

### Purpose

Wrap protected route content with role/entitlement checks.

### States

* allowed
* unauthorized
* wrong role
* upgrade required
* loading

---

## 7.2 UpgradeGate

### Purpose

Reusable premium lock surface.

### Required content

* headline
* locked features summary
* value explanation
* upgrade CTA
* optionally return/back action

### Used by

* Story Vault
* personal statement
* supplements
* school planner limit breach
* supporting-adult dashboard access

---

## 7.3 SaveStateIndicator

### Purpose

Show autosave and persistence status.

### States

* saving
* saved
* failed

### Used by

* onboarding
* story entries
* writing workflows

---

## 7.4 LoadingStatePanel

### Purpose

Reusable async generation/loading state.

### Used by

* snapshot generation
* AI feedback generation
* supplement suggestion generation

---

## 7.5 ErrorStatePanel

### Purpose

Reusable recoverable error display.

### Required actions

* retry
* go back
* contact support optional

---

## 7.6 EmptyStatePanel

### Purpose

Reusable empty-state presentation.

### Required structure

* title
* brief explanation
* primary CTA
* optional secondary CTA

---

## 7.7 NextStepCard

### Purpose

Show most important recommended next action.

### Used by

* student dashboard
* parent dashboard
* progress page

---

## 7.8 ProgressSummaryCard

### Purpose

Show high-level completion status.

### Used by

* student dashboard
* parent dashboard
* progress page

---

## 7.9 MilestoneList

### Purpose

Show milestone completion sequence.

### Used by

* progress page
* parent dashboard

---

---

## 8. Marketing route components

## 8.1 HomepageHero

## 8.2 ProblemSection

## 8.3 HowItWorksSummarySection

## 8.4 DifferentiationSection

## 8.5 FounderStorySection

## 8.6 PricingTeaserSection

## 8.7 FAQPreviewSection

## 8.8 MarketingFooter

### Notes

These are route-specific composition components, not general-purpose app modules.

---

## 9. Auth route components

## 9.1 SignupForm

### Required fields

* first name
* last name
* email
* password

### States

* idle
* submitting
* validation error
* success

---

## 9.2 LoginForm

### Required fields

* email
* password

### States

* idle
* submitting
* invalid credentials

---

## 9.3 ResetPasswordForm

## 9.4 VerifyEmailPanel

## 9.5 RoleSelectionCardGroup

### RoleSelectionCardGroup requirements

* student option
* supporting-adult option
* clear differentiation copy

---

## 10. Student onboarding components

## 10.1 OnboardingShell

### Purpose

Shared container for onboarding experience.

### Must include

* progress indicator
* step content area
* back/continue actions
* autosave state

---

## 10.2 OnboardingStepRenderer

### Purpose

Render the correct step UI based on current step config.

---

## 10.3 OnboardingProgressHeader

## 10.4 OnboardingStepFooter

## 10.5 OnboardingQuestionBlock

## 10.6 OnboardingTextareaStep

## 10.7 OnboardingRadioStep

## 10.8 OnboardingMultiSelectStep

## 10.9 OnboardingInviteParentStep

## 10.10 OnboardingCompletionPanel

### Notes

These should be configured from step metadata, not hardcoded page by page where practical.

---

## 11. Snapshot components

## 11.1 SnapshotLoadingPanel

### Purpose

Calm, premium loading state while snapshot is generated.

---

## 11.2 SnapshotThemeCard

### Purpose

Display one theme from strongest themes output.

---

## 11.3 SnapshotDirectionCard

### Purpose

Display one possible story direction.

---

## 11.4 SnapshotGapList

### Purpose

Display missing elements / narrative gaps.

---

## 11.5 SnapshotSummaryPanel

### Purpose

Show summary explanation of student’s edge.

---

## 11.6 SnapshotCTASection

### Purpose

Upgrade-focused action section.

---

## 12. Student dashboard components

## 12.1 StudentDashboardHeader

## 12.2 StudentDashboardGrid

## 12.3 DashboardProgressCard

## 12.4 DashboardEssayStatusCard

## 12.5 DashboardSupplementsCard

## 12.6 DashboardSchoolDeadlinesCard

## 12.7 DashboardParentInviteCard

## 12.8 DashboardRecentActivityCard

## 12.9 DashboardUpgradePromptCard

### Notes

Free users and paid users may see different card compositions, but should use the same component system.

---

## 13. Story Vault components

## 13.1 StoryVaultHeader

## 13.2 StoryVaultGrid

## 13.3 StoryEntryCard

### Required content

* title
* category
* tags
* strength level
* used status
* edit action

---

## 13.4 StoryEntryEditorModal or Panel

### Required fields

* title
* body
* category
* theme tags
* strength level

---

## 13.5 StoryStrengthBadge

## 13.6 StoryUsageBadge

## 13.7 StoryVaultEmptyState

## 13.8 StoryAnalysisPanel

## 13.9 StoryAnalysisSummaryCard

---

## 14. Personal statement components

## 14.1 PersonalStatementHeader

## 14.2 NarrativeDirectionSelector

### Required features

* chosen direction
* alternate directions
* selection action

---

## 14.3 OutlineOptionCard

## 14.4 OutlineSelectionPanel

## 14.5 DraftEditorPane

### Purpose

Primary draft-writing surface.

### Requirements

* text editing area
* save state indicator
* version save support

---

## 14.6 EssayFeedbackPanel

### Purpose

Display structured AI feedback.

### Required sections

* what is working
* what is weak
* what is missing
* next steps

---

## 14.7 RevisionChecklist

## 14.8 EssayVersionHistoryPanel

## 14.9 EssayWorkspaceEmptyState

## 14.10 EssayFeedbackLoadingState

---

## 15. Supplement components

## 15.1 SupplementsHeader

## 15.2 SchoolPromptGroup

### Purpose

Group supplement prompts by institution.

---

## 15.3 SupplementCard

## 15.4 SupplementEditorPane

## 15.5 PromptCategoryBadge

## 15.6 SuggestedAnglesPanel

## 15.7 OverlapWarningPanel

## 15.8 SupplementsEmptyState

## 15.9 SupplementStatusBadge

---

## 16. School planner components

## 16.1 SchoolPlannerHeader

## 16.2 InstitutionSearchCombobox

### Purpose

Primary school search interface.

### Requirements

* typeahead
* dropdown results
* keyboard navigation
* loading state
* no-results state

---

## 16.3 InstitutionResultItem

## 16.4 StudentSchoolListTable or CardList

## 16.5 StudentSchoolListItemCard

## 16.6 DeadlineSummaryPanel

### Required fields

* ED
* EDII
* EA
* EAII
* REA
* RD
* Rolling
* confidence/source state if surfaced

---

## 16.7 ApplicationTypeSelect

## 16.8 SchoolStatusBadge

## 16.9 SchoolNotesEditor

## 16.10 SchoolPlannerEmptyState

## 16.11 SchoolLimitUpgradeGate

---

## 17. Progress components

## 17.1 ProgressPageHeader

## 17.2 ProgressOverviewPanel

## 17.3 ModuleCompletionList

## 17.4 CurrentFocusCard

## 17.5 NextStepCard

## 17.6 ProgressTimeline optional

---

## 18. Supporting-adult components

## 18.1 ParentDashboardHeader

## 18.2 ParentProgressSummaryCard

## 18.3 ParentDeadlinesCard

## 18.4 ParentCurrentFocusCard

## 18.5 ParentMilestonesCard

## 18.6 ParentBillingSummaryCard

## 18.7 ParentLinkedStudentEmptyState

## 18.8 ParentInviteAcceptancePanel

### Notes

No component in this set should display raw writing content in v1.

---

## 19. Settings components

## 19.1 SettingsHeader

## 19.2 ProfileSettingsForm

## 19.3 NotificationSettingsForm

## 19.4 LinkedAccountPanel

## 19.5 BillingPanel

## 19.6 SecurityPanel

---

## 20. Billing and upgrade components

## 20.1 PricingComparisonTable

## 20.2 UpgradeModal

## 20.3 UpgradePageSection

## 20.4 CheckoutSummaryCard

## 20.5 BillingStatusBadge

## 20.6 BillingPortalButton

---

## 21. Notification-related components

## 21.1 NotificationBell optional

## 21.2 NotificationListPanel optional

## 21.3 InlineReminderBanner

## 21.4 DeadlineReminderBanner

### Notes

v1 may keep notifications lightweight; do not overbuild inbox complexity.

---

## 22. Admin components

## 22.1 AdminOverviewHeader

## 22.2 AdminUsersTable

## 22.3 AdminInstitutionTable

## 22.4 AdminDeadlineTable

## 22.5 AdminAnalyticsSummaryCards

## 22.6 AdminSupportEventsTable

## 22.7 ImportStatusPanel

## 22.8 AuditEventTable

---

## 23. Route-to-component mapping

## 23.1 Homepage (`/`)

Required composition:

* MarketingLayout
* MarketingTopNav
* HomepageHero
* ProblemSection
* HowItWorksSummarySection
* DifferentiationSection
* FounderStorySection
* PricingTeaserSection
* FAQPreviewSection
* MarketingFooter

---

## 23.2 Signup (`/signup`)

Required composition:

* AuthLayout
* SignupForm

---

## 23.3 Login (`/login`)

Required composition:

* AuthLayout
* LoginForm

---

## 23.4 Role Select (`/role-select`)

Required composition:

* AuthLayout
* RoleSelectionCardGroup

---

## 23.5 Student Onboarding (`/app/onboarding`)

Required composition:

* StudentAppLayout
* OnboardingShell
* OnboardingProgressHeader
* OnboardingStepRenderer
* OnboardingStepFooter
* SaveStateIndicator

---

## 23.6 Snapshot (`/app/snapshot`)

Required composition:

* StudentAppLayout
* SnapshotLoadingPanel or Snapshot result set
* SnapshotThemeCard
* SnapshotDirectionCard
* SnapshotGapList
* SnapshotSummaryPanel
* SnapshotCTASection

---

## 23.7 Student Dashboard (`/app`)

Required composition:

* StudentAppLayout
* StudentDashboardHeader
* StudentDashboardGrid
* DashboardProgressCard
* DashboardEssayStatusCard
* DashboardSupplementsCard
* DashboardSchoolDeadlinesCard
* DashboardParentInviteCard
* DashboardRecentActivityCard
* DashboardUpgradePromptCard where relevant

---

## 23.8 Story Vault (`/app/story-vault`)

Required composition:

* StudentAppLayout
* RouteGuardShell
* StoryVaultHeader
* StoryVaultGrid
* StoryEntryCard
* StoryEntryEditorModal/Panel
* StoryAnalysisPanel
* StoryVaultEmptyState or UpgradeGate

---

## 23.9 Personal Statement (`/app/personal-statement`)

Required composition:

* StudentAppLayout
* RouteGuardShell
* PersonalStatementHeader
* NarrativeDirectionSelector
* OutlineSelectionPanel
* DraftEditorPane
* EssayFeedbackPanel
* RevisionChecklist
* EssayVersionHistoryPanel
* UpgradeGate / EmptyState / LoadingState as needed

---

## 23.10 Supplements (`/app/supplements`)

Required composition:

* StudentAppLayout
* RouteGuardShell
* SupplementsHeader
* SchoolPromptGroup
* SupplementCard
* SupplementEditorPane
* SuggestedAnglesPanel
* OverlapWarningPanel
* SupplementsEmptyState or UpgradeGate

---

## 23.11 Schools (`/app/schools`)

Required composition:

* StudentAppLayout
* SchoolPlannerHeader
* InstitutionSearchCombobox
* StudentSchoolListTable/CardList
* StudentSchoolListItemCard
* DeadlineSummaryPanel
* ApplicationTypeSelect
* SchoolNotesEditor
* SchoolPlannerEmptyState or SchoolLimitUpgradeGate

---

## 23.12 Progress (`/app/progress`)

Required composition:

* StudentAppLayout
* ProgressPageHeader
* ProgressOverviewPanel
* ModuleCompletionList
* CurrentFocusCard
* NextStepCard

---

## 23.13 Parent Dashboard (`/parent`)

Required composition:

* ParentAppLayout
* ParentDashboardHeader
* ParentProgressSummaryCard
* ParentDeadlinesCard
* ParentCurrentFocusCard
* ParentMilestonesCard
* ParentBillingSummaryCard
* ParentLinkedStudentEmptyState when necessary

---

## 23.14 Parent Deadlines (`/parent/deadlines`)

Required composition:

* ParentAppLayout
* ParentDeadlinesCard
* DeadlineSummaryPanel or supporting-adult-adapted list

---

## 23.15 Settings (`/app/settings`, `/parent/settings`)

Required composition:

* respective layout
* SettingsHeader
* ProfileSettingsForm
* NotificationSettingsForm
* LinkedAccountPanel
* BillingPanel
* SecurityPanel

---

## 23.16 Admin routes

Use:

* AdminLayout
* route-specific tables/cards/panels from admin section

---

## 24. Loading, empty, error, and gated state requirements by module

| Module             | Loading |   Empty | Error |   Gated |
| ------------------ | ------: | ------: | ----: | ------: |
| Onboarding         |     Yes |     N/A |   Yes |      No |
| Snapshot           |     Yes |      No |   Yes |      No |
| Dashboard          |     Yes | Partial |   Yes | Partial |
| Story Vault        |     Yes |     Yes |   Yes |     Yes |
| Personal Statement |     Yes |     Yes |   Yes |     Yes |
| Supplements        |     Yes |     Yes |   Yes |     Yes |
| Schools            |     Yes |     Yes |   Yes | Partial |
| Parent Dashboard   |     Yes |     Yes |   Yes |     Yes |
| Admin              |     Yes |     Yes |   Yes |      No |

---

## 25. Build order for component implementation

### Phase 1 — primitives

Build first:

* buttons
* inputs
* textarea
* radio/select/checkbox
* cards
* progress bars
* badges
* modals
* alerts
* skeletons
* empty/error states

### Phase 2 — layouts and nav

Build:

* MarketingLayout
* AuthLayout
* StudentAppLayout
* ParentAppLayout
* AdminLayout
* nav components

### Phase 3 — shared workflow components

Build:

* RouteGuardShell
* UpgradeGate
* SaveStateIndicator
* LoadingStatePanel
* EmptyStatePanel
* ErrorStatePanel
* NextStepCard
* ProgressSummaryCard

### Phase 4 — onboarding and snapshot

Build:

* onboarding component set
* snapshot component set

### Phase 5 — dashboard and premium modules

Build:

* dashboard components
* Story Vault components
* essay components
* school planner components
* supplements components

### Phase 6 — parent and admin

Build:

* supporting-adult dashboard components
* admin tables/panels

---

## 26. QA focus by component class

QA should verify:

### Primitives

* states render correctly
* accessibility states exist
* focus/keyboard behavior works

### Layouts

* route shell consistency
* responsive behavior
* nav correctness

### Workflow components

* loading/gating/error transitions
* no broken save-state signaling

### Premium modules

* upgrade gates appear correctly
* free users do not receive premium interactivity
* paid users do receive premium interactivity

### Supporting-adult modules

* no raw writing content leaks through reused components

---

## 27. Non-negotiables

1. Build one design system, not multiple ad hoc UI styles.
2. Every premium module must have a reusable upgrade-gate pattern.
3. Every async workflow must have explicit loading and failure components.
4. Supporting-adult UI must never reuse raw student writing panes in v1.
5. Institution search must use a real combobox/typeahead component, not a basic text field pretending to be one.

---

## 28. Final directive

This component inventory is the UI construction map for v1.

Routes, data contracts, permissions, and sprint tickets should all reference this document when assigning frontend work.

No page should be built from scratch without first mapping it to this component inventory.

---

## 29. Recommended next artifacts

Create next:

* `SPRINT_01_TICKETS.md`
* `SPRINT_02_TICKETS.md`
* `API_CONTRACTS_V1.md`
* `QA_COMPONENT_TEST_MATRIX_V1.md`
* `UI_STATE_MATRIX_V1.md`