import { test as playwrightTest, expect } from '@playwright/test';

import {
  createCloudinaryRecorder,
  installCloudinaryMock,
  type CloudinaryRecorder,
} from '../support/cloudinaryMock';
import {
  createPaidCallRecorder,
  guardApiRequest,
  installPaidCallRouteGuard,
  paidCallMessage,
  type PaidCallRecorder,
} from '../support/paidCallGuard';

type BaseFixtures = {
  /** Auto fixture: mocks Cloudinary and fails the test if a request reaches the real network. */
  cloudinaryMock: CloudinaryRecorder;
  /** Auto fixture: blocks and fails the test on un-stubbed paid generation requests. */
  paidCallGuard: PaidCallRecorder;
};

type BaseOptions = {
  /** Opt out of the mock and guard, for tests that deliberately talk to real Cloudinary. */
  allowRealCloudinary: boolean;
  /**
   * Opt out of the paid-call guard. Only for tests whose real request is rejected before a job is
   * enqueued (403/validation); explain why in a comment next to the opt-in.
   */
  allowRealPaidCalls: boolean;
};

export const test = playwrightTest.extend<BaseFixtures & BaseOptions>({
  allowRealCloudinary: [false, { option: true }],
  allowRealPaidCalls: [false, { option: true }],

  paidCallGuard: [
    async ({ context, allowRealPaidCalls }, use) => {
      const recorder = createPaidCallRecorder();
      if (allowRealPaidCalls) {
        await use(recorder);
        return;
      }
      await installPaidCallRouteGuard(context, recorder);
      guardApiRequest(context.request, recorder);
      await use(recorder);
      expect(recorder.hits, paidCallMessage(recorder.hits)).toEqual([]);
    },
    { auto: true },
  ],

  // The standalone `request` fixture is its own context, separate from page.request.
  request: async ({ request, paidCallGuard, allowRealPaidCalls }, use) => {
    if (!allowRealPaidCalls) guardApiRequest(request, paidCallGuard);
    await use(request);
  },

  cloudinaryMock: [
    async ({ context, allowRealCloudinary }, use) => {
      const recorder = createCloudinaryRecorder();
      if (allowRealCloudinary) {
        await use(recorder);
        return;
      }
      await installCloudinaryMock(context, recorder);
      await use(recorder);
      expect(
        recorder.networkHits,
        `Cloudinary requests reached the network:\n${recorder.networkHits.join('\n')}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
