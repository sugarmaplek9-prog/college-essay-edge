# NDS_EXECUTION_DIRECTION_V1

## Goal
Use the public-request corpus to make NDS measurably better at narrative judgment.

## Sequence
1. Freeze the 25-case starter benchmark.
2. Add blind human adjudication.
3. Run your current NDS system across all cases.
4. Run a generic AI baseline across all cases.
5. Score both using the offline rubric.
6. Cluster every miss using the failure taxonomy.
7. Fix the biggest failure cluster first.
8. Expand the set to 100 cases.
9. Re-run before any major prompt or model release.

## Engineering priority order
1. Candidate generation quality
2. Clarification discipline
3. Trust-risk handling
4. Selection logic
5. Explanation quality

## Why this order
Poor candidate generation corrupts everything downstream. Explanation tuning does not fix missing candidate coverage.

## Minimum weekly operating cadence
- Monday: add 10 new cases
- Tuesday: adjudicate
- Wednesday: run benchmark
- Thursday: failure analysis
- Friday: patch highest-yield failure class

## Ship gate
Do not claim world-class judgment until NDS beats baseline on:
- overall score
- red-team safety
- blank-page routing
- hard topic-selection set
