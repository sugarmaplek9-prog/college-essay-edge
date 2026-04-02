import fs from 'node:fs';
import path from 'node:path';

const surfaces = {
  alias: process.env.BLANK_PAGE_ALIAS_URL || 'https://college-essay-edge.vercel.app',
  deployment: process.env.BLANK_PAGE_DEPLOY_URL || 'https://college-essay-edge-ja661fh1f-college-edge.vercel.app',
};

const cases = [
  {
    id: 'blank_page_discovery_candidate',
    raw_input: 'I have no idea what to write about for my essay.',
  },
  {
    id: 'topic_probe_candidate',
    raw_input: 'Can I write about helping in robotics club?',
  },
  {
    id: 'theme_probe_candidate',
    raw_input: 'I want to show leadership but I do not have one event yet.',
  },
];

async function runCase(baseUrl, raw_input) {
  const res = await fetch(`${baseUrl}/api/intake/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ raw_input }),
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return {
    status: res.status,
    product_mode: json?.product_mode ?? null,
    top_level_blank_page_route: json?.top_level_blank_page_route ?? null,
    blank_page_mode: json?.blank_page_mode ?? null,
    has_blank_page_intake_payload: Boolean(json?.blank_page_intake_payload),
  };
}

const matrix = {};
for (const [name, baseUrl] of Object.entries(surfaces)) {
  matrix[name] = {};
  for (const c of cases) {
    matrix[name][c.id] = await runCase(baseUrl, c.raw_input);
  }
}

const diff = {};
for (const c of cases) {
  const left = matrix.alias[c.id];
  const right = matrix.deployment[c.id];
  diff[c.id] = {
    product_mode_diff: left.product_mode !== right.product_mode,
    top_level_route_diff: left.top_level_blank_page_route !== right.top_level_blank_page_route,
    blank_page_mode_diff: left.blank_page_mode !== right.blank_page_mode,
    payload_presence_diff: left.has_blank_page_intake_payload !== right.has_blank_page_intake_payload,
  };
}

const result = {
  checked_at: new Date().toISOString(),
  surfaces,
  cases: cases.map((c) => c.id),
  matrix,
  diff,
};

const outDir = path.resolve(process.cwd(), 'evaluation_outputs', 'blank_page_phase6_surface_diff_v1');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'surface-diff.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ outPath, result }, null, 2));
