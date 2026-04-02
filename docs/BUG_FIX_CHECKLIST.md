# BUG FIX CHECKLIST

## 1. Capture exact failure
- [ ] Save full error output or scoring feedback
- [ ] Save command used to generate issue
- [ ] Save input file / case ID / test conditions
- [ ] Confirm issue is reproducible

## 2. Classify issue
- [ ] Spec failure
- [ ] Logic failure
- [ ] Data failure
- [ ] Integration failure
- [ ] Quality failure

## 3. Define expected behavior
- [ ] What should have happened?
- [ ] Which spec or file defines correct behavior?
- [ ] Is the issue isolated or systemic?

## 4. Root cause
- [ ] Input problem?
- [ ] Prompt/problem framing issue?
- [ ] Parsing/transformation bug?
- [ ] Model routing issue?
- [ ] Scoring mismatch?
- [ ] Output schema mismatch?

## 5. Patch plan
- [ ] Smallest possible fix identified
- [ ] File(s) to edit identified
- [ ] No unnecessary refactor included
- [ ] Risk of side effects noted

## 6. Verification
- [ ] Re-run original failing test
- [ ] Re-run nearby related tests
- [ ] Confirm no regression
- [ ] Log result in TEST_FEEDBACK_LOG.md

## 7. Decision
- [ ] Close
- [ ] Needs deeper refactor
- [ ] Needs spec change
- [ ] Needs data cleanup
