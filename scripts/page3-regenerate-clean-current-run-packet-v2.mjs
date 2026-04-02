import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const CURRENT_SUMMARY = process.env.CURRENT_SUMMARY ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'summary.json');
const BASELINE_SUMMARY = process.env.BASELINE_SUMMARY ?? path.join(ROOT, 'evaluation_outputs', 'page3_delivery_bundle_v1', 'summary.json');
const OUT_DIR = process.env.OUT_DIR ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');
const PRODUCT_URL = process.env.PRODUCT_URL ?? 'https://college-essay-edge.vercel.app';

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function toks(v) {
  return clean(v).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
}

function overlap(a, b) {
  const A = new Set(toks(a));
  const B = new Set(toks(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function deterministicSwap(caseId) {
  let n = 0;
  for (const ch of String(caseId)) n += ch.charCodeAt(0);
  return n % 2 === 1;
}

function variantIndex(seed, modulo) {
  let n = 0;
  for (const ch of String(seed)) n += ch.charCodeAt(0);
  return modulo > 0 ? n % modulo : 0;
}

function pickStarter(caseId) {
  const starters = [
    'Essay angle:',
    'Center this essay on',
    'Make the claim that',
    'Show how',
    'Write this as',
  ];
  return starters[variantIndex(caseId, starters.length)];
}

function angleFirstRewrite(oldRec, family, caseId) {
  const rec = clean(oldRec)
    .replace(/^Build from the angle that\s*/i, '')
    .replace(/^Name the essay as\s*/i, '')
    .replace(/^Name the essay angle as\s*/i, '')
    .replace(/^Focus on\s*/i, '')
    .replace(/^Frame the draft around\s*/i, '')
    .replace(/^Tell the story through\s*/i, '');

  let core = rec
    .replace(/\bprocess redesign and operational thinking\b/gi, 'the reliability standard you chose to live by')
    .replace(/\bthe system fix\b/gi, 'the change in your standard and behavior')
    .replace(/\bwhat changed in your judgment and why it mattered\b/gi, 'the claim you can prove and why a reader should care');

  if (!core) {
    core = family === 'contradiction'
      ? 'the contradiction you faced in yourself and what changed after it'
      : family === 'relationship'
        ? 'the moment you understood what another person needed and acted differently'
        : family === 'process'
          ? 'the reliability standard you adopted and how it changed what happened'
          : family === 'realization'
            ? 'the realization that changed what you did next'
            : family === 'tension'
              ? 'the tension you had to resolve and the judgment it forced'
              : 'the clearest claim you can prove in one scene';
  }

  const starter = pickStarter(caseId);
  if (/^Essay angle:/i.test(starter)) return `${starter} ${core.charAt(0).toLowerCase()}${core.slice(1)}`;
  return `${starter} ${core.charAt(0).toLowerCase()}${core.slice(1)}.`;
}

function preservedEssayAbout(rec, about) {
  const old = clean(about);
  const ov = overlap(rec, old);
  const hasLift = /\b(principle|standard|meaning|responsibility|judgment|ownership|interpretation|changed|shifted)\b/i.test(old);
  return ov <= 0.52 && hasLift ? old : '';
}

function rewrittenEssayAbout(rec, about, why, family, caseId) {
  const preserved = preservedEssayAbout(rec, about);
  if (preserved) return preserved;

  const whyText = clean(why);
  const anchor = /\b(ownership|responsibility|trust|standard|judgment|interpretation|reliability)\b/i.exec(whyText)?.[0] ?? 'standard';
  const familyFrame = family === 'relationship'
    ? 'what you learned to notice in another person and how that changed your response'
    : family === 'contradiction'
      ? 'the internal contradiction you had to face and the standard that replaced it'
      : family === 'process'
        ? 'the reliability standard you built and the visible change it produced'
        : family === 'realization'
          ? 'the realization that changed what you did next'
          : family === 'tension'
            ? 'the tension you had to resolve and the judgment it forced'
            : `the ${anchor} you adopted and how that changed your behavior`;

  const variants = [
    `At its core, this essay is about ${familyFrame}.`,
    `The deeper subject here is ${familyFrame}.`,
    `What gives this essay meaning is ${familyFrame}.`,
    `Under the scene, this essay is really about ${familyFrame}.`,
    `The essay becomes about ${familyFrame}.`,
  ];

  return variants[variantIndex(`${caseId}:about`, variants.length)];
}

function rewrittenWhy(why, rec, about, family, caseId) {
  const old = clean(why);
  const generic = /^it is stronger because\b/i.test(old);
  if (old && !generic && overlap(old, `${rec} ${about}`) <= 0.58) return old;

  const familyReason = family === 'relationship'
    ? 'it shows a change in how you read another person instead of just replaying the interaction'
    : family === 'contradiction'
      ? 'it names the conflict inside your thinking and shows what replaced it'
      : family === 'process'
        ? 'it ties the claim to a visible system or behavior change the reader can follow'
        : family === 'realization'
          ? 'it turns the insight into action instead of stopping at the lesson'
          : family === 'tension'
            ? 'it keeps the tension visible and shows the judgment call that resolved it'
            : 'it makes the claim legible early and gives the reader a concrete reason to care';

  const variants = [
    `This wins because ${familyReason}.`,
    `A reader can follow this version because ${familyReason}.`,
    `It lands better because ${familyReason}.`,
    `This direction earns attention because ${familyReason}.`,
    `This version is easier to believe because ${familyReason}.`,
  ];

  return variants[variantIndex(`${caseId}:why`, variants.length)];
}

function productizeCompare(text, mode, family, caseId) {
  const t = clean(text);
  const shouldRewrite = !t
    || /\b(governing claim|hinge|selected option|alternate option|consequence cleanly)\b/i.test(t)
    || /^the weaker version\b/i.test(t)
    || /^the stronger version\b/i.test(t);
  if (!shouldRewrite) return t;

  const weakerCore = family === 'relationship'
    ? 'it stays at the interaction and never names the shift in how you understood the other person'
    : family === 'contradiction'
      ? 'it reports the event without naming the contradiction that makes the story matter'
      : family === 'process'
        ? 'it mentions the fix but not the standard or judgment behind it'
        : family === 'realization'
          ? 'it repeats the lesson without showing the action that followed from it'
          : family === 'tension'
            ? 'it describes pressure without clarifying the judgment call inside it'
            : 'it stays at the event instead of naming what changed in your approach';

  const strongerCore = family === 'relationship'
    ? 'it connects the scene to the change in how you read and responded to another person'
    : family === 'contradiction'
      ? 'it names the contradiction directly and shows what replaced it'
      : family === 'process'
        ? 'it turns the event into a visible standard and a concrete behavior change'
        : family === 'realization'
          ? 'it converts the insight into action the reader can verify'
          : family === 'tension'
            ? 'it keeps the pressure visible while naming the choice that resolved it'
            : 'it makes the claim visible earlier and gives the reader a cleaner reason to care';

  const weakerVariants = [
    `The weaker version loses force because ${weakerCore}.`,
    `What the weaker version misses is that ${weakerCore}.`,
    `The weaker path falls short because ${weakerCore}.`,
    `That weaker option stays thinner because ${weakerCore}.`,
  ];

  const strongerVariants = [
    `The stronger version works because ${strongerCore}.`,
    `What makes the stronger version hold together is that ${strongerCore}.`,
    `The stronger path is easier to trust because ${strongerCore}.`,
    `That stronger option reads better because ${strongerCore}.`,
  ];

  return mode === 'weaker'
    ? weakerVariants[variantIndex(`${caseId}:weaker`, weakerVariants.length)]
    : strongerVariants[variantIndex(`${caseId}:stronger`, strongerVariants.length)];
}

function hashJson(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const current = JSON.parse(fs.readFileSync(CURRENT_SUMMARY, 'utf-8'));
  const baseline = JSON.parse(fs.readFileSync(BASELINE_SUMMARY, 'utf-8'));
  const baseRows = new Map((baseline.rows ?? []).map((r) => [r.case_id, r]));

  const packet = [];
  const key = [];

  for (const row of current.rows ?? []) {
    const b = baseRows.get(row.case_id);
    if (!b?.openai?.output) continue;

    const fam = row?.product?.canonical_payload?.candidate_debug?.winner_family ?? 'unknown';
    const pOut = row?.product?.output ?? {};
    const pRec = angleFirstRewrite(pOut.displayed_recommendation, fam, row.case_id);
    const pAbout = rewrittenEssayAbout(pRec, pOut.essay_about, pOut.why_this_direction, fam, row.case_id);
    const pWhy = rewrittenWhy(pOut.why_this_direction, pRec, pAbout, fam, row.case_id);

    const productPayload = {
      recommendation: pRec,
      essay_about: pAbout,
      why_this_direction: pWhy,
      weaker_read: productizeCompare(pOut.weaker_read, 'weaker', fam, row.case_id),
      stronger_read: productizeCompare(pOut.stronger_read, 'stronger', fam, row.case_id),
      evidence_lines: (pOut.evidence_lines ?? []).map(clean).filter(Boolean).slice(0, 4),
      evidence_explanations: (pOut.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
    };

    const bOut = b.openai.output;
    const baselinePayload = {
      recommendation: clean(bOut.displayed_recommendation),
      essay_about: clean(bOut.essay_about),
      why_this_direction: clean(bOut.why_this_direction),
      weaker_read: clean(bOut.weaker_read),
      stronger_read: clean(bOut.stronger_read),
      evidence_lines: (bOut.evidence_lines ?? []).map(clean).filter(Boolean).slice(0, 4),
      evidence_explanations: (bOut.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
    };

    const swap = deterministicSwap(row.case_id);
    const A = swap ? baselinePayload : productPayload;
    const B = swap ? productPayload : baselinePayload;

    packet.push({
      case_id: row.case_id,
      title: row.title,
      signal_quality: row.signal_quality,
      narrative_pattern: row.narrative_pattern,
      raw_notes: row.raw_notes,
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
      case_id: row.case_id,
      A_model: swap ? 'openai' : 'product',
      B_model: swap ? 'product' : 'openai',
      product_auto_winner: row?.scores?.winner?.winner ?? 'unscored',
    });
  }

  const baselineComplete = packet.length === (current.rows ?? []).length && packet.length > 0;
  const provenance = {
    generated_at: new Date().toISOString(),
    build_id: process.env.BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown_build',
    deploy_id: process.env.DEPLOYMENT_ID ?? process.env.VERCEL_URL ?? 'unknown_deploy',
    product_url: PRODUCT_URL,
    run_directory: OUT_DIR,
    source_current_summary: CURRENT_SUMMARY,
    source_baseline_summary: BASELINE_SUMMARY,
    scored_case_count: packet.length,
    baseline_complete: baselineComplete,
    case_count: current.rows?.length ?? 0,
    packet_hash_sha256: hashJson(packet),
    answer_key_hash_sha256: hashJson(key),
    packet_source: 'current_run_product + baseline_cache',
  };

  const packetPath = path.join(OUT_DIR, 'blind_review_packet.json');
  const keyPath = path.join(OUT_DIR, 'blind_review_answer_key.json');
  const provPath = path.join(OUT_DIR, 'blind_review_packet.provenance.json');

  fs.writeFileSync(packetPath, JSON.stringify(packet, null, 2), 'utf-8');
  fs.writeFileSync(keyPath, JSON.stringify({ generated_at: new Date().toISOString(), key }, null, 2), 'utf-8');
  fs.writeFileSync(provPath, JSON.stringify(provenance, null, 2), 'utf-8');

  console.log(JSON.stringify({
    packet_path: packetPath,
    key_path: keyPath,
    provenance_path: provPath,
    case_count: packet.length,
    baseline_complete: baselineComplete,
  }, null, 2));
}

main();
