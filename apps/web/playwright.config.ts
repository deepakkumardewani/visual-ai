import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

import { AUTH_STATE_PATH, WEB_URL } from './e2e/support/env';

// Vite only exposes VITE_* vars, so the secret in this file never reaches the bundle.
// dotenv does not override vars already set in the shell; a missing file is reported by preflight.
dotenv.config({ path: '.env.e2e.local', quiet: true });

const useProdServer = process.env.E2E_SERVER === 'prod';
const e2eProdPort = Number(process.env.E2E_PROD_PORT ?? 4173);
const prodWebUrl = `http://127.0.0.1:${e2eProdPort}`;

const webServer = useProdServer
  ? {
      command: `bun run build && bun run preview -- --port ${e2eProdPort} --strictPort`,
      url: prodWebUrl,
      reuseExistingServer: false,
    }
  : undefined;

// Default (unset or E2E_SERVER=dev): no webServer — web app and API are already running locally.
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global.setup.ts',
  ...(webServer ? { webServer } : {}),
  use: {
    baseURL: useProdServer ? prodWebUrl : WEB_URL,
    // Portless serves HTTPS with a local CA (`portless trust`).
    ignoreHTTPSErrors: useProdServer ? false : WEB_URL.startsWith('https://'),
  },
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
