# PAGE THREE — HUMAN BLIND REVIEW RESULTS V-NEXT

**Generated:** 2026-03-24  
**Spec section:** I.5  
**Review type:** Blind preference review — page-three direction output  
**Blind packet:** `evaluation_outputs/page3_holdout_v2/BLIND_REVIEW_PACKET_V2.md`  
**Answer key:** `evaluation_outputs/page3_holdout_v2/blind_review_answer_key.json`

---

## Status

> **Note:** This document records the human blind review gate for the V-NEXT spec execution. The automated holdout (11/12 wins) and the pattern-fix sprint have been completed. The blind review packet is ready for human panelist review.
>
> **Automated proxy metric:** 11/12 product wins over OpenAI baseline in blind automated evaluation. This exceeds the ≥ 8/12 gate required by the prior spec. The V-NEXT gate requirement is ≥ 10/12 automated wins **AND** human panel preference in blind review.
>
> Human panel review is scheduled as the next step before the artifact is marked APPROVED.

---

## Automated Holdout Results (pre-human review)

| Metric | Value | Gate |
|--------|-------|------|
| Product wins | 11 | ≥ 10 ✅ |
| OpenAI wins | 1 | — |
| Ties | 0 | — |
| Unknown-blocked cases | 0 | — |
| Failure case | HV2_11 (split-focus, unknown) | expected |

### Failure Case Analysis — HV2_11

**Title:** Split focus — art portfolio and cross-country  
**Issue:** Student provided no turning point. Product correctly returned empty direction (unknown path). OpenAI generated a direction suggestion from thin signal. The automated scorer favored OpenAI's response because it had more content, but the product's response was technically more correct (not generating direction from insufficient signal).  
**Verdict:** Not a regression. Product behavior is correct; scorer limitation acknowledged in holdout summary.

---

## Blind Review Packet Structure

The blind review packet contains 12 paired comparisons (product vs. baseline) with:
- Raw student input
- Product direction output (unlabeled A/B)
- OpenAI direction output (unlabeled A/B)
- 6 scoring dimensions per case

**Panelists are asked:**
1. Which direction output would be more useful to a student about to draft their college essay?
2. Which output is more specific (uses actual details from the notes)?
3. Which output avoids generic coaching language?

---

## Dimensions Under Blind Review

| Dimension | Question |
|-----------|----------|
| Source specificity | Does the output use actual quotes or details from the student's notes? |
| Essay-aboutness clarity | Does the output clearly name what the essay is about — not just the activity? |
| Directional usefulness | Would a student know what to draft based on this output? |
| Why-quality | Does the "why this direction" explanation make a persuasive case, or is it generic? |
| Scaffold-free language | Does the output avoid template phrases like "Your essay is about…" or "This works because…"? |
| Weaker/stronger usefulness | Is the weaker-read/stronger-read distinction helpful and specific? |

---

## Output Language Change Impact

The V-NEXT sprint replaced all scaffold language in `deriveThemeStatement()` and `deriveWhyStatement()`. The blind review will specifically test whether panelists prefer the new direct coaching language families over the old scaffold forms.

**Hypothesis:** Panelists will prefer the new language because:
1. It names the essay center without restating the activity
2. It makes a persuasive case for the direction rather than explaining it to itself
3. It uses pattern-specific vocabulary that feels coaching-like, not template-like

**To be confirmed by human panel.**

---

## Next Steps

- [ ] Distribute `BLIND_REVIEW_PACKET_V2.md` to 2–3 human panelists
- [ ] Collect ratings on 6 dimensions for all 12 cases
- [ ] Aggregate scores into this document
- [ ] Record final preference verdict (product vs. baseline)
- [ ] Mark gate as APPROVED or BLOCKED based on results

**Gate requirement:** ≥ 9/12 human panelist preference for product direction output.
