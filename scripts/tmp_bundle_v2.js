const fs = require('fs');
const path = require('path');

const root = process.cwd();
const evalDir = path.join(root, 'evaluation_outputs');
const summaryPath = path.join(evalDir, 'page3_holdout_v2_remediation', 'summary.json');
const blindPath = path.join(evalDir, 'page3_holdout_v2_remediation', 'blind_review_packet.json');

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const blind = JSON.parse(fs.readFileSync(blindPath, 'utf8'));

const pickBad = 'HV2_03';
const best = [...(summary.rows || [])]
  .filter((r) => r?.scores?.winner?.winner === 'product')
  .sort((a, b) => (b?.scores?.winner?.weighted_margin ?? -999) - (a?.scores?.winner?.weighted_margin ?? -999))[0];
const pickGood = best?.case_id || 'HV2_01';

function pack(caseId, label) {
  const row = (summary.rows || []).find((r) => r.case_id === caseId);
  if (!row) throw new Error(`missing case ${caseId}`);
  const cp = row.product?.canonical_payload || {};
  const blindCase = (blind || []).find((b) => b.case_id === caseId) || null;
  return {
    label,
    case_id: row.case_id,
    title: row.title,
    raw_notes: row.raw_notes,
    eval_winner: row.scores?.winner || null,
    product_output_surface: row.product?.output || null,
    final_canonical_payload: cp,
    candidate_scores: cp.candidate_debug?.scores_by_candidate || [],
    chosen_winner_id: cp.candidate_debug?.winner_id || null,
    runner_up_id: cp.candidate_debug?.weaker_read_source_id || null,
    blind_packet_rendering: blindCase
      ? {
          candidate_A: blindCase.candidate_A,
          candidate_B: blindCase.candidate_B,
          review_fields: blindCase.review_fields,
        }
      : null,
  };
}

const outDir = path.join(evalDir, 'requested_files_bundle_v2');
fs.mkdirSync(outDir, { recursive: true });

const badFile = `${pickBad}_full_bad_canonical_payload_v2.json`;
const goodFile = `${pickGood}_full_good_canonical_payload_v2.json`;

fs.writeFileSync(path.join(outDir, badFile), JSON.stringify(pack(pickBad, 'bad_case_diagnostic'), null, 2));
fs.writeFileSync(path.join(outDir, goodFile), JSON.stringify(pack(pickGood, 'good_case_reference'), null, 2));

const manifest = {
  generated_at: new Date().toISOString(),
  source_summary: 'evaluation_outputs/page3_holdout_v2_remediation/summary.json',
  selected_bad_case: pickBad,
  selected_good_case: pickGood,
  files: [
    'src/lib/fm/direction.ts',
    'src/lib/fm/canonicalPage3Payload.ts',
    'scripts/page3-holdout-v2.mjs',
    'scripts/frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs',
    `evaluation_outputs/requested_files_bundle_v2/${badFile}`,
    `evaluation_outputs/requested_files_bundle_v2/${goodFile}`,
    'evaluation_outputs/page3_rewrite_revision_proof_v1/phrase_family_compliance_audit.json',
    'evaluation_outputs/page3_five_case_before_after_v1/PAGE3_FIVE_CASE_BEFORE_AFTER_V1.md',
    'evaluation_outputs/page3_five_case_before_after_v1/summary.json',
    'src/app/start/direction/page.tsx',
    'evaluation_outputs/PAGE_THREE_HUMAN_BLIND_RESULTS_V_NEXT.md',
  ],
};

fs.writeFileSync(path.join(outDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ pickBad, pickGood, outDir, badFile, goodFile }, null, 2));
