import { API_URL, WEB_URL, requireEnv } from './env';

const TEST_KEY_PREFIX = 'sk_test_';
const CLERK_API_URL = 'https://api.clerk.com/v1';
const SERVER_PROBE_TIMEOUT_MS = 5_000;

function assertTestSecretKey(secretKey: string) {
  if (!secretKey.startsWith(TEST_KEY_PREFIX)) {
    throw new Error(
      `[e2e] CLERK_SECRET_KEY must start with "${TEST_KEY_PREFIX}"; refusing to sign in with a live key.`,
    );
  }
}

async function assertClerkUserExists(secretKey: string, userId: string) {
  const res = await fetch(`${CLERK_API_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) {
    throw new Error(
      `[e2e] Clerk user ${userId} not found in this Clerk instance (HTTP ${res.status}). ` +
        'The dev instance may have been reset or the user deleted.',
    );
  }
}

// Any HTTP response counts as "up" (the API has no route on "/"); only network failures matter.
async function assertServerResponds(name: string, url: string) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(SERVER_PROBE_TIMEOUT_MS) });
  } catch (error) {
    throw new Error(
      `[e2e] ${name} is not responding at ${url}. Start it yourself; E2E never starts servers.`,
      {
        cause: error,
      },
    );
  }
}

export async function runPreflight() {
  const secretKey = requireEnv('CLERK_SECRET_KEY');
  assertTestSecretKey(secretKey);
  requireEnv('E2E_CLERK_USER_EMAIL');
  await assertClerkUserExists(secretKey, requireEnv('E2E_CLERK_USER_ID'));
  await assertServerResponds('Web app', WEB_URL);
  await assertServerResponds('API', API_URL);
}
