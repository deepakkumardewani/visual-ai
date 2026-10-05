// The Vue dev server runs on 3005 (vite.config.mts); :3000 is an unrelated app on this machine.
export const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:3005';
export const API_URL = 'http://localhost:3006';
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
