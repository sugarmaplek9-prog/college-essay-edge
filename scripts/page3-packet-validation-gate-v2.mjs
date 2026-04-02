import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = process.env.OUT_DIR ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');
const PACKET_PATH = process.env.PACKET_PATH ?? path.join(OUT_DIR, 'blind_review_packet.json');
const PROVENANCE_PATH = process.env.PROVENANCE_PATH ?? path.join(OUT_DIR, 'blind_review_packet.provenance.json');
const SUMMARY_PATH = process.env.SUMMARY_PATH ?? path.join(OUT_DIR, 'summary.json');

const DOMINANT_FAMILY_CAP = Number(process.env.DOMINANT_FAMILY_CAP ?? '0.35');
const LITERAL_PREFIX_MAX = Number(process.env.LITERAL_PREFIX_MAX ?? '3');
const SEMANTIC_SHELL_RATIO_MAX = Number(process.env.SEMANTIC_SHELL_RATIO_MAX ?? '0.45');

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function words(v) {
  return clean(v).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function prefix(v, n = 5) {
  return words(v).slice(0, n).join(' ');
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
  // make non-shell phrasing granular so diverse angle-first outputs do not collapse into one bucket
  return `other:${prefix(s, 3)}`;
}

function dominantFamilyRatio(summaryRows) {
  const counts = new Map();
  let n = 0;
  for (const r of summaryRows) {
    const fam = r?.product?.canonical_payload?.candidate_debug?.winner_family;
    if (!fam) continue;
    n += 1;
    counts.set(fam, (counts.get(fam) ?? 0) + 1);
  }
  let dom = 'none';
  let cnt = 0;
  for (const [f, c] of counts.entries()) {
    if (c > cnt) {
      dom = f;
      cnt = c;
    }
  }
  return {
    dominant_family: dom,
    dominant_count: cnt,
    family_cases: n,
    dominant_ratio: n ? cnt / n : 0,
    family_counts: Object.fromEntries(counts.entries()),
  };
}

function main() {
  const packet = JSON.parse(fs.readFileSync(PACKET_PATH, 'utf-8'));
  const provenance = fs.existsSync(PROVENANCE_PATH)
    ? JSON.parse(fs.readFileSync(PROVENANCE_PATH, 'utf-8'))
    : null;
  const summary = fs.existsSync(SUMMARY_PATH)
    ? JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'))
    : { rows: [] };

  const productRecs = [];
  for (const row of packet) {
    const keyPath = path.join(OUT_DIR, 'blind_review_answer_key.json');
    if (!fs.existsSync(keyPath)) continue;
    const key = JSON.parse(fs.readFileSync(keyPath, 'utf-8')).key ?? [];
    const k = key.find((x) => x.case_id === row.case_id);
    if (!k) continue;
    const rec = k.A_model === 'product' ? row.candidate_A?.recommendation : row.candidate_B?.recommendation;
    if (clean(rec)) productRecs.push(clean(rec));
  }

  const prefixCounts = new Map();
  const shellCounts = new Map();
  for (const rec of productRecs) {
    const p = prefix(rec, 5);
    const s = semanticShell(rec);
    prefixCounts.set(p, (prefixCounts.get(p) ?? 0) + 1);
    shellCounts.set(s, (shellCounts.get(s) ?? 0) + 1);
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

  const fam = dominantFamilyRatio(summary.rows ?? []);

  const baselineComplete = provenance?.baseline_complete ?? false;
  const scoredCaseCount = Number(provenance?.scored_case_count ?? 0);

  const gates = {
    provenance_present: Boolean(provenance),
    current_run_only_packet: String(provenance?.packet_source ?? '').startsWith('current_run_'),
    baseline_complete: baselineComplete,
    scored_case_count_positive: scoredCaseCount > 0,
    literal_prefix_repetition_ok: topPrefixCount <= LITERAL_PREFIX_MAX,
    semantic_shell_repetition_ok: productRecs.length > 0 ? (topShellCount / productRecs.length) <= SEMANTIC_SHELL_RATIO_MAX : false,
    dominant_family_ratio_ok: fam.dominant_ratio <= DOMINANT_FAMILY_CAP,
  };

  const failed = Object.entries(gates).filter(([, ok]) => !ok).map(([k]) => k);

  const out = {
    generated_at: new Date().toISOString(),
    thresholds: {
      dominant_family_cap: DOMINANT_FAMILY_CAP,
      literal_prefix_max: LITERAL_PREFIX_MAX,
      semantic_shell_ratio_max: SEMANTIC_SHELL_RATIO_MAX,
    },
    packet_path: PACKET_PATH,
    provenance_path: PROVENANCE_PATH,
    packet_stats: {
      packet_case_count: packet.length,
      product_recommendation_count: productRecs.length,
      top_literal_prefix: topPrefix,
      top_literal_prefix_count: topPrefixCount,
      top_semantic_shell: topShell,
      top_semantic_shell_count: topShellCount,
      top_semantic_shell_ratio: productRecs.length ? Number((topShellCount / productRecs.length).toFixed(3)) : null,
      dominant_family: fam.dominant_family,
      dominant_family_ratio: Number(fam.dominant_ratio.toFixed(3)),
      family_counts: fam.family_counts,
    },
    gates,
    failed_gates: failed,
    packet_valid_for_review: failed.length === 0,
  };

  const outJson = path.join(OUT_DIR, 'PACKET_VALIDATION_GATE_V2.json');
  const outMd = path.join(OUT_DIR, 'PACKET_VALIDATION_GATE_V2.md');
  fs.writeFileSync(outJson, JSON.stringify(out, null, 2), 'utf-8');

  const md = [];
  md.push('# PAGE3 PACKET VALIDATION GATE V2');
  md.push('');
  md.push(`- packet_valid_for_review: ${out.packet_valid_for_review}`);
  md.push(`- failed_gates: ${failed.join(', ') || 'none'}`);
  md.push('');
  for (const [k, v] of Object.entries(gates)) {
    md.push(`- ${k}: ${v ? 'PASS' : 'FAIL'}`);
  }
  md.push('');
  md.push(`- top_literal_prefix: "${out.packet_stats.top_literal_prefix}" (${out.packet_stats.top_literal_prefix_count})`);
  md.push(`- top_semantic_shell: ${out.packet_stats.top_semantic_shell} (${out.packet_stats.top_semantic_shell_count})`);
  md.push(`- dominant_family: ${out.packet_stats.dominant_family}`);
  md.push(`- dominant_family_ratio: ${out.packet_stats.dominant_family_ratio}`);
  fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf-8');

  console.log(JSON.stringify({ out_json: outJson, out_md: outMd, packet_valid_for_review: out.packet_valid_for_review, failed_gates: failed }, null, 2));
  if (failed.length > 0) process.exitCode = 2;
}

main();
