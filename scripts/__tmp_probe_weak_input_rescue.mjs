import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const base = process.env.PRODUCT_URL ?? 'https://college-essay-edge-33e6v9x09-college-edge.vercel.app';
const casesPath = path.join(ROOT, 'scripts', 'data', 'page3-weak-input-rescue-v1-cases.json');
const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function short(value, max = 260) {
  const text = clean(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function scoreHeuristics(packet) {
  const recommendation = clean(packet?.displayed_recommendation);
  const why = clean(packet?.why_this_direction);
  const nextStep = clean(packet?.next_step || packet?.first_coaching_step);
  const essayAbout = clean(packet?.essay_about);

  const foundRealDirection = Boolean(recommendation) && !/^(bring|share|tell me more|write more)/i.test(recommendation);
  const genericFeel = /service|leadership|growth|resilience|community/i.test(recommendation) && recommendation.split(' ').length < 12;
  const overclaiming = /your essay is really about|the essay proves|the real meaning is/i.test(recommendation) && essayAbout.length < 40;
  const actionableNextMove = /open|start|write|name|choose|focus|center/i.test(nextStep);
  const moreUsefulThanGenericChat = foundRealDirection && actionableNextMove && why.length > 40;

  return {
    found_real_direction: foundRealDirection,
    avoids_sounding_generic: !genericFeel,
    avoids_overclaiming: !overclaiming,
    gives_actionable_next_move: actionableNextMove,
    feels_more_useful_than_generic_chat: moreUsefulThanGenericChat,
  };
}

const results = [];
for (const testCase of cases) {
  const response = await fetch(base + '/api/intake/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ raw_input: testCase.raw_input }),
  });

  const json = await response.json();
  const payload = json?.canonical_page3_payload ?? null;
  const packet = payload?.recommendation_packet ?? null;
  const debug = payload?.candidate_debug ?? null;

  results.push({
    case_id: testCase.case_id,
    category: testCase.category,
    title: testCase.title,
    raw_input: testCase.raw_input,
    status: response.status,
    product_mode: json?.product_mode ?? null,
    route_target: payload?.route_target ?? null,
    route_family: debug?.winner_family ?? null,
    route_winner_id: debug?.winner_id ?? null,
    recovery_prompt: short(json?.next_question?.question_text),
    displayed_recommendation: short(packet?.displayed_recommendation),
    why_this_direction: short(packet?.why_this_direction),
    essay_about: short(packet?.essay_about),
    next_step: short(packet?.next_step || packet?.first_coaching_step),
    evaluation_questions: scoreHeuristics(packet),
    operator_notes: testCase.operator_notes,
  });
}

const outPath = path.join(ROOT, 'evaluation_outputs', 'tmp_weak_input_rescue_probe.json');
fs.writeFileSync(outPath, JSON.stringify({ preview_url: base, track: 'weak-input-rescue', cases: results }, null, 2));
console.log(JSON.stringify({ outPath, base, caseCount: results.length }, null, 2));
