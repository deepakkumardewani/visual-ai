import type { Page, Route } from '@playwright/test';

import { expect, test } from './fixtures/generation';
import { E2E_WEB_ORIGIN } from './support/env';
import { gotoStudio } from './support/studio';

import type { IImageObject } from '@visual-ai/shared';
import { CURRENT_INTRO_VERSION, FeatureType } from '@visual-ai/shared';

const E2E_USER_ID = process.env.E2E_CLERK_USER_ID ?? 'user_e2e';
const FIXTURE_IMAGE_URL = `${E2E_WEB_ORIGIN}/e2e-fixture.png`;
const USER_PROFILE_URL = /\/users\/user_/;
const POPUP_QUESTION_LOW = /What went wrong or what's missing\?/;
const POPUP_QUESTION_HIGH = /What do you love\?/;
const POPUP_THANKS = 'Thanks, that genuinely helps.';

// The API is cross-origin (api.visual-ai.localhost), so a JSON POST is preflighted. A stub that
// only answers the POST never gets it: the browser blocks the request after a failed OPTIONS.
// Anchored regexes (not `**/feedback`) also keep `/feedback` and `/feedback/eligibility` apart.
const ELIGIBILITY_URL = /\/feedback\/eligibility$/;
const SUBMIT_URL = /\/feedback$/;
const ADMIN_ACCESS_URL = /\/feedback\/admin\/access$/;

function corsHeaders(route: Route): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': E2E_WEB_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers':
      route.request().headers()['access-control-request-headers'] ?? 'content-type,authorization',
  };
}

/** Answers the preflight and returns true when the route was only a preflight. */
async function answerPreflight(route: Route): Promise<boolean> {
  if (route.request().method() !== 'OPTIONS') return false;
  await route.fulfill({ status: 204, headers: corsHeaders(route) });
  return true;
}

async function stubEligibility(page: Page, eligible: boolean) {
  const triggers: string[] = [];
  await page.route(ELIGIBILITY_URL, async (route) => {
    if (await answerPreflight(route)) return;
    triggers.push((route.request().postDataJSON() as { trigger: string }).trigger);
    await route.fulfill({ status: 200, headers: corsHeaders(route), json: { eligible } });
  });
  return triggers;
}

interface PopupPayload {
  source: string;
  rating?: number;
  message?: string;
  type?: string;
  testimonialConsent?: boolean;
  displayName?: string;
  context?: { route?: string };
}

async function stubSubmit(page: Page) {
  const bodies: PopupPayload[] = [];
  await page.route(SUBMIT_URL, async (route) => {
    if (await answerPreflight(route)) return;
    bodies.push(route.request().postDataJSON() as PopupPayload);
    await route.fulfill({ status: 201, headers: corsHeaders(route), json: { id: 'e2e-feedback' } });
  });
  return bodies;
}

function uniqueMessage(label: string) {
  return `e2e feedback ${label} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function generateImage(page: Page, prompt: string) {
  await page.getByTestId('composer-textarea-input').fill(prompt);
  await page.getByTestId('generate-cta').dispatchEvent('click');
}

async function openPopupViaGeneration(page: Page, prompt: string) {
  await gotoStudio(page);
  await generateImage(page, prompt);
  await expect(page.getByTestId('feedback-popup')).toBeVisible();
}

async function openFeedbackDialog(page: Page) {
  await page.getByTestId('user-menu-trigger').click();
  await page.getByTestId('user-menu-item-feedback').click();
  return page.getByRole('dialog', { name: 'Send feedback' });
}

test.describe('feedback system', () => {
  test(
    'Popup appears after a completed image generation when the server says eligible',
    { tag: '@critical' },
    async ({ page, generationStub }) => {
      const triggers = await stubEligibility(page, true);
      generationStub.setPrompt('e2e feedback eligible');
      await openPopupViaGeneration(page, 'e2e feedback eligible');

      expect(generationStub.generateRequestCount()).toBe(1);
      expect(triggers).toEqual(['generation']);
      await expect(page.getByRole('dialog', { name: 'Share feedback' })).toBeVisible();
      await expect(page.getByTestId('feedback-rating-3')).toBeVisible();
    },
  );

  test(
    'Popup does not appear when not eligible',
    { tag: '@critical' },
    async ({ page, generationStub }) => {
      const triggers = await stubEligibility(page, false);
      generationStub.setPrompt('e2e feedback ineligible');
      await gotoStudio(page);
      await generateImage(page, 'e2e feedback ineligible');

      // The server was asked (so the negative is not vacuous) and said no.
      await expect.poll(() => triggers).toEqual(['generation']);
      await expect(page.getByAltText('e2e feedback ineligible').first()).toBeVisible();
      await expect(page.getByTestId('feedback-popup')).toHaveCount(0);
    },
  );

  test(
    'Popup does not ask while a generation is in flight',
    { tag: '@critical' },
    async ({ page, generationStub }) => {
      const triggers = await stubEligibility(page, true);
      generationStub.setPrompt('e2e feedback in flight');

      // Hold the progress stream so the generation stays in flight until we release it.
      let heldProgress = 0;
      let release: () => void = () => {};
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(/\/progress\?jobId=/, async (route) => {
        heldProgress += 1;
        await gate;
        await route.fallback();
      });

      await gotoStudio(page);
      await generateImage(page, 'e2e feedback in flight');

      await expect.poll(() => heldProgress).toBeGreaterThan(0);
      expect(generationStub.generateRequestCount()).toBe(1);
      expect(triggers).toEqual([]);
      await expect(page.getByTestId('feedback-popup')).toHaveCount(0);

      release();
      await expect(page.getByTestId('feedback-popup')).toBeVisible();
      expect(triggers).toEqual(['generation']);
    },
  );

  test(
    'Low rating (<=2) shows "what went wrong", then submits and shows success',
    { tag: '@high' },
    async ({ page, generationStub }) => {
      await stubEligibility(page, true);
      const bodies = await stubSubmit(page);
      generationStub.setPrompt('e2e feedback low');
      await openPopupViaGeneration(page, 'e2e feedback low');

      await page.getByTestId('feedback-rating-2').click();
      // Keyboard users land in the follow-up field once the step transition finishes.
      const lowField = page.getByRole('textbox', { name: POPUP_QUESTION_LOW });
      await expect(lowField).toBeFocused();
      const message = uniqueMessage('low');
      await lowField.fill(message);
      await expect(page.getByRole('checkbox')).toHaveCount(0);
      await page.getByRole('button', { name: 'Send' }).click();

      await expect(page.getByText(POPUP_THANKS)).toBeVisible();
      expect(bodies).toHaveLength(1);
      expect(bodies[0]).toMatchObject({ source: 'popup', rating: 2, message });
      expect(bodies[0].testimonialConsent).toBeUndefined();
    },
  );

  test(
    'High rating (>=4) shows "what do you love" with the testimonial-consent checkbox and display name',
    { tag: '@high' },
    async ({ page, generationStub }) => {
      await stubEligibility(page, true);
      const bodies = await stubSubmit(page);
      generationStub.setPrompt('e2e feedback high');
      await openPopupViaGeneration(page, 'e2e feedback high');

      await page.getByTestId('feedback-rating-5').click();
      const message = uniqueMessage('high');
      await page.getByRole('textbox', { name: POPUP_QUESTION_HIGH }).fill(message);
      await page.getByRole('checkbox', { name: 'You can quote me on the website' }).check();
      await page.getByRole('textbox', { name: /Name to show/ }).fill('E2E Tester');
      await page.getByRole('button', { name: 'Send' }).click();

      await expect(page.getByText(POPUP_THANKS)).toBeVisible();
      expect(bodies).toHaveLength(1);
      expect(bodies[0]).toMatchObject({
        source: 'popup',
        rating: 5,
        message,
        testimonialConsent: true,
        displayName: 'E2E Tester',
      });
    },
  );

  test('Download trigger', { tag: '@high' }, async ({ page, generationStub }) => {
    void generationStub;
    const triggers = await stubEligibility(page, false);
    const item = {
      _id: 'e2e-feedback-dl',
      userId: E2E_USER_ID,
      prompt: 'e2e feedback download prompt',
      featureType: FeatureType.IMAGE,
      isFavorite: false,
      createdAt: new Date('2026-01-15T12:00:00.000Z'),
      images: [
        {
          name: 'e2e-fixture',
          aiImageUrl: FIXTURE_IMAGE_URL,
          resolution: '1x1',
          aspectRatio: '16:9',
          width: 1,
          height: 1,
          format: 'png',
          bytes: 0,
        },
      ],
    } as IImageObject;
    await page.route(`**/users/${E2E_USER_ID}`, async (route) => {
      if (await answerPreflight(route)) return;
      if (route.request().method() !== 'GET') return route.continue();
      return route.fulfill({
        status: 200,
        headers: corsHeaders(route),
        json: {
          userId: E2E_USER_ID,
          userName: 'e2e_user',
          firstName: 'E2E',
          lastName: 'User',
          fullName: 'E2E User',
          email: process.env.E2E_CLERK_USER_EMAIL ?? 'e2e@example.com',
          credits: 100,
          dailyCredits: 10,
          referralCode: 'E2E',
          seenIntroVersion: CURRENT_INTRO_VERSION,
          referrals: [],
          payments: [],
          history: [item],
          favorites: [],
          activities: [],
        },
      });
    });

    await Promise.all([page.waitForResponse(USER_PROFILE_URL), page.goto('/assets')]);
    const panel = page.getByTestId('dashboard-assets-panel');
    await expect(panel).toBeVisible();
    await panel.getByRole('img', { name: /e2e feedback download prompt/ }).hover();
    expect(triggers).toEqual([]);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download image' }).click();
    await downloadPromise;

    await expect.poll(() => triggers).toEqual(['download']);
  });

  test('Menu "Send feedback"', { tag: '@critical' }, async ({ page }) => {
    const bodies = await stubSubmit(page);
    // The query string must be stripped from context.route.
    await gotoStudio(page, '/create/image?e2e=feedback&token=secret');

    const dialog = await openFeedbackDialog(page);
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: 'Bug' }).click();
    const message = uniqueMessage('menu');
    await dialog.getByRole('textbox', { name: /Your message/ }).fill(message);
    await dialog.getByRole('button', { name: 'Send feedback' }).click();

    await expect(page.getByTestId('feedback-sent')).toBeVisible();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({ source: 'menu', type: 'bug', message });
    expect(bodies[0].context?.route).toBe('/create/image');
  });

  test('Admin can triage', { tag: '@critical' }, async ({ page }) => {
    // Real API flow: the e2e user is in ADMIN_USER_IDS and the API is in email log mode.
    await gotoStudio(page);
    const dialog = await openFeedbackDialog(page);
    await dialog.getByRole('radio', { name: 'Idea' }).click();
    const message = uniqueMessage('triage');
    await dialog.getByRole('textbox', { name: /Your message/ }).fill(message);
    const created = page.waitForResponse(
      (res) => SUBMIT_URL.test(res.url()) && res.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Send feedback' }).click();
    expect((await created).status()).toBe(201);
    await expect(page.getByTestId('feedback-sent')).toBeVisible();

    const note = `note for ${message}`;
    const openItem = async () => {
      await page.goto('/admin/feedback');
      await expect(page.getByRole('heading', { name: 'Feedback', level: 1 })).toBeVisible();
      await page
        .getByRole('form', { name: 'Filter feedback' })
        .getByLabel('Type')
        .selectOption('idea');
      const row = page.getByTestId(/^feedback-row-/).filter({ hasText: message });
      await expect(row).toHaveCount(1);
      await row.click();
      return row;
    };

    const row = await openItem();
    const detail = page.getByTestId('feedback-detail');
    await expect(detail).toContainText(message);

    const statusSaved = page.waitForResponse(
      (res) => /\/feedback\/admin\/[^/]+$/.test(res.url()) && res.request().method() === 'PATCH',
    );
    await detail.getByLabel('Status').selectOption('triaged');
    expect((await statusSaved).status()).toBe(200);

    const noteSaved = page.waitForResponse(
      (res) => /\/feedback\/admin\/[^/]+$/.test(res.url()) && res.request().method() === 'PATCH',
    );
    await detail.getByLabel('Admin note').fill(note);
    await detail.getByRole('button', { name: 'Save note' }).click();
    expect((await noteSaved).status()).toBe(200);
    await expect(row).toContainText('Triaged');

    await page.reload();
    const reloadedRow = await openItem();
    await expect(reloadedRow).toContainText('Triaged');
    await expect(page.getByTestId('feedback-detail').getByLabel('Status')).toHaveValue('triaged');
    await expect(page.getByTestId('feedback-detail').getByLabel('Admin note')).toHaveValue(note);
  });

  test('Non-admin is blocked', { tag: '@critical' }, async ({ page }) => {
    let accessChecks = 0;
    await page.route(ADMIN_ACCESS_URL, async (route) => {
      if (await answerPreflight(route)) return;
      accessChecks += 1;
      await route.fulfill({ status: 200, headers: corsHeaders(route), json: { isAdmin: false } });
    });

    await page.goto('/admin/feedback');

    await expect.poll(() => accessChecks).toBeGreaterThan(0);
    await expect.poll(() => new URL(page.url()).pathname).not.toContain('/admin');
    await expect(page.getByRole('heading', { name: 'Feedback', level: 1 })).toHaveCount(0);
    await expect(page.getByTestId('feedback-detail')).toHaveCount(0);
  });
});
