# Plan — 071 Production Product Value Refinement

## Baseline

- Start from a clean worktree at `main` after canonical production deployment governance is complete.
- Treat production (`https://college-essay-edge.vercel.app`) as the frozen product baseline.
- Use the 068, 069, and 070 proof sets as constraints, not as reopeners.

## Architecture / product approach

This lane should not add disconnected pages. It should promote one integrated route-family system:

1. **Public trust shell**
   - Add `/how-it-works`, `/faq`, and `/about`
   - Use one shared shell so trust, CTA hierarchy, and voice remain consistent

2. **Representation-driven direction family**
   - Replace the ad hoc route implementations for recommendation / compare / opening / reflecting with contract-driven route components
   - Keep blocked / recovery posture explicit and fail closed when handoff state is malformed

3. **Student workspace shell**
   - Add `/app` plus downstream workspace routes
   - Make the app layer feel like a continuation of the selected direction and saved draft, not a separate product

4. **Shared handoff continuity**
   - Preserve selected-direction, evidence, next-move, and opening seed across route families
   - Ensure route CTAs always answer “what should I do next?”

## Files / areas expected to change

### New route families
- `src/app/how-it-works/page.tsx`
- `src/app/faq/page.tsx`
- `src/app/about/page.tsx`
- `src/app/app/page.tsx`
- `src/app/app/personal-statement/page.tsx`
- `src/app/app/story-vault/page.tsx`
- `src/app/app/supplements/page.tsx`
- `src/app/app/profile/page.tsx`

### Direction-family surfaces
- `src/app/start/direction/page.tsx`
- `src/app/start/compare/page.tsx`
- `src/app/start/opening/page.tsx`
- `src/app/start/reflecting/page.tsx`
- `src/app/start/blocked/page.tsx`

### New shared components
- `src/components/publicSite/**`
- `src/components/app-shell/**`
- `src/components/dashboard/**`
- `src/components/personalStatement/**`
- `src/components/storyVault/**`
- `src/components/supplements/**`
- `src/components/profile/**`
- `src/components/representation/**`

### New shared logic
- `src/lib/fm/liveSessionDirection.ts`
- `src/lib/fm/malformedCopyGate.ts`
- `src/lib/representation/**`

## Verification approach

1. Run `npm run build`
2. Start a served local candidate
3. Re-run founder-style served verification against the served candidate
4. Capture a served revalidation packet for this lane

## Deployment note

Do not publish within this lane. This lane ends at refined candidate plus served revalidation packet and review.
