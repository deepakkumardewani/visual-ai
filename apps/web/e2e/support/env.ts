// Default URLs match portless (`portless.json`). Override when using `dev:direct:*` (PORTLESS=0).
export const WEB_URL = process.env.E2E_WEB_URL ?? 'https://visual-ai.localhost';
export const API_URL = process.env.E2E_API_URL ?? 'https://api.visual-ai.localhost';

/** Browser origin for CORS on mocked API responses (matches Playwright baseURL in prod preview). */
const e2eProdPort = Number(process.env.E2E_PROD_PORT ?? 4173);
export const E2E_WEB_ORIGIN =
  process.env.E2E_SERVER === 'prod' ? `http://127.0.0.1:${e2eProdPort}` : WEB_URL;
export const AUTH_STATE_PATH = 'playwright/.auth/user.json';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[e2e] Missing ${name}. Copy .env.e2e.example to .env.e2e.local and fill it in.`,
    );
  }
  return value;
}
