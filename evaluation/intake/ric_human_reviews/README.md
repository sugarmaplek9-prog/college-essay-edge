Human review intake folder for RIC human calibration/proof packets.

Run order:
1) Generate packet + rubric freeze + template:
	- `npx tsx scripts/ric-human-calibration-packet.ts`
2) Copy `reviewer_template_calibration_v1.csv` to one file per reviewer.
3) Fill every required field for every case.
4) Save files here with pattern `reviewer_<name>.csv`.
5) Aggregate + generate calibration artifacts:
	- `npx tsx scripts/ric-human-review-aggregate.ts`

Reviewer CSV must include:
- `reviewer_id`, `case_id`, `decision_category`
- all 10 score dimensions (integer 1-5)
- `failure_modes` as `tag:severity|tag:severity`
- `rationale` (required)
- `gold_candidate` (`true|false`)
- `generalizable_learning` (`true|false`)
