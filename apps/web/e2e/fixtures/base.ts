import { test as playwrightTest, expect } from '@playwright/test';

import {
  createCloudinaryRecorder,
  installCloudinaryMock,
  type CloudinaryRecorder,
} from '../support/cloudinaryMock';

type BaseFixtures = {
  /** Auto fixture: mocks Cloudinary and fails the test if a request reaches the real network. */
  cloudinaryMock: CloudinaryRecorder;
};

type BaseOptions = {
  /** Opt out of the mock and guard, for tests that deliberately talk to real Cloudinary. */
  allowRealCloudinary: boolean;
};

export const test = playwrightTest.extend<BaseFixtures & BaseOptions>({
  allowRealCloudinary: [false, { option: true }],

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
