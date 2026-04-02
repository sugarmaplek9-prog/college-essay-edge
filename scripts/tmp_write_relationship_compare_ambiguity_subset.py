import json
import pathlib

source_path = pathlib.Path('scripts/data/page3-controlled-testing-lane-v1.intake-24.json')
out_path = pathlib.Path('evaluation_outputs/page3_controlled_testing_v1/ct24_relationship_compare_ambiguity_cases_v1.json')
case_ids = {
    'CT24_06', 'CT24_11', 'CT24_19',
    'CT24_01', 'CT24_04', 'CT24_07', 'CT24_09', 'CT24_12', 'CT24_17', 'CT24_20', 'CT24_23',
}
rows = json.loads(source_path.read_text())
subset = [row for row in rows if row['case_id'] in case_ids]
out_path.write_text(json.dumps(subset, indent=2) + '\n')
print(out_path)
