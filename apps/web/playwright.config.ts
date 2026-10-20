import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

import { AUTH_STATE_PATH, WEB_URL } from './e2e/support/env';

// Vite only exposes VITE_* vars, so the secret in this file never reaches the bundle.
// dotenv does not override vars already set in the shell; a missing file is reported by preflight.
dotenv.config({ path: '.env.e2e.local', quiet: true });

// No webServer: the web app and API are always running locally.
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global.setup.ts',
  use: { baseURL: WEB_URL },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'guest',
      testMatch: /auth\.spec\.ts/,
      grep: /@guest/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'chromium-billing',
      // Single Clerk user + real API: keep all billing QA specs in one serial project.
      testMatch: /billing-(purchase|history)\.spec\.ts/,
      workers: 1,
      fullyParallel: false,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE_PATH },
    },
    {
      name: 'chromium',
      testIgnore: [/auth\.setup\.ts/, /billing-(purchase|history)\.spec\.ts/],
      grepInvert: /@guest/,
      dependencies: ['setup'],
      // Real local API + one Clerk user: parallel signed-in specs race on /users/user_*.
      workers: 1,
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE_PATH },
    },
  ],
});
