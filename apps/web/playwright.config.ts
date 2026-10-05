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
      name: 'chromium',
      testIgnore: /auth\.setup\.ts/,
      grepInvert: /@guest/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE_PATH },
    },
  ],
});
