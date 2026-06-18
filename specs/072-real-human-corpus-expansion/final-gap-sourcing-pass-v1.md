# Final Gap Sourcing Pass — V1

Date: 2026-04-26

## Scope

Run a targeted final sourcing pass for `072` without freezing a split.

This pass only accepts cases that close the remaining gaps identified in `freeze-readiness-decision-memo-v1.md`:

- `2–4` blind-eligible official cases outside the current JHU family
- `1–2` blind cases with different essay engines, including one intellectual / academic identity case and one family / background, service / community, or unusual-voice case
- `2` stronger visible-side cases with messy authored student signal beyond pure topic-selection brainstorming

Constraints preserved:

- `072` remains the only active lane
- `074` remains closed
- `075` remains frozen
- blind not run
- no split freeze executed in this pass
- no additional JHU-family examples accepted for the blind pool

## Acceptance rule used in this pass

No case was accepted unless the record could support all of the following:

- source URL
- provenance type
- unused status
- blind vs visible eligibility
- authored-signal quality
- essay-engine category
- leakage check result
- reason for acceptance

## Accepted cases

### Blind-eligible official cases accepted

1. `NSB-FS-020`
   - source URL: `https://www.conncoll.edu/admission/apply/essays-that-worked/riley-anderson-25/`
   - provenance type: `verified_public_human` official admissions example
   - unused status: no match in `072` registries, queue history, `evaluation/**`, `evaluation_outputs/**`, `outputs/**`, or `docs/**` during targeted searches
   - eligibility: blind-eligible official case
   - authored-signal quality: full polished essay on an official school-hosted page with named student attribution (`Riley Anderson '25`) and school commentary
   - essay-engine category: unusual voice / belonging-in-sport / identity
   - leakage check result: no repo hits outside this sourcing pass
   - reason for acceptance: adds a non-JHU official archive family and fills the unusual-voice / identity gap

2. `NSB-FS-021`
   - source URL: `https://www.conncoll.edu/admission/apply/essays-that-worked/elizabeth-madden-28/`
   - provenance type: `verified_public_human` official admissions example
   - unused status: no match in `072` registries, queue history, `evaluation/**`, `evaluation_outputs/**`, `outputs/**`, or `docs/**` during targeted searches
   - eligibility: blind-eligible official case
   - authored-signal quality: full polished essay on an official school-hosted page with named student attribution (`Elizabeth Madden '28`) and school commentary
   - essay-engine category: service / community / environmental stewardship
   - leakage check result: no repo hits outside this sourcing pass
   - reason for acceptance: adds a second non-JHU official case with a different non-growth-first engine and reduces single-family blind concentration

3. `NSB-FS-022`
   - source URL: `https://admissions.tufts.edu/blogs/inside-admissions/post/essays-that-worked/`
   - provenance type: `verified_public_human` official admissions essay collection
   - unused status: no match in `072` registries, queue history, `evaluation/**`, `evaluation_outputs/**`, `outputs/**`, or `docs/**` during targeted searches
   - eligibility: blind-eligible official case
   - authored-signal quality: full essay displayed on the official page for named student `Ray Parker '19`, labeled on-page as a distinct essay example
   - essay-engine category: intellectual / academic identity with maker-STEM texture
   - leakage check result: no repo hits outside this sourcing pass
   - reason for acceptance: adds a second non-JHU school family and directly fills the intellectual / academic identity blind gap

### Visible-side stronger-authored cases accepted

4. `NSB-FS-023`
   - source URL: `https://essayforum.com/undergraduate/provide-information-yourself-feel-help-college-92696/`
   - provenance type: `probable_public_human` public student-help post
   - unused status: no match in `072` registries, queue history, `evaluation/**`, `evaluation_outputs/**`, `outputs/**`, or `docs/**` during targeted searches
   - eligibility: visible-only
   - authored-signal quality: substantive partial draft with messy authored detail about poor academics, time off, garden-center work, horticulture reading, workshops, and community impact goals
   - essay-engine category: academic recovery + vocational identity + community/horticulture
   - leakage check result: no repo hits outside this sourcing pass
   - reason for acceptance: materially stronger than pure topic brainstorming and broadens visible sourcing beyond Reddit

5. `NSB-FS-024`
   - source URL: `https://essayforum.com/undergraduate/challenging-transition-college-statement-63762/`
   - provenance type: `probable_public_human` public student-help post
   - unused status: no match in `072` registries, queue history, `evaluation/**`, `evaluation_outputs/**`, `outputs/**`, or `docs/**` during targeted searches
   - eligibility: visible-only
   - authored-signal quality: near-full draft with messy but substantive authored signal around science interest, relocation, open-mindedness, travel, work, and responsibility
   - essay-engine category: intellectual / academic identity + cross-cultural transition + responsibility
   - leakage check result: no repo hits outside this sourcing pass
   - reason for acceptance: adds a second stronger-authored non-Reddit visible case and strengthens the visible bucket beyond brainstorm-only inputs

## Reviewed but not accepted

- `https://www.conncoll.edu/admission/apply/essays-that-worked/edie-banovic-25/`
  - strong official candidate, but not needed once the pass had already accepted two Connecticut College cases; holding it back avoids overloading the new increment with one archive family

- `https://www.law.uchicago.edu/news/their-own-words-admissions-essays-worked`
  - strong official provenance, but graduate / professional-school comparability is weaker than the current undergrad-focused corpus objective

- `https://talk.collegeconfidential.com/t/personal-statement-and-supplemental-essay-too-similar/3640070`
  - useful public student signal, but summary-level rather than draft-level; weaker than the selected EssayForum visible cases

## Result

This pass accepts `5` new cases:

- `3` blind-eligible official cases outside JHU
- `2` stronger visible-side cases from a non-Reddit source family

No split was frozen in this pass.