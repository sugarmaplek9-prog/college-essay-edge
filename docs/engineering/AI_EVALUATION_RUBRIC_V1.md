# AI_EVALUATION_RUBRIC_V1
## The College Admissions Edge
### v1 AI Output Evaluation, Review, Calibration, and Learning Rubric

---

## 1. Purpose

This document defines how The College Admissions Edge evaluates the quality of AI-assisted outputs across core modules in v1.

It exists to answer a foundational product question:

> How do we know whether an output is truly good enough to represent the product?

That question matters because output quality in this product cannot be judged by fluency alone.

A response can sound polished and still fail.
A response can be structurally correct and still fail.
A response can appear useful and still fail if it is:

- generic
- over-polished
- weakly grounded
- strategically shallow
- insufficiently student-specific
- ghostwriting-adjacent
- or indistinguishable from what free AI could generate

This rubric is designed to evaluate outputs against the actual product standard of The College Admissions Edge:

- more selective than generic AI
- more authentic than generic AI
- more admissions-native than generic AI
- more student-specific than generic AI
- more useful for decision-making than generic AI

This is not only a human review guide.
It is also the foundation for:

- QA review
- prompt iteration
- validator calibration
- module comparison
- release readiness review
- model/provider comparison
- future ML-assisted quality scoring
- personalization quality improvement

This document is one of the key mechanisms by which the product **protects quality while learning over time.**

---

## 2. Core Evaluation Principle

The goal is not to judge whether output is "good writing."

The goal is to judge whether the output is:

> the right product artifact for this student, in this workflow moment, at this quality bar, with this authenticity standard.

That means the evaluation rubric must care about more than correctness or readability.

It must evaluate whether the output:

- fits the module's actual job
- narrows the decision space
- is grounded in real student material
- preserves student authorship
- avoids genericity
- provides admissions-native reasoning
- and feels unique enough that it could not be swapped across students without obvious loss of truth

**Core rule**

> An output that could plausibly fit many students with only superficial edits should score poorly, even if it sounds polished.

---

## 3. Strategic Role of the Rubric

This rubric is one of the product's most important control instruments.

It exists to help the team distinguish between:

- fluent output and valuable output
- structure compliance and strategic usefulness
- personalized appearance and true student specificity
- acceptable output and differentiated output
- one-time success and system-level repeatability

It also exists to create a shared internal standard across:

- product
- engineering
- design
- QA
- operations
- future model evaluation
- future ML optimization

Without a strong rubric, teams drift toward superficial wins.
With a strong rubric, the system can improve with discipline.

---

## 4. What This Document Governs

This document governs:

- evaluation dimensions
- scoring definitions
- pass / fail thresholds
- reviewer standards
- calibration guidance
- module-specific evaluation emphasis
- uniqueness and student-specificity assessment
- authenticity assessment
- admissions-specificity assessment
- evaluator notes standards
- aggregation rules
- ML-ready label structure

This document does **not** define:

- prompt content
- schema contracts
- validation code
- context assembly logic
- orchestration flow
- UI implementation details

Those belong in adjacent product docs.

---

## 5. Evaluation Philosophy

### 5.1 Product Usefulness Over Verbal Polish
A polished output that fails to sharpen judgment is weak.

### 5.2 Student-Specificity Is Not Optional
The product must not behave like a template machine with student names attached.

### 5.3 Authenticity Must Remain Visible
The best output should feel anchored in the student's actual material, not upgraded into a synthetic "strong applicant voice."

### 5.4 Constraint Is a Strength
A smaller number of sharper, better-ranked outputs should score higher than a large set of generic options.

### 5.5 The Product Must Add Judgment, Not Just Words
The core value is not output volume.
It is strategic compression, prioritization, and clarity.

### 5.6 Evaluation Should Support Learning
The rubric should produce labels and subscores that can eventually improve validators, routing, context scoring, and personalization quality through ML-assisted systems.

---

## 6. Evaluation Object

Every review should evaluate a complete output artifact **in context.**

That means the evaluator should review:

- the module invoked
- the workflow stage
- the structured output
- enough source context to judge grounding
- the intended user role
- the expected module purpose

**Rule**

> Outputs should not be graded in isolation from the module's actual job.

A strong essay feedback artifact and a strong direction-selection artifact do not look the same and should not be judged identically.

---

## 7. Canonical Scoring Model

Each reviewed artifact should be scored across multiple dimensions rather than assigned one vague overall impression.

**Recommended v1 scoring scale for each dimension:**

| Score | Meaning |
|---|---|
| **1** | Unacceptable |
| **2** | Weak |
| **3** | Adequate |
| **4** | Strong |
| **5** | Exceptional |

A score of **3** should mean: acceptable for v1 only if no core-risk dimension is weak.

A score of **5** should be rare. It should represent genuinely differentiated product quality.

---

## 8. Core Evaluation Dimensions

The following are the primary scoring dimensions for v1.

---

### 8.1 Student Specificity

**Question:** Does this output feel genuinely specific to this student rather than broadly reusable across many students?

**What strong performance looks like:**
- recommendations clearly arise from the student's actual material
- output references meaningful patterns, tensions, risks, or opportunities unique to the student
- alternatives feel tailored to what this student has actually said, written, or selected
- the artifact could not be copy-pasted to another student without obvious mismatch

**What weak performance looks like:**
- trait-language summaries
- broad growth language
- advice that would fit almost anyone
- school-fit language that could apply to many applicants
- direction choices that are generic categories rather than real individualized lanes

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Could be reused for many students with almost no change |
| 2 | Some surface personalization, but underlying logic is generic |
| 3 | Moderately tailored, but not deeply specific |
| 4 | Clearly grounded in this student's actual material |
| 5 | Distinctive, precise, and highly individualized in a way that feels product-defining |

> **Why this matters:** This is one of the most important dimensions in the whole rubric. If this score is low, the product is drifting toward commodity AI.

---

### 8.2 Authenticity Preservation

**Question:** Does the output preserve the student's likely real voice, material, and authorship boundary?

**What strong performance looks like:**
- output stays close to what the student actually seems capable of owning
- the system coaches rather than replaces
- summaries preserve the student's real complexity rather than inflating polish
- feedback improves judgment without ghostwriting
- structure suggestions do not become ready-to-submit prose

**What weak performance looks like:**
- polished insight that exceeds source material
- emotional language that feels fabricated or too refined
- hidden authorship replacement
- rewrite behavior disguised as support
- exaggerated coherence imposed on thin material

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Strong authenticity violation or likely voice replacement |
| 2 | Noticeable polish inflation or authorship creep |
| 3 | Generally acceptable, but some mild over-shaping |
| 4 | Clearly preserves student ownership |
| 5 | Exceptionally strong at helping without taking over |

> **Rule:** Any artifact scoring 1 or 2 here should be treated as high-risk regardless of other strengths.

---

### 8.3 Admissions-Specific Reasoning

**Question:** Does the output reflect actual admissions strategy rather than generic writing or brainstorming advice?

**What strong performance looks like:**
- shows awareness of what makes a personal statement lane stronger or weaker
- identifies overlap risk in package terms, not just wording similarity
- evaluates supplement angles in school-fit and package-fit terms
- critiques essays based on reflection, narrative movement, and reader value
- demonstrates selective judgment, not just language help

**What weak performance looks like:**
- generic writing center advice
- generic brainstorming prompts
- "make it more personal" style feedback
- empty claims about what admissions officers want
- school suggestions with no package logic

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Not meaningfully admissions-specific |
| 2 | Light admissions flavor, mostly generic |
| 3 | Some real admissions logic, but inconsistent |
| 4 | Strong admissions-native reasoning |
| 5 | Exceptionally strategic and clearly beyond free AI quality |

---

### 8.4 Decision Value

**Question:** Did this artifact materially narrow the decision space or improve the next move?

**What strong performance looks like:**
- ranked options are meaningfully distinct
- one best direction clearly emerges when appropriate
- revision priorities are specific and leverage-ordered
- supplement angles reduce confusion rather than expand it
- overlap warnings change how the student should think about the package

**What weak performance looks like:**
- too many similar options
- hedged "all of these could work" language
- unranked or weakly ranked priorities
- generic lists that create more work than clarity
- conclusions that do not change what the student should do next

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Adds noise, not clarity |
| 2 | Slightly useful, but still diffuse |
| 3 | Moderately helpful for next-step thinking |
| 4 | Clearly improves decision quality |
| 5 | Strongly clarifies the highest-leverage next move |

---

### 8.5 Structural Fit

**Question:** Does the output fit the intended module contract and UI purpose?

**What strong performance looks like:**
- schema fields are complete and coherent
- ranked items are actually ranked
- required elements are present
- quantities are constrained appropriately
- artifact maps cleanly to the intended user experience

**What weak performance looks like:**
- schema technically passes but fields are weak or misused
- required recommendations are vague
- partial output is presented as complete
- the artifact shape works poorly for the UI
- sections are bloated or unbalanced

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Structurally unusable |
| 2 | Significant structural weakness |
| 3 | Acceptable structure with some flaws |
| 4 | Strong structural fit |
| 5 | Exceptionally clean, disciplined, and product-ready |

---

### 8.6 Specificity and Evidence Grounding

**Question:** Are the core claims, recommendations, and critiques grounded in the student's actual material?

**What strong performance looks like:**
- strengths are tied to real evidence
- critique points to exact narrative or structural issues
- supplement angles match actual student material
- direction recommendations emerge from real story patterns
- overlap warnings explain where and why repetition occurs

**What weak performance looks like:**
- praise without evidence
- critique without anchoring
- generic claims about strengths or risks
- inferred confidence with weak basis
- abstract advice detached from what the student actually wrote or shared

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Little or no meaningful grounding |
| 2 | Some grounding, but mostly abstract |
| 3 | Adequate grounding in key areas |
| 4 | Strong, consistent grounding |
| 5 | Exceptionally evidence-linked without becoming verbose |

---

### 8.7 Distinctness of Options

**Question:** Where multiple options are presented, are they genuinely different in value?

**What strong performance looks like:**
- options differ in narrative center, structure, reflection arc, or package role
- each option offers a meaningful tradeoff
- the user is choosing among real alternatives, not paraphrases

**What weak performance looks like:**
- fake variety
- same thesis in different words
- same direction with tone shifts only
- same school-fit logic under different titles

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Duplicate or near-duplicate options |
| 2 | Weak differentiation |
| 3 | Adequate differentiation |
| 4 | Strongly distinct option set |
| 5 | Exceptionally sharp and strategically differentiated option set |

> **Rule:** This dimension only applies where multi-option output is relevant.

---

### 8.8 Tone and Brand Fit

**Question:** Does the output sound like The College Admissions Edge rather than a generic chatbot?

**What strong performance looks like:**
- direct without being cold
- thoughtful without being flowery
- sharp without being harsh
- honest without being flattening
- restrained rather than flattering
- admissions-native without sounding canned

**What weak performance looks like:**
- motivational filler
- generic encouragement
- empty reassurance
- model-default softness
- over-polite hedging
- over-polished, "smart-sounding" filler

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Clear chatbot or canned-AI feel |
| 2 | Brand drift is noticeable |
| 3 | Generally acceptable, not distinctive |
| 4 | Strong brand fit |
| 5 | Distinctive, disciplined, unmistakably product-native |

---

### 8.9 Anti-Generic Performance

**Question:** How well did the output avoid common generic-AI failure modes?

**What strong performance looks like:**
- avoids trait clichés
- avoids general advice
- avoids broad brainstorm behavior
- avoids equal-weight option framing
- avoids unsupported praise
- avoids template-school-fit logic
- avoids synthetic "insight" padding

**What weak performance looks like:**
- hardworking / resilient / passionate framing
- "show, don't tell" type generic essay advice without context
- "this is a compelling story" filler
- school praise that could fit many schools
- vague claims of growth without evidence
- repeated soft hedging

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Strongly generic |
| 2 | Noticeably generic in several places |
| 3 | Acceptable, but with some drift |
| 4 | Clearly non-generic |
| 5 | Exceptionally resistant to generic-AI behavior |

---

### 8.10 Overall Leverage

**Question:** Did this output create disproportionate value relative to its size?

This is a synthesis dimension.

**What strong performance looks like:**
- compact but powerful
- changes what the user should do next
- removes ambiguity
- surfaces a high-value truth
- creates momentum in the workflow

**What weak performance looks like:**
- long but unhelpful
- polished but low-impact
- technically complete but strategically forgettable
- increases effort without increasing clarity

**Scoring guidance:**

| Score | Meaning |
|---|---|
| 1 | Very low leverage |
| 2 | Low leverage |
| 3 | Moderate leverage |
| 4 | Strong leverage |
| 5 | Exceptional leverage for the product moment |

---

## 9. Core-Risk Dimensions

The following dimensions should be treated as **core-risk dimensions:**

- student specificity
- authenticity preservation
- admissions-specific reasoning
- anti-generic performance

If any of these receive a **1 or 2**, the artifact should not be considered world-class and should usually fail promotion-quality review.

These dimensions are closer to the product moat than surface presentation dimensions.

---

## 10. Module-Specific Emphasis

Different modules should weight dimensions differently.

### 10.1 Edge Snapshot

**Highest emphasis:**
- student specificity
- admissions-specific reasoning
- decision value
- anti-generic performance

> A weak snapshot often fails by becoming a horoscope-style personality summary.

---

### 10.2 Story Vault Analysis

**Highest emphasis:**
- specificity and grounding
- student specificity
- distinctness of options
- overall leverage

> A weak Story Vault analysis often confuses activity inventory with narrative value.

---

### 10.3 Narrative Direction Selection

**Highest emphasis:**
- decision value
- distinctness of options
- student specificity
- admissions-specific reasoning

> A weak direction-selection output usually refuses to choose or presents fake variety.

---

### 10.4 Outline Generation

**Highest emphasis:**
- structural fit
- authenticity preservation
- distinctness of options
- decision value

> A weak outline output often drifts into disguised drafting or formula.

---

### 10.5 Essay Feedback

**Highest emphasis:**
- authenticity preservation
- specificity and grounding
- admissions-specific reasoning
- overall leverage

> A weak feedback artifact often sounds polished but generic, or helpful but too rewrite-adjacent.

---

### 10.6 Supplement Angle Suggestion

**Highest emphasis:**
- student specificity
- admissions-specific reasoning
- anti-generic performance
- decision value

> A weak supplement-angle output often sounds school-aware on the surface but could fit many prompts and many schools.

---

### 10.7 Overlap Warning

**Highest emphasis:**
- admissions-specific reasoning
- specificity and grounding
- decision value
- overall leverage

> A weak overlap output usually behaves like a text similarity checker instead of a package strategist.

---

## 11. Uniqueness and Individualization Test

This is one of the most important tests in the rubric.

Every evaluator should explicitly ask:

> **Could this output be swapped onto another student with only minor wording changes?**

If the answer is yes, the output is not sufficiently individualized.

**Strong uniqueness indicators:**
- student-specific tension
- student-specific story pattern recognition
- student-specific risk diagnosis
- student-specific package logic
- student-specific opportunity framing
- clear use of the student's own actual material

**Weak uniqueness indicators:**
- minor mention of a hobby or interest
- inserting the school name
- generic claims of growth
- broad praise linked to common applicant profiles
- reusable recommendations with superficial personalization

**Reviewer label**

Each artifact should receive one of the following uniqueness labels:

| Label | Meaning |
|---|---|
| `commodity_like` | Largely interchangeable across students |
| `lightly_personalized` | Some surface personalization, generic core |
| `meaningfully_individualized` | Clearly built from this student's material |
| `deeply_student_specific` | Precisely grounded and highly distinctive |

**Rule**

> A world-class artifact should usually score as `meaningfully_individualized` or `deeply_student_specific`.

---

## 12. Free-AI Substitution Test

This product should explicitly test against commodity-AI substitution risk.

**Evaluation question:**

> Could a motivated user get something roughly equivalent from free AI with a straightforward prompt?

**Labels:**

| Label | Meaning |
|---|---|
| `high_substitution_risk` | Free AI could likely produce equivalent or comparable output |
| `moderate_substitution_risk` | Partially defensible, but not clearly superior |
| `low_substitution_risk` | Clearly beyond what free AI would reliably produce |

**High substitution risk signs:**
- generic trait framing
- broad essay advice
- surface school-fit logic
- low decision pressure
- low context integration
- weak package reasoning

**Low substitution risk signs:**
- strong cross-artifact reasoning
- precise student-specific prioritization
- package-aware differentiation
- authentic, bounded coaching
- better context discipline than a user could easily recreate manually

> This label is strategically important because it helps measure whether the product is truly building defensibility.

---

## 13. Pass / Fail Interpretation

This rubric should support both continuous scoring and hard product judgments.

### 13.1 Minimum Acceptable Standard

An output is minimally acceptable only if:

- no core-risk dimension scores below **3**
- overall average is at least **3.2**
- no serious authenticity concerns exist
- substitution risk is not `high` unless intentionally flagged for redesign

### 13.2 Strong Production-Quality Standard

An output is strong production quality if:

- average score is at least **3.8**
- student specificity is at least **4**
- anti-generic performance is at least **4**
- admissions-specific reasoning is at least **4**
- substitution risk is `low_substitution_risk` or `moderate_substitution_risk`
- uniqueness is at least `meaningfully_individualized`

### 13.3 World-Class Target Standard

An output is world-class if:

- average score is at least **4.4**
- student specificity is at least **4**
- authenticity preservation is at least **4**
- admissions-specific reasoning is at least **4**
- anti-generic performance is at least **4**
- uniqueness is `deeply_student_specific` or very strong `meaningfully_individualized`
- substitution risk is `low_substitution_risk`
- reviewers agree it materially outperforms generic AI for this task

> **Important note:** "World-class" should remain difficult. If everything scores world-class, the rubric is not doing its job.

---

## 14. Reviewer Note Standards

Evaluators should not only score.
They should leave concise structured notes.

**Recommended note fields:**

| Field | Description |
|---|---|
| `best_element` | What was strongest about this artifact |
| `biggest_weakness` | The most significant failure or risk |
| `genericity_signal_observed` | Specific generic-AI patterns detected |
| `authenticity_concern_observed` | Any voice replacement or ghostwriting risk |
| `most_important_improvement_needed` | Single most actionable change |
| `would_ship` | `yes` / `no` / `with_revisions` |

This note discipline matters for:
- product iteration
- validator calibration
- future model comparison
- ML label quality

---

## 15. Calibration Guidance

To keep scoring consistent across reviewers, the team should calibrate regularly.

### 15.1 Calibration Principle

> A rubric is only useful if reviewers interpret scores similarly.

### 15.2 Calibration Process

Reviewers should periodically review:

1. one **weak** example
2. one **adequate** example
3. one **strong** example
4. one **deceptive** example that sounds polished but is generic
5. one example that is **highly student-specific and product-distinctive**

**Goal:** Build internal agreement about what "generic," "authentic," "student-specific," and "world-class" actually look like.

---

## 16. ML and Learning-System Alignment

Yes — this rubric should absolutely be designed to feed future ML systems.

That is one of its most important jobs.

The product should eventually learn from repeated evaluation patterns, user behavior, and artifact outcomes.
This rubric provides structured labels for that future.

### 16.1 Why This Rubric Is ML-Useful

Because it breaks output quality into interpretable dimensions such as:
- specificity
- authenticity
- uniqueness
- substitution risk
- decision value
- brand fit

These are far more useful than one vague "quality score."

### 16.2 Future ML Applications Supported by This Rubric

This rubric can eventually support:

- output quality prediction
- genericity risk prediction
- substitution-risk prediction
- retry-likelihood scoring
- module-version comparison
- student-personalization scoring
- validator threshold tuning
- context-bundle optimization
- prompt version routing
- reviewer-assisted active learning

### 16.3 ML Design Rule

> Machine learning should not replace product judgment.
> It should **learn from** product judgment.

That means this rubric should generate labels that are:
- consistent
- interpretable
- tied to real product value
- suitable for future supervised or ranking-based learning systems

---

## 17. Recommended Evaluation Record Shape

Each evaluated artifact should produce a structured evaluation record.

```json
{
  "module": "narrative_direction_selection",
  "artifact_id": "artifact_123",
  "rubric_version": "v1.0",
  "scores": {
    "student_specificity": 5,
    "authenticity_preservation": 4,
    "admissions_specific_reasoning": 5,
    "decision_value": 5,
    "structural_fit": 4,
    "specificity_and_grounding": 5,
    "distinctness_of_options": 4,
    "tone_and_brand_fit": 4,
    "anti_generic_performance": 5,
    "overall_leverage": 5
  },
  "uniqueness_label": "deeply_student_specific",
  "substitution_risk": "low_substitution_risk",
  "would_ship": "yes",
  "reviewer_notes": {
    "best_element": "The output identified one unusually strong narrative lane that clearly fits the student's actual story pattern.",
    "biggest_weakness": "The second option was slightly less differentiated than the first and third.",
    "genericity_signal_observed": "none",
    "authenticity_concern_observed": "none",
    "most_important_improvement_needed": "Sharpen contrast between the lower-ranked alternatives."
  }
}
```

This shape is valuable for operations now and learning systems later.

---

## 18. Human Review Questions

When reviewing an output, the evaluator should ask:

- Did this artifact feel built from this student's actual material?
- Did it make a better decision possible?
- Did it avoid sounding like generic AI?
- Did it preserve student ownership?
- Did it help more by choosing than by expanding?
- Did it surface real admissions logic?
- Would a serious user think this is meaningfully better than free AI?
- If this were shown to another student, would it obviously feel wrong?

These are high-signal review questions.

---

## 19. Anti-Patterns to Avoid in Evaluation

Do not evaluate quality as:

- grammar plus polish
- "sounds smart"
- "has complete fields"
- "feels helpful"
- "is positive"
- "is long and detailed"
- "mentions the student a few times"
- "uses the school name correctly"

These are weak proxies and often reward generic output.

The rubric must reward:
- **judgment**
- **specificity**
- **individuality**
- **authenticity**
- **admissions-native reasoning**
- **leverage**

---

## 20. World-Class Rubric Standard

A world-class rubric should do all of the following:

- identify whether an output is truly student-specific
- punish generic polish
- detect substitution risk from free AI
- distinguish writing quality from product quality
- support reviewer calibration
- create structured quality data for future ML systems
- help the team improve prompts, schemas, validators, context bundles, and module routing
- protect the product from drifting into commodity behavior

That is the standard.

---

## 21. Non-Negotiables

- Student specificity is a first-class evaluation dimension.
- Authenticity preservation is a first-class evaluation dimension.
- Outputs that could fit many students should score poorly even if polished.
- Free-AI substitution risk must be explicitly evaluated.
- A world-class output must materially outperform generic AI for the same task.
- The rubric must support future ML-assisted quality learning without collapsing into an opaque single score.
- The product's value must remain in judgment, structure, personalization, and authenticity — not in generic "AI quality."

---

## 22. Recommended Next Artifacts

Create next:

1. `PROMPT_VERSIONING_AND_CHANGELOG_V1.md`
2. `AI_MODULE_REGISTRY_V1.md`
3. `QUALITY_MONITORING_DASHBOARD_SPEC_V1.md`
4. `EXAMPLE_OUTPUT_BENCHMARKS_V1.md`

---

## Final Directive

The College Admissions Edge should not evaluate outputs by asking:

> "Did the AI say something decent?"

It should evaluate outputs by asking:

> "Did the product produce a student-specific, authentic, strategically useful artifact that clearly outperforms generic AI for this exact moment in the admissions workflow?"

That is the real standard.

If prompt architecture defines *how* the system is asked to think,
if context assembly defines *what* the system is allowed to know,
if schema architecture defines *what* the system is allowed to return,
if validators define *what* the product is willing to trust,
and if orchestration defines *how* all of that runs,

then the evaluation rubric defines:

> **how the product knows whether it is truly getting better.**

And that is exactly where machine learning eventually becomes powerful:
not by replacing the product,
but by learning from a rigorous product definition of quality.
