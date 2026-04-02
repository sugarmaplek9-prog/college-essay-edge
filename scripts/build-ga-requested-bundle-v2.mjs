import fs from 'node:fs';
import path from 'node:path';

const root = '/Volumes/TOSHIBA EXT/College Essay';
const outDir = path.join(root, 'evaluation_outputs', 'ga_requested_bundle_v2');
fs.mkdirSync(outDir, { recursive: true });

const summaryPath = path.join(root, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'summary.json');
const blindPacketPath = path.join(root, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'blind_review_packet.json');
const blindKeyPath = path.join(root, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'blind_review_answer_key.json');

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const blindPacket = JSON.parse(fs.readFileSync(blindPacketPath, 'utf8'));
const blindKey = JSON.parse(fs.readFileSync(blindKeyPath, 'utf8'));
const keyMap = new Map((blindKey.key || []).map((k) => [k.case_id, k]));
const blindMap = new Map((blindPacket || []).map((r) => [r.case_id, r]));

function buildCaseBundle(caseId, label) {
  const row = summary.rows.find((r) => r.case_id === caseId);
  if (!row) throw new Error(`Missing case: ${caseId}`);

  const cp = row.product?.canonical_payload || {};
  const debug = cp.candidate_debug || {};
  const scoresByCandidate = debug.scores_by_candidate || [];
  const byId = new Map(scoresByCandidate.map((c) => [c.id, c]));

  const winnerId = debug.winner_id || null;
  const runnerUpId = debug.weaker_read_source_id || null;
  const winner = winnerId ? byId.get(winnerId) || null : null;
  const runnerUp = runnerUpId ? byId.get(runnerUpId) || null : null;

  const key = keyMap.get(caseId) || null;
  const blind = blindMap.get(caseId) || null;

  let productBlindSlot = null;
  let productBlindCandidate = null;
  if (key && blind) {
    if (key.A_model === 'product') {
      productBlindSlot = 'A';
      productBlindCandidate = blind.candidate_A || null;
    } else if (key.B_model === 'product') {
      productBlindSlot = 'B';
      productBlindCandidate = blind.candidate_B || null;
    }
  }

  return {
    label,
    case_id: row.case_id,
    title: row.title,
    raw_notes: row.raw_notes,
    classifier_output: cp.classification || null,
    route_decision: cp.routing?.route_decision || cp.routing || null,
    all_generated_candidates: scoresByCandidate,
    family_id_for_each_candidate: scoresByCandidate.map((c) => ({
      candidate_id: c.id,
      recommendation_family: c.recommendation_family ?? null,
      angle_type: c.angle_type ?? null,
    })),
    score_breakdown_for_each_candidate: scoresByCandidate,
    winning_candidate: {
      candidate_id: winnerId,
      candidate: winner,
    },
    runner_up_candidate: {
      candidate_id: runnerUpId,
      candidate: runnerUp,
    },
    full_canonical_payload: cp,
    exact_blind_packet_rendering: blind,
    exact_product_blind_rendering: {
      slot: productBlindSlot,
      candidate: productBlindCandidate,
    },
    exact_evaluator_winner_call: row.scores?.winner || null,
    evaluator_scores: {
      product: row.scores?.product || null,
      openai: row.scores?.openai || null,
    },
  };
}

const badCaseBundle = buildCaseBundle('HV2_01', 'bad_case__openai_win');
const goodCaseBundle = buildCaseBundle('HV2_10', 'good_case__product_win');

const badPath = path.join(outDir, 'CASE_BUNDLE_HV2_01_BAD_CURRENT_DEPLOYED.json');
const goodPath = path.join(outDir, 'CASE_BUNDLE_HV2_10_GOOD_CURRENT_DEPLOYED.json');

fs.writeFileSync(badPath, JSON.stringify(badCaseBundle, null, 2));
fs.writeFileSync(goodPath, JSON.stringify(goodCaseBundle, null, 2));

const manifest = {
  generated_at: new Date().toISOString(),
  deployed_url: summary.product_url,
  bad_case_id: 'HV2_01',
  good_case_id: 'HV2_10',
  files: [
    'src/lib/fm/direction.ts',
    'scripts/frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs',
    'scripts/page3-holdout-v2.mjs',
    'src/lib/fm/canonicalPage3Payload.ts',
    'evaluation_outputs/ga_requested_bundle_v2/CASE_BUNDLE_HV2_01_BAD_CURRENT_DEPLOYED.json',
    'evaluation_outputs/ga_requested_bundle_v2/CASE_BUNDLE_HV2_10_GOOD_CURRENT_DEPLOYED.json',
    'evaluation_outputs/PAGE_THREE_DOMINANT_FAMILY_CAP_ENFORCEMENT_AUDIT_V1.md',
    'evaluation_outputs/PAGE_THREE_EVALUATOR_REWEIGHT_AND_REALITY_CHECK_AUDIT_V1.md',
    'src/app/start/direction/page.tsx',
    'evaluation_outputs/PAGE_THREE_HUMAN_BLIND_RESULTS_V_FINAL.md',
    'evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
    'evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json',
    'evaluation_outputs/page3_holdout_v2_remediation/summary.json',
  ],
};

fs.writeFileSync(path.join(outDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));

console.log(JSON.stringify({
  out_dir: outDir,
  bad_case_bundle: badPath,
  good_case_bundle: goodPath,
  manifest: path.join(outDir, 'MANIFEST.json'),
}, null, 2));
