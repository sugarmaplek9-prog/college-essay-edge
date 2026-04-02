import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

type PacketCase = {
  case_id: string;
  title: string;
  screen_path: string;
  session_payload: {
    fm_intelligence: unknown;
    fm_case_state: unknown;
    fm_product_mode: string;
  };
};

type Packet = {
  cases: PacketCase[];
};

const PACKET_PATH = path.join(
  process.cwd(),
  'evaluation_outputs',
  'POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_PACKET_V1.json',
);
const SCREENSHOT_DIR = path.join(
  process.cwd(),
  'evaluation_outputs',
  'post_nds_result_screen_human_clarity',
);
const BASE_URL = process.env.HUMAN_CLARITY_BASE_URL ?? 'http://127.0.0.1:3000';

async function main(): Promise<void> {
  if (!fs.existsSync(PACKET_PATH)) {
    throw new Error(`Missing packet: ${PACKET_PATH}. Run post-nds-result-screen-human-clarity-packet.ts first.`);
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const packet = JSON.parse(fs.readFileSync(PACKET_PATH, 'utf-8')) as Packet;
  const browser = await chromium.launch({ headless: true });
  const outputs: Array<{ case_id: string; image_path: string; title: string }> = [];

  try {
    for (const item of packet.cases) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
      await page.addInitScript((payload) => {
        window.sessionStorage.setItem('fm_intelligence', JSON.stringify(payload.fm_intelligence));
        window.sessionStorage.setItem('fm_case_state', JSON.stringify(payload.fm_case_state));
        window.sessionStorage.setItem('fm_product_mode', payload.fm_product_mode);
      }, item.session_payload);

      await page.goto(`${BASE_URL}${item.screen_path}`, { waitUntil: 'networkidle' });
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${item.case_id}.png`),
        fullPage: true,
      });
      await page.close();

      outputs.push({
        case_id: item.case_id,
        title: item.title,
        image_path: path.join('evaluation_outputs', 'post_nds_result_screen_human_clarity', `${item.case_id}.png`),
      });
    }
  } finally {
    await browser.close();
  }

  const indexPath = path.join(SCREENSHOT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify({ generated_at: new Date().toISOString(), base_url: BASE_URL, outputs }, null, 2));
  console.log('POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_CAPTURES_READY', JSON.stringify({ indexPath, screenshotCount: outputs.length }));
}

main().catch((error) => {
  console.error('POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_CAPTURES_FAILED', error);
  process.exit(1);
});
