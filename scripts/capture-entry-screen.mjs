import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto('https://college-essay-edge.vercel.app/', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'evaluation_outputs/entry-screen-updated.png', fullPage: true });
console.log('saved:evaluation_outputs/entry-screen-updated.png');
await browser.close();
