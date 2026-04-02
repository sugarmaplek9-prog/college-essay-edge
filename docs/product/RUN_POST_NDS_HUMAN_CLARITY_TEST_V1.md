# RUN_POST_NDS_HUMAN_CLARITY_TEST_V1.md

## Document control

- **Document name:** RUN_POST_NDS_HUMAN_CLARITY_TEST_V1.md
- **Project:** College Essay Edge
- **Scope:** One-pass execution runbook for post-NDS human clarity testing
- **Audience:** founder, reviewer ops, product
- **Status:** Active runbook
- **Standard:** exact, lightweight, no-assumptions, runnable

---

## 1. Purpose

This document defines the exact execution flow for running the post-NDS human clarity test from start to finish.

This runbook exists so the test can be run cleanly without reconstructing the workflow from multiple scripts.

It covers:
- packet generation
- screenshot capture
- reviewer distribution
- CSV collection
- aggregation
- output artifact generation

---

## 2. What this run is testing

This run tests one product question:

**After seeing the post-NDS result screen, does a student know exactly what to do next?**

The test is not about:
- overall NDS model quality
- full essay quality
- pricing
- broad usability

It is specifically about:
- clarity
- actionability
- next-step usability

---

## 3. Required files and scripts

The workflow assumes these already exist in the repo:

### Runbook / protocol
- `POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_TEST_V1.md`

### Packet + capture + aggregate scripts
- `scripts/post-nds-result-screen-human-clarity-packet.ts`
- `scripts/capture-post-nds-result-screen-human-clarity.ts`
- `scripts/post-nds-result-screen-human-clarity-aggregate.ts`

### Source validation pack
- `evaluation/intake/RIC_NDS_CONTROLLED_VALIDATION_PACK_V1.json`

---

## 4. Outputs this workflow should produce

## Before reviewers respond
Expected generated assets:
- `POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_PACKET_V1.json`
- `reviewer_template_post_nds_result_screen_human_clarity_v1.csv`
- screenshot bundle / capture index for the selected cases

## After reviewers respond
Expected final artifacts:
- `evaluation_outputs/POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_REVIEW_V1.md`
- `evaluation_outputs/post_nds_result_screen_human_clarity_v1.json`

Do not generate the final review artifact until real reviewer CSVs are present.

---

## 5. Preconditions

Do not run this workflow until all of the following are true:

- app builds cleanly
- current post-NDS screen changes are in place
- the capture script works locally
- the selected test cases are frozen
- reviewer rubric/questions are frozen
- reviewers are available

If the screen changes after packet generation, regenerate the packet and screenshots.

---

## 6. Standard directory expectations

This runbook assumes the repo root is:

`/Volumes/TOSHIBA EXT/College Essay`

If your local path differs, adjust commands accordingly.

---

## 7. Full execution order

Use this exact order.

### Step 1 — generate the human clarity packet

Run:

```bash
cd "/Volumes/TOSHIBA EXT/College Essay"
npx tsx scripts/post-nds-result-screen-human-clarity-packet.ts
```

Expected result:
- packet file generated
- reviewer CSV template generated

Verify:
- `POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_PACKET_V1.json`
- `reviewer_template_post_nds_result_screen_human_clarity_v1.csv`

Do not proceed if these files are missing.

---

### Step 2 — start local app if needed for capture

If the capture script requires a running local app, start it first.

Example:
```bash
cd "/Volumes/TOSHIBA EXT/College Essay"
npm run dev
```

Confirm local route health before capture:
```bash
curl -I http://127.0.0.1:3000/start/direction
```

Expected:
- local page responds successfully

Do not proceed if the page is not available locally.

---

### Step 3 — capture the actual post-NDS result screens

Run:

```bash
cd "/Volumes/TOSHIBA EXT/College Essay"
HUMAN_CLARITY_BASE_URL="http://127.0.0.1:3000" npx tsx scripts/capture-post-nds-result-screen-human-clarity.ts
```

Expected result:
- screenshots generated for all selected cases
- capture index written

Verify:
- screenshot files exist
- `index.json` exists for the capture bundle

Do not proceed if captures failed for any selected case.

---

### Step 4 — select reviewer packet contents

Prepare the reviewer packet using:
- screen captures
- packet JSON
- reviewer CSV template
- the human clarity test protocol

At minimum, each reviewer should receive:
- the 5 captured screen examples
- the CSV template
- the question protocol from `POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_TEST_V1.md`

The reviewer should not need to infer the procedure.

---

### Step 5 — distribute to reviewers

Send each reviewer:
- the packet
- the CSV template
- exact instructions
- return deadline
- return location

Suggested reviewer instruction summary:
1. Review each screen independently
2. Answer the required clarity questions
3. Complete the CSV without collaboration
4. Return the completed CSV file unchanged in structure

Do not allow reviewers to compare notes before submission.

---

### Step 6 — collect completed reviewer CSVs

Choose one fixed collection folder.

Recommended:
- `evaluation/intake/ric_human_reviews/post_nds_result_screen_human_clarity/`

Place completed reviewer CSVs there.

Rules:
- do not rename columns
- do not combine files manually
- do not edit reviewer responses
- keep one file per reviewer

Do not aggregate until all intended reviewer files are present.

---

### Step 7 — run the aggregator

Once reviewer CSVs are present, run:

```bash
cd "/Volumes/TOSHIBA EXT/College Essay"
npx tsx scripts/post-nds-result-screen-human-clarity-aggregate.ts
```

Expected result:
- aggregated structured JSON output
- human-readable review artifact

Expected files:
- `evaluation_outputs/POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_REVIEW_V1.md`
- `evaluation_outputs/post_nds_result_screen_human_clarity_v1.json`

If the aggregator reports no data, stop and confirm the reviewer CSVs are in the expected location.

---

### Step 8 — interpret the result

Read the generated review artifact and classify the result:

- pass
- conditional pass
- fail

Use the pass/fail logic from:
- `POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_TEST_V1.md`

Do not overrule the result informally.
Record the actual outcome.

---

## 8. Reviewer instructions to send

Use this exact simplified instruction block when distributing the packet:

---

**Please review each screen as if you were a high school senior trying to figure out what to do next.**

For each case, answer:
1. What is this essay about?
2. What would you write first?
3. What should you avoid?
4. What would you write right after the opening?
5. Which button would you press next, and why?
6. Do you feel ready to start writing, or still unsure?

Please fill in the CSV exactly as provided.
Do not compare answers with other reviewers before submission.

---

## 9. What counts as success

This run is successful only if:
- packet generation succeeds
- screenshot capture succeeds
- reviewer CSVs are collected cleanly
- aggregation succeeds
- final artifact is produced without manual reconstruction

This does not mean the screen itself passed.
It means the workflow executed correctly.

The screen only passes if the aggregated review result says so.

---

## 10. Common failure points

### Failure point A — local app not running
Symptom:
- capture script fails or screenshots missing

Fix:
- start local app
- verify local route
- rerun capture

### Failure point B — reviewers edit CSV structure
Symptom:
- aggregation breaks

Fix:
- resend clean template
- require unchanged columns

### Failure point C — reviewer files placed in wrong folder
Symptom:
- aggregator says no data

Fix:
- move files into expected folder
- rerun aggregator

### Failure point D — screen changed after packet generation
Symptom:
- captured screens do not match current app

Fix:
- regenerate packet
- recapture screens
- restart reviewer distribution

---

## 11. Minimal quality control checklist

Before sending packet to reviewers, check:

- `[ ]` packet JSON exists
- `[ ]` reviewer CSV template exists
- `[ ]` 5 screenshots exist
- `[ ]` capture index exists
- `[ ]` screenshots match current screen version
- `[ ]` reviewer instructions are attached
- `[ ]` collection folder is defined

Before aggregation, check:
- `[ ]` all intended reviewer CSVs are present
- `[ ]` CSV structure is intact
- `[ ]` files are in the expected folder

---

## 12. Recommended first run size

For the first human clarity pass:
- use 5 cases
- use 3 to 5 reviewers if possible
- require full independent review

This is enough to surface whether the screen is truly clearer without creating unnecessary operational drag.

---

## 13. Output artifact to review next

After aggregation, the main artifact to review is:

- `evaluation_outputs/POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_REVIEW_V1.md`

That artifact should drive the next decision:
- keep current screen
- tighten specific sections
- redesign again

Do not skip directly to intuition-based edits after the run.

---

## 14. Final note

This workflow is complete only when real human responses have been aggregated into the final review artifact.

Until then, you have:
- a prepared workflow
- a generated packet
- captured screens
- a ready aggregator

But not yet the final clarity result.

That distinction matters.
