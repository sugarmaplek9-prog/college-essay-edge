/**
 * src/__tests__/e2e/success-path.spec.ts
 * 
 * Playwright E2E test for F1 (strong case) path:
 * Homepage → guided start → submit → reflection → direction
 * 
 * Run: npx playwright test success-path.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import { FIXTURE_F1_STRONG_CASE } from '../fixtures/orchestrator-responses';

/**
 * Mock intercept for POST /api/intake/session
 * Returns F1 fixture deterministically
 */
async function mockIntakeSession(page: Page, fixture: typeof FIXTURE_F1_STRONG_CASE) {
  await page.route('**/api/intake/session', (route) => {
    route.abort('blockedbyresponseclient');
  });

  await page.route('**/api/intake/session', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixture),
      });
    } else {
      await route.continue();
    }
  });
}

test.describe('F1 — Strong Case Success Path', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test('homepage loads and displays primary CTA', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Verify homepage hero is visible
    const hero = page.locator('h1');
    await expect(hero).toContainText('Choose the real essay before the safe one hardens.');

    // Verify primary CTA exists
    const cta = page.locator('a, button').filter({ hasText: /start|begin|let's go/i }).first();
    await expect(cta).toBeVisible();
  });

  test('homepage CTA routes to /start', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const cta = page.locator('a, button').filter({ hasText: /start|begin|let's go/i }).first();
    await cta.click();

    // Wait for navigation to /start
    await page.waitForURL('**/start');
    await expect(page).toHaveURL(/\/start$/);
  });

  test('guided start screen accepts input and submits', async ({ page }) => {
    await mockIntakeSession(page, FIXTURE_F1_STRONG_CASE);
    await page.goto(`${BASE_URL}/start`);

    // Wait for textarea to be visible
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Enter sample input
    await textarea.fill(
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.'
    );

    // Find and click submit button
    const submitButton = page.locator('button').filter({ hasText: /submit|continue|next/i }).first();
    await expect(submitButton).toBeVisible();

    // Click submit and wait for the POST
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/intake/session') && response.status() === 200
      ),
      submitButton.click(),
    ]);
  });

  test('reflection screen renders after successful submit', async ({ page }) => {
    await mockIntakeSession(page, FIXTURE_F1_STRONG_CASE);
    await page.goto(`${BASE_URL}/start`);

    const textarea = page.locator('textarea');
    await textarea.fill('I spent three summers volunteering...');

    const submitButton = page.locator('button').filter({ hasText: /submit|continue|next/i }).first();
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/intake/session') && response.status() === 200
      ),
      submitButton.click(),
    ]);

    // Wait for route to reflection
    await page.waitForURL('**/reflecting');

    // Verify reflection screen rendered
    const reflectionHeader = page.locator('text=What I\'m seeing so far').first();
    await expect(reflectionHeader).toBeVisible({ timeout: 3000 });
  });

  test('reflection renders required sections (header + observations)', async ({ page }) => {
    await mockIntakeSession(page, FIXTURE_F1_STRONG_CASE);
    await page.goto(`${BASE_URL}/start`);

    const textarea = page.locator('textarea');
    await textarea.fill('I spent three summers volunteering...');

    const submitButton = page.locator('button').filter({ hasText: /submit|continue|next/i }).first();
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/intake/session') && response.status() === 200
      ),
      submitButton.click(),
    ]);

    await page.waitForURL('**/reflecting');

    // Verify header
    const header = page.locator('text=What I\'m seeing so far').first();
    await expect(header).toBeVisible();

    // Verify observations exist (at least 2)
    const observations = page.locator('p, div').filter({
      hasText: /.{20,}/,  // At least 20 chars
    });
    const observationCount = await observations.count();
    expect(observationCount).toBeGreaterThanOrEqual(2);
  });

  test('reflection CTA routes to direction screen', async ({ page }) => {
    await mockIntakeSession(page, FIXTURE_F1_STRONG_CASE);
    await page.goto(`${BASE_URL}/start`);

    const textarea = page.locator('textarea');
    await textarea.fill('I spent three summers volunteering...');

    const submitButton = page.locator('button').filter({ hasText: /submit|continue|next/i }).first();
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/intake/session') && response.status() === 200
      ),
      submitButton.click(),
    ]);

    await page.waitForURL('**/reflecting');

    // Click continue/next CTA
    const continueButton = page.locator('button').filter({ hasText: /continue|next|see direction/i }).first();
    await continueButton.click();

    await page.waitForURL('**/direction');
    await expect(page).toHaveURL(/\/direction$/);
  });

  test('direction screen renders all required sections', async ({ page }) => {
    await mockIntakeSession(page, FIXTURE_F1_STRONG_CASE);
    await page.goto(`${BASE_URL}/start`);

    const textarea = page.locator('textarea');
    await textarea.fill('I spent three summers volunteering...');

    const submitButton = page.locator('button').filter({ hasText: /submit|continue|next/i }).first();
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/intake/session') && response.status() === 200
      ),
      submitButton.click(),
    ]);

    await page.waitForURL('**/reflecting');
    const continueButton = page.locator('button').filter({ hasText: /continue|next|see direction/i }).first();
    await continueButton.click();

    await page.waitForURL('**/direction');

    // Verify required sections exist
    const sections = [
      'Strongest direction',
      'Why this beats the obvious',
      'What could make this fall flat',
      'Best next move',
    ];

    for (const section of sections) {
      const sectionHeader = page.locator(`text=${section}`).first();
      await expect(sectionHeader).toBeVisible({ timeout: 2000 });
    }
  });

  test('direction CTAs present (use, compare, sharpen)', async ({ page }) => {
    await mockIntakeSession(page, FIXTURE_F1_STRONG_CASE);
    await page.goto(`${BASE_URL}/start`);

    const textarea = page.locator('textarea');
    await textarea.fill('I spent three summers volunteering...');

    const submitButton = page.locator('button').filter({ hasText: /submit|continue|next/i }).first();
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/intake/session') && response.status() === 200
      ),
      submitButton.click(),
    ]);

    await page.waitForURL('**/reflecting');
    const continueButton = page.locator('button').filter({ hasText: /continue|next|see direction/i }).first();
    await continueButton.click();

    await page.waitForURL('**/direction');

    // Verify CTAs exist
    const useCTA = page.locator('button').filter({ hasText: /use|go with|choose/i }).first();
    await expect(useCTA).toBeVisible();

    const compareCTA = page.locator('button').filter({ hasText: /compare|alternative|other/i }).first();
    await expect(compareCTA).toBeVisible();

    const sharpenCTA = page.locator('button').filter({ hasText: /sharpen|question|refine/i }).first();
    await expect(sharpenCTA).toBeVisible();
  });

  test('compare screen accessible from direction', async ({ page }) => {
    await mockIntakeSession(page, FIXTURE_F1_STRONG_CASE);
    await page.goto(`${BASE_URL}/start`);

    const textarea = page.locator('textarea');
    await textarea.fill('I spent three summers volunteering...');

    const submitButton = page.locator('button').filter({ hasText: /submit|continue|next/i }).first();
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/intake/session') && response.status() === 200
      ),
      submitButton.click(),
    ]);

    await page.waitForURL('**/reflecting');
    const continueButton = page.locator('button').filter({ hasText: /continue|next|see direction/i }).first();
    await continueButton.click();

    await page.waitForURL('**/direction');

    // Click compare CTA
    const compareCTA = page.locator('button').filter({ hasText: /compare|alternative|other/i }).first();
    await compareCTA.click();

    await page.waitForURL('**/compare');
    await expect(page).toHaveURL(/\/compare$/);
  });

  test('no uncaught exceptions during success path', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await mockIntakeSession(page, FIXTURE_F1_STRONG_CASE);
    await page.goto(`${BASE_URL}/start`);

    const textarea = page.locator('textarea');
    await textarea.fill('I spent three summers volunteering...');

    const submitButton = page.locator('button').filter({ hasText: /submit|continue|next/i }).first();
    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/intake/session') && response.status() === 200
      ),
      submitButton.click(),
    ]);

    await page.waitForURL('**/reflecting');
    const continueButton = page.locator('button').filter({ hasText: /continue|next|see direction/i }).first();
    await continueButton.click();

    await page.waitForURL('**/direction');

    // Wait a moment for any deferred errors
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});
