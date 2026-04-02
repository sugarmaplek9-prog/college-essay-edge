import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.BLANK_PAGE_DEPLOYED_BASE_URL || 'https://college-essay-edge.vercel.app';
const startedAt = new Date().toISOString();

async function get(pathname) {
  const res = await fetch(`${baseUrl}${pathname}`);
  const text = await res.text();
  return { status: res.status, text };
}

async function postSession(raw_input) {
  const res = await fetch(`${baseUrl}/api/intake/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ raw_input }),
  });
  const body = await res.text();
  let json = null;
  try {
    json = JSON.parse(body);
  } catch {
    json = null;
  }
  return { status: res.status, json, bodySnippet: body.slice(0, 400) };
}

const home = await get('/');
const start = await get('/start');

const apiChecks = {
  blank_page_candidate: await postSession('I have no idea what to write about for my essay.'),
  topic_probe_candidate: await postSession('Can I write about helping in robotics club?'),
  strong_direction_candidate: await postSession('In my third summer at the hospital, a nurse told me I was in the way, and that changed how I showed up and listened.'),
};

const summary = {
  started_at: startedAt,
  base_url: baseUrl,
  render_sanity: {
    home_status: home.status,
    home_contains_headline: home.text.includes('Find the strongest story angle before you waste time drafting.'),
    start_status: start.status,
    start_contains_start_marker:
      start.text.includes('Paste rough notes') ||
      start.text.includes('Find the strongest direction'),
  },
  route_activation_sanity: {
    blank_page_candidate: {
      status: apiChecks.blank_page_candidate.status,
      product_mode: apiChecks.blank_page_candidate.json?.product_mode ?? null,
      top_level_blank_page_route: apiChecks.blank_page_candidate.json?.top_level_blank_page_route ?? null,
      blank_page_mode: apiChecks.blank_page_candidate.json?.blank_page_mode ?? null,
      has_blank_page_intake_payload: Boolean(apiChecks.blank_page_candidate.json?.blank_page_intake_payload),
    },
    topic_probe_candidate: {
      status: apiChecks.topic_probe_candidate.status,
      product_mode: apiChecks.topic_probe_candidate.json?.product_mode ?? null,
      top_level_blank_page_route: apiChecks.topic_probe_candidate.json?.top_level_blank_page_route ?? null,
      blank_page_mode: apiChecks.topic_probe_candidate.json?.blank_page_mode ?? null,
      has_blank_page_intake_payload: Boolean(apiChecks.topic_probe_candidate.json?.blank_page_intake_payload),
    },
  },
  submission_sanity: {
    strong_direction_candidate: {
      status: apiChecks.strong_direction_candidate.status,
      product_mode: apiChecks.strong_direction_candidate.json?.product_mode ?? null,
      route: apiChecks.strong_direction_candidate.json?.evidence_strength?.route ?? null,
    },
  },
  telemetry_visibility_proxy: {
    note: 'Production telemetry sink is not directly queryable from this script. Visibility is proxied by passing blank-page telemetry unit tests and route-audit emission checks in CI/test runs.',
  },
  rollback_guard_proxy: {
    note: 'Rollback/guard behavior in production is proxied by rollout-guard unit tests and release-input validation checks.',
  },
};

const blankPageExpected =
  summary.route_activation_sanity.blank_page_candidate.product_mode === 'blank_page_intake'
  && summary.route_activation_sanity.blank_page_candidate.top_level_blank_page_route === 'needs_structured_blank_page_intake'
  && Boolean(summary.route_activation_sanity.blank_page_candidate.blank_page_mode)
  && summary.route_activation_sanity.blank_page_candidate.has_blank_page_intake_payload;

const topicProbeExpected =
  summary.route_activation_sanity.topic_probe_candidate.product_mode === 'blank_page_intake'
  && summary.route_activation_sanity.topic_probe_candidate.top_level_blank_page_route === 'needs_structured_blank_page_intake'
  && Boolean(summary.route_activation_sanity.topic_probe_candidate.blank_page_mode)
  && summary.route_activation_sanity.topic_probe_candidate.has_blank_page_intake_payload;

summary.activation_expectations = {
  blank_page_candidate_matches_expected: blankPageExpected,
  topic_probe_candidate_matches_expected: topicProbeExpected,
};

summary.pass = Boolean(
  summary.render_sanity.home_status === 200
  && summary.render_sanity.start_status === 200
  && summary.route_activation_sanity.blank_page_candidate.status === 200
  && summary.route_activation_sanity.topic_probe_candidate.status === 200
  && summary.submission_sanity.strong_direction_candidate.status === 200
  && blankPageExpected
  && topicProbeExpected
);

const outputDir = path.resolve(process.cwd(), 'evaluation_outputs', 'blank_page_phase6_live_smoke_v1');
fs.mkdirSync(outputDir, { recursive: true });
const outPath = path.join(outputDir, 'phase6-live-smoke.json');
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

console.log(JSON.stringify({ outPath, pass: summary.pass, summary }, null, 2));
if (!summary.pass) process.exitCode = 1;
