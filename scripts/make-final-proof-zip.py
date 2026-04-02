import os
import zipfile

root = '/Volumes/TOSHIBA EXT/College Essay'
out = os.path.join(root, 'evaluation_outputs', 'PAGE_THREE_FINAL_NO_GUESS_FIX_PROOF_PACKAGE_V1.zip')
files = [
    'evaluation_outputs/PAGE_THREE_DOMINANT_FAMILY_CAP_ENFORCEMENT_AUDIT_V1.md',
    'evaluation_outputs/PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_AUDIT_V1.md',
    'evaluation_outputs/PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_AUDIT_V1.md',
    'evaluation_outputs/PAGE_THREE_AMBIGUITY_MODE_COMPETITIVE_USEFULNESS_AUDIT_V1.md',
    'evaluation_outputs/PAGE_THREE_EVALUATOR_REWEIGHT_AND_REALITY_CHECK_AUDIT_V1.md',
    'evaluation_outputs/PAGE_THREE_DEPLOYED_PACKET_WINNER_MATCH_AUDIT_V1.md',
    'evaluation_outputs/PAGE_THREE_PACKET_LEVEL_PROOF_V_FINAL.md',
    'evaluation_outputs/PAGE_THREE_HUMAN_BLIND_RESULTS_V_FINAL.md',
    'evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
    'evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json',
    'evaluation_outputs/page3_holdout_v2_remediation/summary.json',
]

with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for rel in files:
        z.write(os.path.join(root, rel), arcname=rel)

print(out)
print(f'entries={len(files)}')
