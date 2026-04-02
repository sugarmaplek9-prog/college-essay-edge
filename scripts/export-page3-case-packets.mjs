import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const PRODUCT_URL = process.env.PRODUCT_URL ?? 'https://college-essay-edge.vercel.app';
const OUT_DIR = path.join(ROOT, 'evaluation_outputs', 'page3_case_packets_v1');
const HOLDOUT_CASES = path.join(ROOT, 'scripts', 'data', 'page3-holdout-v2-cases.json');
const HOLDOUT_SUMMARY = path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2', 'summary.json');
const BLIND_PACKET = path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2', 'blind_review_packet.json');

const TARGET_CASE_IDS = ['HV2_11', 'HV2_01'];

function clean(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

async function fetchCanonicalPayload(rawNotes) {
  const response = await fetch(`${PRODUCT_URL}/api/intake/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ raw_input: rawNotes }),
  });

  const payload = await response.json();
  return {
    http_status: response.status,
    response_payload: payload,
    canonical_payload: payload?.canonical_page3_payload ?? null,
  };
}

async function fetchRenderedOutput(rawNotes) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });

  try {
    const routeTrace = [];
    await page.goto(`${PRODUCT_URL}/start`, { waitUntil: 'networkidle' });
    routeTrace.push(page.url());

    await page.getByLabel('Your notes or draft').fill(rawNotes);
    await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).first().click();
    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 30000 });
    routeTrace.push(page.url());

    if (page.url().includes('/start/reflecting')) {
      const btn = page.getByRole('button', { name: /Build from this direction/i }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForURL(/\/start\/(direction|question|blocked)/, { timeout: 15000 }).catch(() => {});
        routeTrace.push(page.url());
      }
    }

    const heading = await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => '');
    const mainText = await page.locator('main').innerText().catch(() => '');
    const canonicalInSession = await page.evaluate(() => {
      try {
        const raw = sessionStorage.getItem('fm_canonical_page3_payload');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    });

    const directionPacket = canonicalInSession?.recommendation_packet ?? null;

    return {
      route_trace: routeTrace,
      final_url: page.url(),
      heading: clean(heading),
      page_kind: page.url().includes('/start/direction')
        ? 'direction'
        : page.url().includes('/start/reflecting')
          ? 'reflecting'
          : page.url().includes('/start/question')
            ? 'question'
            : page.url().includes('/start/blocked')
              ? 'blocked'
              : 'unknown',
      rendered_excerpt: clean(mainText).slice(0, 1600),
      canonical_payload_from_session_storage: canonicalInSession,
      rendered_recommendation_fields: directionPacket
        ? {
            displayed_recommendation: directionPacket.displayed_recommendation ?? '',
            essay_about: directionPacket.essay_about ?? '',
            why_this_direction: directionPacket.why_this_direction ?? '',
            weaker_read: directionPacket.weaker_read ?? '',
            stronger_read: directionPacket.stronger_read ?? '',
            evidence_lines: directionPacket.evidence_lines ?? [],
            evidence_explanations: directionPacket.evidence_explanations ?? [],
          }
        : null,
    };
  } finally {
    await page.close();
    await browser.close();
  }
}

function pickHoldoutData(summaryJson, blindPacketJson, caseId) {
  const row = summaryJson.rows.find((r) => r.case_id === caseId) ?? null;
  const blindEntry = blindPacketJson.find((r) => r.case_id === caseId) ?? null;
  return { row, blindEntry };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const holdoutCases = JSON.parse(fs.readFileSync(HOLDOUT_CASES, 'utf-8'));
  const summaryJson = JSON.parse(fs.readFileSync(HOLDOUT_SUMMARY, 'utf-8'));
  const blindPacketJson = JSON.parse(fs.readFileSync(BLIND_PACKET, 'utf-8'));

  const selectedCases = holdoutCases.filter((c) => TARGET_CASE_IDS.includes(c.case_id));

  for (const c of selectedCases) {
    const canonical = await fetchCanonicalPayload(c.raw_notes);
    const rendered = await fetchRenderedOutput(c.raw_notes);
    const { row, blindEntry } = pickHoldoutData(summaryJson, blindPacketJson, c.case_id);

    const casePacket = {
      case_id: c.case_id,
      title: c.title,
      quality_label: c.case_id === 'HV2_11' ? 'bad_case' : 'good_case',
      raw_student_notes: c.raw_notes,

      canonical_payload_json: canonical.canonical_payload,

      route_decision_object: canonical.canonical_payload?.routing?.route_decision ?? null,
      classifier_output: canonical.canonical_payload?.classification ?? null,
      preserved_source_truth: canonical.canonical_payload?.source_truth ?? null,

      candidate_list_if_available: canonical.canonical_payload?.candidate_debug?.scores_by_candidate ?? [],
      ranking_scores_if_available: canonical.canonical_payload?.candidate_debug ?? null,

      rendered_page3_output: rendered,

      final_blind_packet_entry: blindEntry,

      holdout_summary_row: row,

      extraction_metadata: {
        extracted_at: new Date().toISOString(),
        product_url: PRODUCT_URL,
        api_status: canonical.http_status,
      },
    };

    const outPath = path.join(OUT_DIR, `${c.case_id}_full_packet.json`);
    fs.writeFileSync(outPath, JSON.stringify(casePacket, null, 2), 'utf-8');
    console.log(`[ok] wrote ${path.relative(ROOT, outPath)}`);
  }

  const indexPath = path.join(OUT_DIR, 'README.md');
  const indexMd = [
    '# Page 3 Case Packets (Good + Bad)',
    '',
    'Generated files:',
    '- HV2_11_full_packet.json (bad case)',
    '- HV2_01_full_packet.json (good case)',
    '',
    'Each packet includes:',
    '- raw student notes',
    '- canonical payload JSON',
    '- rendered output snapshot',
    '- candidate list and scores',
    '- route decision object',
    '- classifier output',
    '- preserved source truth/story entries',
    '- blind packet entry',
    '- holdout summary row',
    '',
  ].join('\n');

  fs.writeFileSync(indexPath, indexMd, 'utf-8');
  console.log(`[ok] wrote ${path.relative(ROOT, indexPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
