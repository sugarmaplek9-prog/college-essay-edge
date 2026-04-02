# NDS_PUBLIC_SOURCE_INGESTION_WORKFLOW_V1

**Corpus ingestion pipeline specification for real-input sourcing**  
**Implements section 15.2 of NDS_REAL_INPUT_CORPUS_POLICY_V1**

---

## Purpose

This document specifies the standardized ingestion pipeline for sourcing, capturing, redacting, and ingesting real user inputs (public internet or anonymized product) into NDS corpora.

The ingestion workflow ensures:

- Consistent provenance capture
- Proper redaction and privacy review
- Transformation tracking
- Deduplication
- Metadata standardization

---

## 1. WORKFLOW PHASES

```
Discovery → Capture → Redaction → Normalization → Deduplication → Adjudication → Snapshot
```

---

## 2. DISCOVERY PHASE

### 2.1 Public source discovery

Identify candidate real-user content from:

- **Essay help forums**
  - College Confidential (confidentialessays.org)
  - Reddit: r/ApplyingToCollege, r/CampusAdmissions
  - CollegeVine forum
  - Common Application blog Q&A sections

- **Public admissions discussion**
  - Twitter/X college admissions threads (with care for retweet chains)
  - Medium essays about college essays
  - TikTok advice creators (with permission)
  - Public YouTube comment threads (where substantive)

- **Academic help sites**
  - Stack Overflow-style essay discussion sites
  - GitHub "how to write" discussions
  - Public Notion templates with examples

- **Public essays/excerpts**
  - Published student blog posts
  - Public essay collections
  - Archived high-school publications

### 2.2 Source qualification

Before ingestion, verify:

- ✓ Content is genuinely public and not behind auth wall
- ✓ No platform terms-of-service violation
- ✓ Content is substantive (>50 tokens for essay/question content)
- ✓ Identifiable personal details are potentially present (for redaction planning)

### 2.3 Product source discovery

For anonymized product input:

- Query product database for user sessions with `intake_mode = question` or `state = rough_draft`
- Filter to inputs that received clarification or direction_light route
- Verify user privacy policy permits research use
- Verify no direct identifiers remain

---

## 3. CAPTURE PHASE

### 3.1 Public source capture

#### Format

```json
{
  "case_id": "PSI-20260317-001",
  "source_type": "public_internet",
  "source_origin": "Reddit r/ApplyingToCollege",
  "source_reference": "https://reddit.com/r/ApplyingToCollege/comments/abc123",
  "raw_text": "[raw user input, unredacted]",
  "capture_date": "2026-03-17",
  "collector_id": "collector-002",
  "collection_method": "manual_forum_monitoring",
  "platform": "reddit",
  "thread_title": "[optional] parent thread context",
  "thread_author": "[redacted if applicable]",
  "context_snippet": "[optional excerpt from responses for understanding intent]"
}
```

#### Collection methods

| method | automation | quality | notes |
|---|---|---|---|
| manual_forum_monitoring | low | high | human reviewer scans forums, selects substantive Q&A |
| api_search | medium | medium | programmatic search with curated keywords/filters |
| rss_feed | high | low | automated capture from RSS feeds; requires post-capture filtering |
| community_referral | low | high | users submit essay-help questions they found; vetted by moderator |

### 3.2 Product source capture

#### Format

```json
{
  "case_id": "APS-20260317-001",
  "source_type": "anonymized_product_input",
  "source_origin": "anonymized product intake",
  "source_reference": "session-id-hash-abc123xyz",
  "raw_text": "[raw user input, contains no direct identifiers]",
  "capture_date": "2026-03-17",
  "collector_id": "data_pipeline",
  "collection_method": "batch_export_approved",
  "session_context": {
    "entry_route": "intake_question",
    "system_response": "clarification",
    "user_response_count": 2,
    "final_route": "direction_light"
  },
  "privacy_approval_reference": "privacy-review-20260317-batch-002",
  "user_consent_basis": "privacy_policy_research_use_granted"
}
```

---

## 4. REDACTION PHASE

### 4.1 Redaction rules

All sourced cases must be redacted for safe use **before** adjudication.

#### Required redactions

- **Names**: all personal names, family names, school names
  - Replace with `[Name]`, `[School]`, `[City]`, etc.
  - Exception: famous figures whose names are not identifying in context

- **Locations**: home city, home state/country, school location
  - Replace with `[City]`, `[State/Country]`
  - Exception: generic "California" or regional references that aren't identifying

- **Identifiable institutions**
  - High school names
  - Unique activity names or team names that might identify
  - Replace with `[Activity]`, `[School]`, `[Team]`

- **Family member details**: names, ages, professions that are identifying
  - Replace with `[Family member]`, `[Sibling]`, etc.

- **Contact information**: email, phone, social media handles
  - Replace with `[contact info redacted]`

#### Allowed (non-redacted)

- Generic activity categories (debate, piano, research, service)
- Common themes (failure, illness, travel, family pressure)
- Narrative structure and reflection
- Emotional tone and uncertainty patterns
- Academic context (college application stage)

### 4.2 Redaction implementation

Redaction record format:

```json
{
  "case_id": "PSI-20260317-001",
  "transformation_level": "redacted",
  "redacted_text": "[redacted user input]",
  "redaction_log": [
    {
      "original_span": "[Name of student]",
      "replacement": "[Student Name]",
      "redaction_reason": "personal_identifier"
    },
    {
      "original_span": "Thomas Jefferson High School",
      "replacement": "[High School]",
      "redaction_reason": "school_identifier"
    }
  ],
  "redacted_by": "reviewer-003",
  "redaction_date": "2026-03-17",
  "redaction_confidence": "high",
  "privacy_review_status": "pending"
}
```

---

## 5. NORMALIZATION PHASE

### 5.1 Light normalization

Apply only **minimal** text cleanup:

- Fix obvious Unicode/encoding issues
- Normalize line breaks (convert to consistent \n)
- Trim trailing whitespace
- Standardize quote characters (" " → `"`)
- Fix obvious OCR artifacts (if source was scanned)

### 5.2 Prohibited normalization

Do **not**:

- Fix spelling/grammar (unless OCR corruption)
- Restructure sentences
- Add punctuation or clarity
- Expand abbreviations
- Reformat paragraphs
- Simplify awkward phrasing
- "Clean up" student language

### 5.3 Normalization record

```json
{
  "case_id": "PSI-20260317-001",
  "transformation_level": "lightly_normalized",
  "normalized_text": "[cleaned text]",
  "normalization_changes": [
    "fixed line break encoding (CRLF → LF)",
    "converted smart quotes to straight quotes"
  ],
  "normalized_by": "pipeline",
  "normalization_date": "2026-03-17"
}
```

---

## 6. DEDUPLICATION PHASE

### 6.1 Deduplication logic

Before snapshot generation, remove duplicate or near-duplicate cases.

#### Exact duplicate
- MD5 hash of normalized text matches existing case
- Action: flag for removal, keep first occurrence

#### High-overlap duplicates
- Cosine similarity > 0.95 (token-based)
- Action: flag for review; typically remove unless case represents important pattern

#### Same-user duplicates (product sources only)
- Same anonymized user_id, multiple case captures
- Action: keep only most substantive (by token count); annotate as redundant

### 6.2 Deduplication record

```json
{
  "dedup_phase_summary": {
    "total_cases_before": 250,
    "exact_duplicates_removed": 3,
    "high_overlap_removed": 7,
    "cases_after_dedup": 240,
    "dedup_date": "2026-03-17"
  },
  "removed_cases": [
    {
      "case_id": "PSI-20260317-045",
      "reason": "exact_duplicate_of_PSI-20260317-044"
    }
  ]
}
```

---

## 7. ADJUDICATION PHASE

### 7.1 Adjudication tasks

Each deduplicated case must be reviewed by a human adjudicator for:

- **Substantiveness**: is the input substantive enough for NDS evaluation?
- **Safety**: does it contain prohibited content? (hate speech, violence, etc.)
- **Privacy**: is redaction complete? Are identifiers removed?
- **Signal quality**: does it contain enough signal for meaningful NDS evaluation?
- **Gold readiness**: is this case suitable for gold training?

### 7.2 Adjudication workbench

The review tool must show:

- Case ID
- Redacted input text
- Source type and origin
- Transformation level
- Redaction notes
- Privacy review status

Reviewers label each case with:

```json
{
  "case_id": "PSI-20260317-001",
  "adjudication_status": "gold_ready",
  "adjudication_reason": "substantive multi-center question with explicit reflection",
  "safety_review": "approved",
  "privacy_review": "approved",
  "eligible_for_gold_training": true,
  "adjudicator_id": "reviewer-002",
  "adjudication_date": "2026-03-17",
  "adjudication_notes": "strong weak-signal pattern; good contrast case"
}
```

### 7.3 Rejection criteria

Mark as `rejected_for_gold` if:

- Too short/low signal (< 20 tokens)
- Duplicate of existing case (dedup failed)
- Prohibited content (hate, violence, etc.)
- Identifiers not fully redacted
- Not substantive enough for evaluation
- Heavily rewritten or corrupted in transformation

---

## 8. SNAPSHOT PHASE

### 8.1 Snapshot generation

Create a snapshot with:

- All adjudicated cases
- Complete provenance fields
- Transformation tracking
- Source composition audit report

### 8.2 Snapshot format

```json
{
  "snapshot_id": "NDS_CORPUS_V1_PROD_20260317",
  "generated_at": "2026-03-17T12:00:00Z",
  "description": "Production real-input corpus for NDS benchmark v1",
  "total_cases": 240,
  "source_composition": {
    "public_internet": { "count": 180, "pct": 75 },
    "anonymized_product_input": { "count": 48, "pct": 20 },
    "legacy_internal_synthetic": { "count": 12, "pct": 5 }
  },
  "realism_audit_status": "PASS",
  "realism_audit_reference": "audit-20260317-v1",
  "privacy_review_coverage": "100% approved",
  "cases": [
    {
      "case_id": "PSI-20260317-001",
      "source_type": "public_internet",
      "source_origin": "Reddit r/ApplyingToCollege",
      "source_reference": "https://reddit.com/r/ApplyingToCollege/comments/abc123",
      "input_text": "[redacted input]",
      "capture_date": "2026-03-17",
      "transformation_level": "redacted",
      "adjudication_status": "gold_ready",
      "privacy_review_status": "approved",
      "eligible_for_gold_training": true
    }
  ]
}
```

---

## 9. COMPLIANCE CHECKLIST

Before snapshot release, verify:

- ✓ All cases have source_type assigned
- ✓ All cases have source_origin (human-readable)
- ✓ All cases have source_reference (URL or hash)
- ✓ All cases have capture_date
- ✓ All cases have transformation_level
- ✓ All cases have adjudication_status
- ✓ All cases have privacy_review_status = approved
- ✓ Redaction review completed (100%)
- ✓ Deduplication completed
- ✓ Realism audit generated and passing
- ✓ Adjudication report attached
- ✓ Source composition reported

---

## 10. PIPELINE TOOLING REQUIREMENTS

Build or integrate:

- ✓ **Ingestion scanner** — scrapes forums/RSS, stores raw captures
- ✓ **Redaction UI** — human reviewers mark spans for redaction
- ✓ **Redaction engine** — applies redactions, logs all changes
- ✓ **Normalization module** — applies light cleanup
- ✓ **Deduplication engine** — detects and flags duplicates
- ✓ **Adjudication workbench** — UI for human review
- ✓ **Snapshot builder** — generates final corpus JSON
- ✓ **Audit runner** — computes realism audit on snapshot
- ✓ **Reporting** — produces pipeline status reports

---

## 11. PIPELINE MONITORING

Monitor pipeline health:

- Cases ingested per week
- Average redaction time per case
- Deduplication rate
- Adjudication approval rate
- Time from capture to gold-ready
- Diversity of sources

Report monthly to ensure steady real-input sourcing.
