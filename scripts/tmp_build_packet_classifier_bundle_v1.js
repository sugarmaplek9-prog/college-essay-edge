const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outDir = path.join(root, 'evaluation_outputs', 'requested_files_bundle_v3');
const summaryPath = path.join(root, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'summary.json');
const blindMd = path.join(root, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'BLIND_REVIEW_PACKET_V2.md');
const blindJson = path.join(root, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'blind_review_packet.json');

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const rows = summary.rows || [];

fs.mkdirSync(outDir, { recursive: true });

const classifierRows = rows.map((r) => {
  const cp = r?.product?.canonical_payload || {};
  const routing = cp.routing || {};
  const classification = cp.classification || {};
  const debug = cp.candidate_debug || {};
  const winnerId = debug.winner_id || null;
  const scoreRows = debug.scores_by_candidate || [];
  const winner = scoreRows.find((c) => c.id === winnerId) || null;

  return {
    case_id: r.case_id,
    runtime_pattern: classification.primary_pattern || 'unknown',
    unknown_classifier_hit: Boolean(routing.unknown_classifier || classification.primary_pattern === 'unknown'),
    winning_family_id: winner?.recommendation_family || null,
    winning_candidate_id: winnerId,
  };
});

const outJsonPath = path.join(outDir, 'POST_FIX_PACKET_CLASSIFIER_BY_CASE_V1.json');
const outCsvPath = path.join(outDir, 'POST_FIX_PACKET_CLASSIFIER_BY_CASE_V1.csv');

fs.writeFileSync(outJsonPath, JSON.stringify({
  generated_at: new Date().toISOString(),
  source_summary: 'evaluation_outputs/page3_holdout_v2_remediation/summary.json',
  product_url: summary.product_url,
  scored_case_count: summary.scored_case_count,
  rows: classifierRows,
}, null, 2));

const header = ['case_id', 'runtime_pattern', 'unknown_classifier_hit', 'winning_family_id', 'winning_candidate_id'];
const csv = [
  header.join(','),
  ...classifierRows.map((x) => [
    x.case_id,
    x.runtime_pattern,
    x.unknown_classifier_hit,
    x.winning_family_id ?? '',
    x.winning_candidate_id ?? '',
  ].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')),
].join('\n');
fs.writeFileSync(outCsvPath, `${csv}\n`);

const manifest = {
  generated_at: new Date().toISOString(),
  description: 'Fresh blind packet + per-case classifier/family diagnostics from post-fix deployment.',
  product_url: summary.product_url,
  files: [
    'evaluation_outputs/page3_holdout_v2_remediation/BLIND_REVIEW_PACKET_V2.md',
    'evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
    'evaluation_outputs/page3_holdout_v2_remediation/summary.json',
    'evaluation_outputs/requested_files_bundle_v3/POST_FIX_PACKET_CLASSIFIER_BY_CASE_V1.json',
    'evaluation_outputs/requested_files_bundle_v3/POST_FIX_PACKET_CLASSIFIER_BY_CASE_V1.csv',
    'evaluation_outputs/requested_files_bundle_v3/MANIFEST.json'
  ]
};
fs.writeFileSync(path.join(outDir, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));

console.log(JSON.stringify({
  outDir,
  rows: classifierRows.length,
  product_url: summary.product_url,
}, null, 2));
