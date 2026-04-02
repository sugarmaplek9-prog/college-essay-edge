const fs = require('fs');
const path = require('path');

const root = process.cwd();
const evalDir = path.join(root, 'evaluation_outputs');
const outDir = path.join(evalDir, 'requested_files_bundle_v4');

const summaryPath = path.join(evalDir, 'page3_holdout_v2_remediation', 'summary.json');
const blindPacketPath = path.join(evalDir, 'page3_holdout_v2_remediation', 'blind_review_packet.json');

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const blindPacket = JSON.parse(fs.readFileSync(blindPacketPath, 'utf8'));

const preferredBadCases = ['HV2_03', 'HV2_02', 'HV2_06', 'HV2_09', 'HV2_12'];
const rows = summary.rows || [];
const pickBadCaseId = preferredBadCases.find((id) => rows.some((r) => r.case_id === id)) || rows[0]?.case_id;
if (!pickBadCaseId) throw new Error('No holdout rows found in summary.json');

const row = rows.find((r) => r.case_id === pickBadCaseId);
if (!row) throw new Error(`Missing selected bad case: ${pickBadCaseId}`);

const cp = row.product?.canonical_payload || {};
const recommendationPacket = cp.recommendation_packet || {};
const candidateScores = cp.candidate_debug?.scores_by_candidate || [];
const winnerId = cp.candidate_debug?.winner_id || null;
const runnerUpId = cp.candidate_debug?.weaker_read_source_id || null;

const winner = candidateScores.find((c) => c.id === winnerId) || null;
const runnerUp = candidateScores.find((c) => c.id === runnerUpId) || null;

const blindCase = (blindPacket || []).find((b) => b.case_id === pickBadCaseId) || null;

const badPayload = {
  generated_at: new Date().toISOString(),
  source_summary: 'evaluation_outputs/page3_holdout_v2_remediation/summary.json',
  source_blind_packet: 'evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
  case_id: row.case_id,
  title: row.title,
  raw_notes: row.raw_notes,
  chosen_family: winner?.recommendation_family || null,
  chosen_candidate_id: winnerId,
  chosen_recommendation: recommendationPacket.displayed_recommendation || null,
  chosen_essay_about: recommendationPacket.essay_about || null,
  chosen_why: recommendationPacket.why_this_direction || null,
  chosen_evidence_lines: recommendationPacket.evidence_lines || [],
  chosen_evidence_explanations: recommendationPacket.evidence_explanations || [],
  winner_call: row.scores?.winner || null,
  candidate_scores: candidateScores,
  runner_up_candidate_id: runnerUpId,
  runner_up_candidate_score_dump: runnerUp,
  full_canonical_payload: cp,
  blind_packet_rendering_for_case: blindCase
    ? {
        candidate_A: blindCase.candidate_A,
        candidate_B: blindCase.candidate_B,
        review_fields: blindCase.review_fields,
      }
    : null,
};

fs.mkdirSync(outDir, { recursive: true });

const badFileName = `${pickBadCaseId}_current_bad_canonical_payload_with_runner_up_v4.json`;
const badFilePath = path.join(outDir, badFileName);
fs.writeFileSync(badFilePath, JSON.stringify(badPayload, null, 2));

const manifest = {
  generated_at: new Date().toISOString(),
  deployed_product_url_from_summary: summary.product_url,
  selected_bad_case: pickBadCaseId,
  files: [
    'src/lib/fm/direction.ts',
    'scripts/frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs',
    `evaluation_outputs/requested_files_bundle_v4/${badFileName}`,
    'evaluation_outputs/requested_files_bundle_v4/MANIFEST.json',
  ],
};

fs.writeFileSync(path.join(outDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));

console.log(JSON.stringify({
  outDir,
  selected_bad_case: pickBadCaseId,
  bad_payload_file: badFileName,
  product_url: summary.product_url,
}, null, 2));
