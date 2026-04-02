const PRODUCT_URL = process.env.PRODUCT_URL ?? 'https://college-essay-edge.vercel.app';

const CASES = [
  {
    id: 'HO_01',
    raw: 'I was the only person on the team who knew how to fix the memory leak in our codebase. I fixed it in ten minutes the first time it happened. The second time, a junior teammate was stuck on it for two days before I stepped in and fixed it again. My advisor asked why I had not taught her how to fix it. I did not have a good answer. I rewrote the documentation and ran a code review session the following week. I have not touched that bug since.',
  },
  {
    id: 'HO_02',
    raw: 'I ran a Saturday reading program for elementary kids. Attendance was good the first month. Then it dropped by half. I assumed the kids were just busy. A parent told me her daughter stopped coming because the books were too hard and she felt embarrassed in front of the older kids. I split the group by reading level the next week. Attendance came back. My original goal was to help kids love reading. I was doing the opposite.',
  },
  {
    id: 'HO_05',
    raw: 'I scored in the bottom third at the state math competition. I had prepared more than anyone I knew. After I got my score back I looked at every problem I missed. All of them required me to switch strategy mid-problem, which I had never practiced. I built a drill where you start a problem, stop after two minutes, explain in writing why your approach is failing, then try a different method. Twelve students at my school now use it.',
  },
  {
    id: 'HO_08',
    raw: 'In ninth grade I was placed in ESL because of my last name even though I had spoken English my whole life. I asked the counselor to move me. She said she would look into it. I waited three weeks and nothing happened. I wrote a one-page document with my test scores and sat outside the counselor\'s office until she saw me. I was moved the same day. I did not understand at the time that I had just done something most kids in that class had never been able to do.',
  },
];

for (const c of CASES) {
  const body = {
    raw_input: c.raw,
    session_id: `probe_${c.id}`,
    subject_entity_id: `probe_${c.id}`,
    prior_attempt_count: 0,
    questions_asked: [],
  };
  const r = await fetch(`${PRODUCT_URL}/api/intake/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  console.log(JSON.stringify({
    case_id: c.id,
    status: r.status,
    product_mode: j.product_mode,
    route: j.evidence_strength?.route,
    scores: j.evidence_strength?.scores,
    signal_strength: j.intake_intelligence?.usable_signal?.signal_strength,
    signal_types: j.intake_intelligence?.usable_signal?.signal_types,
    recommendation_viability: j.intake_intelligence?.recommendation_viability?.decision,
    scene_evidence: j.intake_intelligence?.contamination_check?.student_scene_evidence,
    narrative_confidence: j.intake_intelligence?.narrative_pattern?.confidence,
  }, null, 2));
}
