import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SUMMARY_PATH = process.env.SUMMARY_PATH ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'summary.json');
const OUT_DIR = process.env.OUT_DIR ?? path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function words(v) {
  return clean(v).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function overlap(a, b) {
  const A = new Set(words(a).filter((w) => w.length >= 4));
  const B = new Set(words(b).filter((w) => w.length >= 4));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function angleFirstRewrite(rec, family) {
  const r = clean(rec);
  let body = r
    .replace(/^Build from the angle that\s*/i, '')
    .replace(/^Name the essay as\s*/i, '')
    .replace(/^Focus on\s*/i, '')
    .replace(/^Frame the draft around\s*/i, '')
    .replace(/^Tell the story through\s*/i, '');

  body = body
    .replace(/\bprocess redesign and operational thinking\b/gi, 'the claim you can prove about reliability and trust')
    .replace(/\bthe system fix\b/gi, 'the changed standard in your behavior')
    .replace(/\bwhat changed in your judgment and why it mattered\b/gi, 'the concrete claim you can prove and why a reader should care');

  if (!body) body = 'the clearest claim you can prove in one scene.';

  if (family === 'process') {
    body = body.replace(/^the claim you can prove/i, 'the moment reliability became your standard and changed what you did');
  }

  return `Essay angle: ${body.charAt(0).toLowerCase()}${body.slice(1)}`;
}

function addConceptualLift(essayAbout, recommendation, whyText) {
  const about = clean(essayAbout);
  const ov = overlap(recommendation, about);
  const hasLift = /\b(principle|standard|meaning|responsibility|judgment|ownership|interpretation|changed)\b/i.test(about);
  if (ov <= 0.52 && hasLift) return about;

  const why = clean(whyText);
  const lift = /\bresponsibility|trust|ownership|standard|judgment|interpretation\b/i.exec(why)?.[0] ?? 'standard';
  return `This essay is about the ${lift} you adopted and how that changed your behavior in ways a reader can verify.`;
}

function shellKind(rec) {
  const s = clean(rec).toLowerCase();
  if (/^essay angle:/.test(s)) return 'essay_angle';
  if (/^build from/.test(s)) return 'build_from';
  if (/^name the essay as/.test(s)) return 'name_essay_as';
  if (/^focus on/.test(s)) return 'focus_on';
  if (/^frame the draft around/.test(s)) return 'frame_around';
  if (/^tell the story through/.test(s)) return 'tell_story_through';
  return 'other';
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'));
  const rows = summary.rows ?? [];

  const hotfixRows = rows.map((r) => {
    const packet = r?.product?.canonical_payload?.recommendation_packet ?? {};
    const family = r?.product?.canonical_payload?.candidate_debug?.winner_family ?? 'unknown';

    const recOld = clean(packet.displayed_recommendation);
    const recNew = angleFirstRewrite(recOld, family);
    const aboutOld = clean(packet.essay_about);
    const aboutNew = addConceptualLift(aboutOld, recNew, packet.why_this_direction);

    return {
      case_id: r.case_id,
      winner_family: family,
      recommendation_old: recOld,
      recommendation_new: recNew,
      essay_about_old: aboutOld,
      essay_about_new: aboutNew,
      recommendation_shell_old: shellKind(recOld),
      recommendation_shell_new: shellKind(recNew),
      about_overlap_old: Number(overlap(recOld, aboutOld).toFixed(3)),
      about_overlap_new: Number(overlap(recNew, aboutNew).toFixed(3)),
    };
  });

  const outJson = path.join(OUT_DIR, 'GENERATION_PASS_HOTFIX_PREVIEW_V1.json');
  const outMd = path.join(OUT_DIR, 'GENERATION_PASS_HOTFIX_PREVIEW_V1.md');
  fs.writeFileSync(outJson, JSON.stringify({ generated_at: new Date().toISOString(), rows: hotfixRows }, null, 2), 'utf-8');

  const md = [];
  md.push('# GENERATION PASS HOTFIX PREVIEW V1');
  md.push('');
  md.push('This is a remediation preview that rewrites mechanism-first shells into angle-first recommendations and forces conceptual lift in essay_about when overlap is too high.');
  md.push('');
  for (const row of hotfixRows) {
    md.push(`## ${row.case_id} (${row.winner_family})`);
    md.push(`- old recommendation: ${row.recommendation_old || '(blank)'}`);
    md.push(`- new recommendation: ${row.recommendation_new || '(blank)'}`);
    md.push(`- old essay_about: ${row.essay_about_old || '(blank)'}`);
    md.push(`- new essay_about: ${row.essay_about_new || '(blank)'}`);
    md.push(`- overlap old/new: ${row.about_overlap_old} -> ${row.about_overlap_new}`);
    md.push('');
  }
  fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf-8');

  console.log(JSON.stringify({ out_json: outJson, out_md: outMd, cases: hotfixRows.length }, null, 2));
}

main();
