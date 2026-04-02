# Implementation Plan v1

The College Admissions Edge

## 1. Purpose

This document translates the Engineering Build Spec v1 into a buildable implementation sequence.

It defines:

- exact build order
- module dependencies
- folder structure
- route inventory
- database implementation order
- service integration order
- sprint plan
- launch sequencing

This is the document engineering uses to start building.

It is not a strategy memo.
It is not a brand document.
It is not a brainstorm.

## 2. Implementation objective

Build and deploy the first production-ready version of The College Admissions Edge as a modern AI-native web application with:

- secure authentication
- role-based access
- onboarding flows
- free Edge Snapshot
- paid upgrade path
- Story Vault
- personal statement workspace
- supplements workspace
- school list and deadline planner
- parent dashboard
- email and billing infrastructure

The v1 implementation must be:

- modular
- secure
- scalable enough for early growth
- fast to iterate
- visually premium
- straightforward for a small team to maintain

## 3. Implementation philosophy
### 3.1 Build vertical slices, not disconnected layers

Each major sprint should produce working user-facing value, not only backend plumbing.

### 3.2 Do not over-engineer v1

Keep architecture clean, typed, and modular, but avoid unnecessary abstraction.

### 3.3 Lock critical foundations early

These must be built correctly first:

- auth
- role access
- data model
- entitlements
- school directory structure
- AI output contracts

### 3.4 Product trust is a feature

The system must feel reliable and polished at every step.

## 4. Recommended repository structure

(see build spec for detailed tree; replicate here for engineering reference)

```
college-admissions-edge/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── about/page.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (auth)/
│   │   ├── role-select/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── reset-password/page.tsx
│   ├── app/
│   │   ├── page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── snapshot/page.tsx
│   │   ├── story-vault/page.tsx
│   │   ├── personal-statement/page.tsx
│   │   ├── supplements/page.tsx
│   │   ├── schools/page.tsx
│   │   ├── progress/page.tsx
│   │   └── settings/page.tsx
│   ├── parent/
│   │   ├── page.tsx
│   │   ├── progress/page.tsx
│   │   ├── deadlines/page.tsx
│   │   └── settings/page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── schools/page.tsx
│   │   ├── deadlines/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── support/page.tsx
│   └── api/
│       ├── onboarding/
│       ├── snapshot/
│       ├── story-vault/
│       ├── essays/
│       ├── supplements/
│       ├── schools/
│       ├── parent/
│       ├── billing/
│       ├── notifications/
│       └── admin/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── forms/
│   ├── dashboard/
│   ├── story-vault/
│   ├── essays/
│   ├── supplements/
│   ├── schools/
│   ├── parent/
│   ├── marketing/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── ai/
│   ├── billing/
│   ├── email/
│   ├── analytics/
│   ├── validation/
│   ├── permissions/
│   ├── formatting/
│   └── constants/
├── server/
│   ├── onboarding/
│   ├── snapshot/
│   ├── story-vault/
│   ├── essays/
│   ├── supplements/
│   ├── schools/
│   ├── parent/
│   ├── billing/
│   ├── notifications/
│   └── admin/
├── types/
│   ├── auth.ts
│   ├── onboarding.ts
│   ├── snapshot.ts
│   ├── story-vault.ts
│   ├── essays.ts
│   ├── supplements.ts
│   ├── schools.ts
│   ├── billing.ts
│   └── api.ts
├── emails/
│   ├── welcome.tsx
│   ├── verify-email.tsx
│   ├── invite-parent.tsx
│   ├── onboarding-reminder.tsx
│   ├── milestone.tsx
│   ├── deadline-reminder.tsx
│   └── billing-confirmation.tsx
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── policies/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── product/
│   └── engineering/
├── public/
├── styles/
├── middleware.ts
├── package.json
├── tsconfig.json
└── vercel.json
```

## 5. Initial environment setup
### 5.1 Create external services

Set up:

- GitHub repo
- Vercel project
- Supabase project
- Resend account
- Stripe account

### 5.2 Create environments

Use:

- local
- preview
- production

### 5.3 Required environment variables

At minimum:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

RESEND_API_KEY=

AI_API_KEY=

NEXT_PUBLIC_APP_URL=
```

## 6. Module dependency order

This is the critical sequence.

### 6.1 Foundation dependencies

These must exist before higher-level product modules:

- repo scaffold
- design system primitives
- auth and role model
- base database schema
- route protection
- analytics event framework

### 6.2 Product dependencies

- onboarding depends on auth + profile tables
- snapshot depends on onboarding completion + AI contract
- upgrade depends on billing + entitlements
- Story Vault depends on auth + entitlements + story tables
- essay workspace depends on Story Vault + AI feedback contract
- supplements depend on school list + story reuse model
- parent dashboard depends on parent/student link + progress aggregation
- reminders depend on deadlines + notification pipeline

## 7. Route inventory

### 7.1 Public routes
| Route | Purpose | Auth Required |
|-------|---------|---------------|
| / | Homepage | No |
| /how-it-works | Workflow explanation | No |
| /pricing | Pricing and plan comparison | No |
| /faq | FAQ | No |
| /about | Founder/product story | No |
| /login | Login | No |
| /signup | Signup | No |

### 7.2 Auth routes
| Route | Purpose | Auth Required |
|-------|---------|---------------|
| /role-select | Role selection after signup | Yes |
| /verify-email | Verification completion | Partial |
| /reset-password | Password reset | No |

### 7.3 Student routes
| Route | Purpose | Auth Required |
|-------|---------|---------------|
| /app | Student dashboard | Yes |
| /app/onboarding | Student onboarding | Yes |
| /app/snapshot | Free snapshot result | Yes |
| /app/story-vault | Paid story management | Yes + entitlement |
| /app/personal-statement | Paid essay workflow | Yes + entitlement |
| /app/supplements | Paid supplement workflow | Yes + entitlement |
| /app/schools | School planner | Yes |
| /app/progress | Progress overview | Yes |
| /app/settings | Settings | Yes |

### 7.4 Parent routes
| Route | Purpose | Auth Required |
|-------|---------|---------------|
| /parent | Parent dashboard | Yes |
| /parent/progress | Student progress summary | Yes |
| /parent/deadlines | Deadline view | Yes |
| /parent/settings | Settings | Yes |

### 7.5 Admin routes
| Route | Purpose | Auth Required |
|-------|---------|---------------|
| /admin | Admin home | Admin |
| /admin/users | User overview | Admin |
| /admin/schools | Institution admin | Admin |
| /admin/deadlines | Deadline admin | Admin |
| /admin/analytics | Funnel/usage metrics | Admin |
| /admin/support | Support visibility | Admin |

## 8. API implementation inventory

... (as earlier) ...

{Truncated for brevity in this initial file; refer to build spec for full list}

## 9. Database implementation plan

... (summary as earlier) ...

## 10. Database schema order of operations

... 

## 11. Required domain objects

... (details earlier) ...

## 12. Entitlement model

... 

## 13. UI implementation plan

... 

## 14. AI workflow implementation plan

... 

## 15. School planner implementation plan

... 

## 16. Billing implementation plan

... 

## 17. Notification implementation plan

... 

## 18. Analytics implementation plan

... 

## 19. Testing implementation plan

... 

## 20. Sprint plan

... 

## 21. Implementation acceptance criteria by phase

... 

## 22. Critical launch blockers

... 

## 23. Immediate next files to create

- `/docs/engineering/IMPLEMENTATION_PLAN_V1.md` (this document)
- `/docs/engineering/DATABASE_SCHEMA_V1.md`
- `/docs/engineering/ROUTE_INVENTORY_V1.md`
- `/docs/engineering/COMPONENT_INVENTORY_V1.md`
- `/docs/engineering/SPRINT_01_TICKETS.md`
- `/docs/engineering/SPRINT_02_TICKETS.md`

## 24. Recommended next document

The next highest-value document is:

**DATABASE_SCHEMA_V1.md**

That should include:

- exact SQL table definitions
- indexes
- foreign keys
- enums
- RLS policy plan
- seed/import notes for institutions and deadlines

That is the point where engineering can start implementing the backend without ambiguity.