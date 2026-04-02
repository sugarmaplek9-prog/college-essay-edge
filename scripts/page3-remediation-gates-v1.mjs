import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SUMMARY_PATH = process.env.SUMMARY_PATH ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'summary.json');
const PACKET_PATH = process.env.PACKET_PATH ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'blind_review_packet.json');
const KEY_PATH = process.env.KEY_PATH ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'blind_review_answer_key.json');
const OUT_DIR = process.env.OUT_DIR ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');

const DOMINANT_FAMILY_CAP = Number(process.env.DOMINANT_FAMILY_CAP ?? '0.35');
const LITERAL_PREFIX_MAX = Number(process.env.LITERAL_PREFIX_MAX ?? '3');
const SEMANTIC_SHELL_RATIO_MAX = Number(process.env.SEMANTIC_SHELL_RATIO_MAX ?? '0.45');

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeWords(v) {
  return clean(v).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function literalPrefix(v, n = 5) {
  return normalizeWords(v).slice(0, n).join(' ');
}

function semanticShell(v) {
  const s = clean(v).toLowerCase();
  if (/^(build from|build this|build the essay)/.test(s)) return 'build_from';
  if (/^(anchor in|anchor the essay)/.test(s)) return 'anchor_in';
  if (/^(name the essay as|name the essay angle as|name this essay as)/.test(s)) return 'name_essay_as';
  if (/^(use the scene where|use the moment where|start with the scene where)/.test(s)) return 'use_scene_where';
  if (/^(focus on)/.test(s)) return 'focus_on';
  if (/^(frame the draft around|frame the essay around)/.test(s)) return 'frame_around';
  if (/^(tell the story through)/.test(s)) return 'tell_story_through';
  if (/^essay angle:/.test(s)) return 'essay_angle';
  return 'other';
}

function deterministicSwap(caseId) {
  let sum = 0;
  for (const ch of caseId) sum += ch.charCodeAt(0);
  return sum % 2 === 1;
}

function packetHash(packet) {
  return crypto.createHash('sha256').update(JSON.stringify(packet)).digest('hex');
}

function buildPacketFromCurrentRun(rows) {
  const packet = [];
  const key = [];
  for (const r of rows) {
    if (r?.openai?.status !== 'ok') continue;
    const swap = deterministicSwap(r.case_id);
    const productPayload = {
      recommendation: clean(r?.product?.output?.displayed_recommendation),
      essay_about: clean(r?.product?.output?.essay_about),
      why_this_direction: clean(r?.product?.output?.why_this_direction),
      weaker_read: clean(r?.product?.output?.weaker_read),
      stronger_read: clean(r?.product?.output?.stronger_read),
      evidence_lines: (r?.product?.output?.evidence_lines ?? []).map(clean).filter(Boolean).slice(0, 4),
      evidence_explanations: (r?.product?.output?.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
    };
    const openaiPayload = {
      recommendation: clean(r?.openai?.output?.displayed_recommendation),
      essay_about: clean(r?.openai?.output?.essay_about),
      why_this_direction: clean(r?.openai?.output?.why_this_direction),
      weaker_read: clean(r?.openai?.output?.weaker_read),
      stronger_read: clean(r?.openai?.output?.stronger_read),
      evidence_lines: (r?.openai?.output?.evidence_lines ?? []).map(clean).filter(Boolean).slice(0, 4),
      evidence_explanations: (r?.openai?.output?.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
    };

    const A = swap ? openaiPayload : productPayload;
    const B = swap ? productPayload : openaiPayload;

    packet.push({
      case_id: r.case_id,
      title: r.title,
      signal_quality: r.signal_quality,
      narrative_pattern: r.narrative_pattern,
      raw_notes: r.raw_notes,
      candidate_A: A,
      candidate_B: B,
      review_fields: [
        'recommendation_quality_winner',
        'why_this_direction_winner',
        'evidence_support_winner',
        'overall_winner',
      ],
    });

    key.push({
      case_id: r.case_id,
      A_model: swap ? 'openai' : 'product',
      B_model: swap ? 'product' : 'openai',
      product_auto_winner: r?.scores?.winner?.winner ?? 'unscored',
    });
  }
  return { packet, key };
}

function computeDominantFamily(rows) {
  const counts = new Map();
  let n = 0;
  for (const r of rows) {
    const fam = r?.product?.canonical_payload?.candidate_debug?.winner_family;
    if (!fam) continue;
    n += 1;
    counts.set(fam, (counts.get(fam) ?? 0) + 1);
  }
  let dominantFamily = 'none';
  let dominantCount = 0;
  for (const [f, c] of counts.entries()) {
    if (c > dominantCount) {
      dominantFamily = f;
      dominantCount = c;
    }
  }
  return {
    counts: Object.fromEntries(counts.entries()),
    dominantFamily,
    dominantCount,
    dominantRatio: n ? dominantCount / n : 0,
    familyCases: n,
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'));
  const rows = summary.rows ?? [];

  const regenerated = buildPacketFromCurrentRun(rows);
  const regeneratedHash = packetHash(regenerated.packet);

  const provenance = {
    generated_at: new Date().toISOString(),
    build_id: process.env.BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.DEPLOYMENT_ID ?? 'unknown_build',
    deploy_id: process.env.DEPLOYMENT_ID ?? process.env.VERCEL_URL ?? 'unknown_deploy',
    product_url: summary.product_url ?? 'unknown_url',
    run_directory: OUT_DIR,
    summary_path: SUMMARY_PATH,
    packet_path: PACKET_PATH,
    answer_key_path: KEY_PATH,
    scored_case_count: summary.scored_case_count ?? 0,
    baseline_complete: Boolean(summary.baseline_complete),
    baseline_attempted: summary.baseline_attempted ?? 0,
    case_count: summary.case_count ?? rows.length,
    regenerated_packet_case_count: regenerated.packet.length,
    regenerated_packet_hash_sha256: regeneratedHash,
    source: 'current_run_only',
  };

  const existingPacket = fs.existsSync(PACKET_PATH)
    ? JSON.parse(fs.readFileSync(PACKET_PATH, 'utf-8'))
    : [];
  const existingHash = packetHash(existingPacket);
  const existingMatchesCurrent = existingHash === regeneratedHash;

  const productRecs = regenerated.packet.map((r) => {
    const k = regenerated.key.find((x) => x.case_id === r.case_id);
    if (!k) return '';
    return k.A_model === 'product' ? r.candidate_A.recommendation : r.candidate_B.recommendation;
  }).filter(Boolean);

  const prefixCounts = new Map();
  const shellCounts = new Map();
  for (const rec of productRecs) {
    const pfx = literalPrefix(rec, 5);
    const shell = semanticShell(rec);
    prefixCounts.set(pfx, (prefixCounts.get(pfx) ?? 0) + 1);
    shellCounts.set(shell, (shellCounts.get(shell) ?? 0) + 1);
  }

  let topPrefix = '';
  let topPrefixCount = 0;
  for (const [p, c] of prefixCounts.entries()) {
    if (c > topPrefixCount) {
      topPrefix = p;
      topPrefixCount = c;
    }
  }

  let topShell = '';
  let topShellCount = 0;
  for (const [s, c] of shellCounts.entries()) {
    if (c > topShellCount) {
      topShell = s;
      topShellCount = c;
    }
  }

  const dominant = computeDominantFamily(rows);

  const gates = {
    provenance_present: true,
    current_run_only_packet: existingMatchesCurrent,
    baseline_complete: Boolean(summary.baseline_complete),
    scored_case_count_positive: (summary.scored_case_count ?? 0) > 0,
    literal_prefix_repetition_ok: topPrefixCount <= LITERAL_PREFIX_MAX,
    semantic_shell_repetition_ok: productRecs.length > 0 ? (topShellCount / productRecs.length) <= SEMANTIC_SHELL_RATIO_MAX : false,
    dominant_family_ratio_ok: dominant.dominantRatio <= DOMINANT_FAMILY_CAP,
  };

  const failed = Object.entries(gates).filter(([, ok]) => !ok).map(([k]) => k);

  const validation = {
    generated_at: new Date().toISOString(),
    thresholds: {
      dominant_family_cap: DOMINANT_FAMILY_CAP,
      literal_prefix_max: LITERAL_PREFIX_MAX,
      semantic_shell_ratio_max: SEMANTIC_SHELL_RATIO_MAX,
    },
    provenance,
    packet_stats: {
      existing_packet_case_count: Array.isArray(existingPacket) ? existingPacket.length : 0,
      regenerated_packet_case_count: regenerated.packet.length,
      existing_packet_hash_sha256: existingHash,
      regenerated_packet_hash_sha256: regeneratedHash,
      top_literal_prefix: topPrefix,
      top_literal_prefix_count: topPrefixCount,
      top_semantic_shell: topShell,
      top_semantic_shell_count: topShellCount,
      semantic_shell_ratio: productRecs.length > 0 ? Number((topShellCount / productRecs.length).toFixed(3)) : null,
      dominant_family: dominant.dominantFamily,
      dominant_family_ratio: Number(dominant.dominantRatio.toFixed(3)),
      family_counts: dominant.counts,
    },
    gates,
    failed_gates: failed,
    packet_valid_for_review: failed.length === 0,
  };

  fs.writeFileSync(path.join(OUT_DIR, 'blind_review_packet.provenance.json'), JSON.stringify(provenance, null, 2), 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR, 'PACKET_VALIDATION_GATE_V1.json'), JSON.stringify(validation, null, 2), 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR, 'blind_review_packet.current_run_only.json'), JSON.stringify(regenerated.packet, null, 2), 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR, 'blind_review_answer_key.current_run_only.json'), JSON.stringify({ generated_at: new Date().toISOString(), key: regenerated.key }, null, 2), 'utf-8');

  const md = [];
  md.push('# PAGE3 PACKET VALIDATION GATE V1');
  md.push('');
  md.push(`- generated_at: ${validation.generated_at}`);
  md.push(`- packet_valid_for_review: ${validation.packet_valid_for_review}`);
  md.push(`- failed_gates: ${failed.join(', ') || 'none'}`);
  md.push('');
  md.push('## Gate checks');
  for (const [k, v] of Object.entries(gates)) {
    md.push(`- ${k}: ${v ? 'PASS' : 'FAIL'}`);
  }
  md.push('');
  md.push('## Repetition + family stats');
  md.push(`- top_literal_prefix: "${validation.packet_stats.top_literal_prefix}" (${validation.packet_stats.top_literal_prefix_count})`);
  md.push(`- top_semantic_shell: ${validation.packet_stats.top_semantic_shell} (${validation.packet_stats.top_semantic_shell_count})`);
  md.push(`- dominant_family: ${validation.packet_stats.dominant_family}`);
  md.push(`- dominant_family_ratio: ${validation.packet_stats.dominant_family_ratio}`);
  fs.writeFileSync(path.join(OUT_DIR, 'PACKET_VALIDATION_GATE_V1.md'), `${md.join('\n')}\n`, 'utf-8');

  console.log(JSON.stringify({
    out_validation_json: path.join(OUT_DIR, 'PACKET_VALIDATION_GATE_V1.json'),
    out_validation_md: path.join(OUT_DIR, 'PACKET_VALIDATION_GATE_V1.md'),
    out_provenance_json: path.join(OUT_DIR, 'blind_review_packet.provenance.json'),
    out_regenerated_packet_json: path.join(OUT_DIR, 'blind_review_packet.current_run_only.json'),
    out_regenerated_key_json: path.join(OUT_DIR, 'blind_review_answer_key.current_run_only.json'),
    packet_valid_for_review: validation.packet_valid_for_review,
    failed_gates: failed,
  }, null, 2));

  if (failed.length > 0) {
    process.exitCode = 2;
  }
}

main();
