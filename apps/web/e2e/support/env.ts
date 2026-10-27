// Default URLs match portless (`portless.json`). Override when using `dev:direct:*` (PORTLESS=0).
export const WEB_URL = process.env.E2E_WEB_URL ?? 'https://visual-ai.localhost';
export const API_URL = process.env.E2E_API_URL ?? 'https://api.visual-ai.localhost';
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
