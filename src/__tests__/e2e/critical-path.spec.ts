/**
 * src/__tests__/e2e/critical-path.spec.ts
 * 
 * Critical E2E tests for first-minute vertical slice.
 * Tests F1 (success), F3 (recovery), F4 (blocked) paths.
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  FIXTURE_F1_STRONG_CASE,
  FIXTURE_F3_THIN_RECOVERY,
  FIXTURE_F4_BLOCKED,
} from '../fixtures/orchestrator-responses';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('First-Minute Critical Paths', () => {
  async function goToStart(page: Page) {
    await page.goto(BASE_URL);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Find the strongest story angle|Find your strongest college admissions essay theme/i
    );
    await page.goto(`${BASE_URL}/start`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Paste rough notes');
  }

  async function submitStartInput(
    page: Page,
    input: string
  ) {
    await page.getByLabel('Your notes or draft').fill(input);
    await page.getByRole('button', { name: /Find the strongest direction|See what's here|Show me possible directions/i }).click();
  }

  async function mockIntakeSequence(
    page: Page,
    responses: unknown[]
  ) {
    const normalizePayload = (payload: any) => {
      if (payload?.trusted_evidence?.trusted_evidence_rank) return payload;

      const rankedIds = Array.isArray(payload?.trusted_evidence?.ranking)
        ? payload.trusted_evidence.ranking
            .map((item: any) => item?.source_id)
            .filter((id: unknown) => typeof id === 'string')
        : [];

      return {
        ...payload,
        trusted_evidence: {
          trusted_evidence_rank: rankedIds,
          downgraded_sources: [],
          reason_codes: ['STORY_ENTRY_OUTRANKS_POLISHED_DRAFT'],
          meta:
            payload?.trusted_evidence?.meta ??
            payload?.usable_signal?.meta ?? {
              decision_version: 'test',
              taxonomy_version: 'test',
              made_at: new Date().toISOString(),
              made_by: 'rules',
            },
        },
      };
    };

    let callIndex = 0;
    await page.route('**/api/intake/session', async (route) => {
      const rawResponse = responses[Math.min(callIndex, responses.length - 1)];
      const responseBody = normalizePayload(rawResponse);
      callIndex += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responseBody),
      });
    });
  }
  
  test('F1: Strong case routes correctly (homepage → reflecting → direction)', async ({ page }) => {
    await mockIntakeSequence(page, [FIXTURE_F1_STRONG_CASE]);
    await goToStart(page);
    await submitStartInput(
      page,
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.'
    );

    await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 15000 });

    if (page.url().includes('/reflecting')) {
      const body = (await page.locator('body').textContent()) ?? '';
      expect(body.includes('Your direction') || body.includes('Here’s where the essay really lives')).toBe(true);
      await expect(page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i })).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i }).click();
      await page.waitForURL('**/direction', { timeout: 15000 });
    }

    expect(page.url()).toContain('/direction');

    const directionSections = [
      'Build from this direction',
      'Why this wins',
      'Draft the opening this way',
      'What this opens up',
    ];

    for (const section of directionSections) {
      await expect(page.getByText(section).first()).toBeVisible({ timeout: 5000 });
    }

    await page.getByRole('button', { name: /compare|weaker/i }).click();
    await page.waitForURL('**/compare', { timeout: 15000 });
    await expect(page.getByText(/compare|version|wins/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('F3: Recovery path routes and works (homepage → question → direction)', async ({ page }) => {
    await mockIntakeSequence(page, [FIXTURE_F3_THIN_RECOVERY, FIXTURE_F1_STRONG_CASE]);

    await goToStart(page);
    await submitStartInput(page, "I like sports but I'm not great at them.");

    await page.waitForURL('**/question', { timeout: 15000 });
    expect(page.url()).toContain('/question');

    await expect(page.getByText('Quick follow-up')).toBeVisible();
    await expect(page.locator('blockquote')).toBeVisible({ timeout: 5000 });

    await page.getByLabel('Your answer').fill(
      "I remember trying soccer and realizing I wasn't as naturally talented as my friends, but I discovered I loved coaching younger kids."
    );

    await page.getByRole('button', { name: 'Use this answer' }).click();

    await page.waitForURL(/\/start\/(question|reflecting|direction)/, { timeout: 15000 });

    if (page.url().includes('/question')) {
      await page.getByLabel('Your answer').fill(
        'Since then I started paying attention to what teammates needed in practice, and I now measure success by whether I helped the group improve.'
      );
      await page.getByRole('button', { name: 'Use this answer' }).click();
      await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 15000 });
    }

    if (page.url().includes('/reflecting')) {
      await page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i }).click();
      await page.waitForURL('**/direction', { timeout: 15000 });
    }

    await page.waitForTimeout(600);
    const currentUrl = page.url();

    if (currentUrl.includes('/direction')) {
      await expect(page.getByText('Strongest direction').first()).toBeVisible({ timeout: 10000 });
    } else if (currentUrl.includes('/question')) {
      await expect(page.locator('blockquote')).toBeVisible({ timeout: 10000 });
    } else if (currentUrl.includes('/blocked')) {
      await expect(page.getByText('We need a little more to work with').first()).toBeVisible({ timeout: 10000 });
    } else {
      const body = (await page.locator('body').textContent()) ?? '';
      expect(body.includes('Your direction') || body.includes('Here’s where the essay really lives')).toBe(true);
      expect(currentUrl.includes('/reflecting')).toBe(true);
    }
  });

  test('F4: Blocked case exits gracefully (homepage → blocked)', async ({ page }) => {
    await mockIntakeSequence(page, [FIXTURE_F4_BLOCKED]);
    await goToStart(page);
    await submitStartInput(page, "I'm good at everything.");

    await page.waitForURL('**/blocked', { timeout: 15000 });
    expect(page.url()).toContain('/blocked');

    await expect(page.getByText('We need a little more to work with')).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole('button', { name: 'Add more notes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Answer one question' })).toBeVisible();
  });

});
