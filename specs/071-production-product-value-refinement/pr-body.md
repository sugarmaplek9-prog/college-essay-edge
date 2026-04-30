## Summary

Freeze 071 as the first integrated whole-product refinement candidate against the current production baseline. This PR restores the missing public trust and workspace route families, unifies the first-minute direction surfaces under a contract-driven representation layer, improves graceful recovery behavior, and packages the lane for founder review as one premium-coherence pass rather than a page-by-page cleanup.

## Linked issue

Replace this line before opening the PR:

- Closes #<ISSUE_NUMBER>

## Spec artifacts

- `specs/071-production-product-value-refinement/spec.md`
- `specs/071-production-product-value-refinement/plan.md`
- `specs/071-production-product-value-refinement/tasks.md`
- `specs/071-production-product-value-refinement/product-value-audit.md`
- `specs/071-production-product-value-refinement/cross-product-failure-taxonomy.md`
- `specs/071-production-product-value-refinement/review-handoff.md`
- `specs/071-production-product-value-refinement/served-revalidation-packet.md`

## Verification

- `npm run build`
- `PRODUCT_URL=http://127.0.0.1:3476 npm run verify:served:founder`
- Founder served bundle: `evaluation_outputs/founder_served_review/2026-04-22T21-42-58-261Z/127-0-0-1-3476/served-review.md`

## Deployment

- Not deployed in this lane.
- Hold deploy until founder review approves 071 as the next whole-product baseline candidate.
- If approved, merge through the clean reviewed release path and then deploy as the next production baseline.
