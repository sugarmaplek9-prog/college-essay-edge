import fs from 'node:fs';
import path from 'node:path';

const INPUT_PATH = path.join(process.cwd(), 'evaluation_outputs', 'page3_five_case_before_after_v1', 'summary.json');
const OUT_PATH = path.join(process.cwd(), 'evaluation_outputs', 'page3_five_case_before_after_v1', 'rigor_score.json');

function clean(v) {
  return (v ?? '').replace(/\s+/g, ' ').trim();
}

function hasConcreteSignals(text) {
  const t = clean(text);
  if (!t) return 0;
  let s = 0;
  if (/["“”]/.test(t)) s += 1;
  if (/\b(nurse|clinic|robotics|pantry|younger student|hospital|medication|freshman)\b/i.test(t)) s += 1;
  if (/\b(hinge|shift|changed|concrete|specific|moment|decision|consequence)\b/i.test(t)) s += 1;
  return s;
}

function scoreSystem(output) {
  const recommendation = clean(output?.displayed_recommendation);
  const why = clean(output?.why_this_direction);
  const weaker = clean(output?.weaker_read);
  const stronger = clean(output?.stronger_read);
  const evidence = (output?.evidence_lines ?? []).map(clean).filter(Boolean);
  const joined = `${recommendation} ${why} ${weaker} ${stronger}`;

  // 1..5 scales
  const sourceSpecificity = Math.min(5,
    (evidence.length >= 2 ? 3 : evidence.length >= 1 ? 2 : 1) +
    Math.min(2, hasConcreteSignals(joined))
  );

  const draftability = Math.min(5,
    /\b(write|draft|start|open|next|build)\b/i.test(joined)
      ? 4 + (/\b(scene|sentence|first|then)\b/i.test(joined) ? 1 : 0)
      : 2
  );

  const genericPattern = /\b(the direction is the specific moment your choice changed the story|best angle|perspective or behavior clearly shifted)\b/i;
  const nonRepeatability = Math.max(1,
    5
    - (genericPattern.test(recommendation) ? 2 : 0)
    - (genericPattern.test(why) ? 1 : 0)
    - (evidence.length === 0 ? 1 : 0)
  );

  const recommendationClarity = Math.min(5,
    recommendation.length > 20 && recommendation.length < 220
      ? (/\b(hinge|moment|where|changed|decision)\b/i.test(recommendation) ? 5 : 4)
      : 2
  );

  const weakerStrongerUsefulness = Math.min(5,
    weaker && stronger
      ? 3
        + (/\b(weaker|setup|generic|summary)\b/i.test(weaker) ? 1 : 0)
        + (/\b(stronger|hinge|concrete|anchors|wins)\b/i.test(stronger) ? 1 : 0)
      : 1
  );

  const avg = Number(((sourceSpecificity + draftability + nonRepeatability + recommendationClarity + weakerStrongerUsefulness) / 5).toFixed(2));

  const genericFlag = nonRepeatability <= 2 || sourceSpecificity <= 2;

  return {
    source_specificity: sourceSpecificity,
    draftability: draftability,
    non_repeatability: nonRepeatability,
    recommendation_clarity: recommendationClarity,
    weaker_stronger_usefulness: weakerStrongerUsefulness,
    average: avg,
    generic_flag: genericFlag,
  };
}

function normalizeBaseline(b) {
  if (!b || b.status !== 'ok') {
    return {
      displayed_recommendation: '',
      why_this_direction: '',
      weaker_read: '',
      stronger_read: '',
      evidence_lines: [],
      status: b?.status ?? 'missing',
    };
  }
  return {
    displayed_recommendation: clean(b.recommendation),
    why_this_direction: clean(b.why_this_direction),
    weaker_read: clean(b.weaker_read),
    stronger_read: clean(b.stronger_read),
    evidence_lines: Array.isArray(b.evidence_lines) ? b.evidence_lines.map(clean).filter(Boolean) : [],
    status: 'ok',
  };
}

const data = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));

const scoredCases = data.results.map((row) => {
  const product = row.after.direction_surface ?? row.after.reflecting_surface ?? {};
  const chatgpt = normalizeBaseline(row.baseline?.chatgpt);
  const claude = normalizeBaseline(row.baseline?.claude);

  return {
    case_id: row.case_id,
    title: row.title,
    product: {
      ...scoreSystem(product),
      output: product,
    },
    chatgpt: {
      status: chatgpt.status,
      ...(chatgpt.status === 'ok' ? scoreSystem(chatgpt) : {}),
      output: chatgpt,
    },
    claude: {
      status: claude.status,
      ...(claude.status === 'ok' ? scoreSystem(claude) : {}),
      output: claude,
    },
  };
});

const productGenericCount = scoredCases.filter((c) => c.product.generic_flag).length;
const baselineReady = scoredCases.every((c) => c.chatgpt.status === 'ok' && c.claude.status === 'ok');

const out = {
  generated_at: new Date().toISOString(),
  baseline_ready: baselineReady,
  baseline_blocker: baselineReady ? null : 'Missing provider keys and/or provider call failures. Baseline comparison cannot be considered complete.',
  product_generic_cases: productGenericCount,
  brutal_verdict: productGenericCount >= 3
    ? `FAIL_BRUTAL: ${productGenericCount}/5 still read generic under current rubric.`
    : `PASS_BRUTAL: only ${productGenericCount}/5 read generic under current rubric.`,
  cases: scoredCases,
};

fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf-8');
console.log(JSON.stringify({ out_path: OUT_PATH, brutal_verdict: out.brutal_verdict, baseline_ready: out.baseline_ready }, null, 2));
