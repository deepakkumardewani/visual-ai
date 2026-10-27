# Playwright E2E (apps/web)

The **e2e root is `apps/web`**, not the monorepo root. All paths below are relative to `apps/web`.

## Run tests

```bash
cd apps/web && bunx playwright test <spec>
```

Examples:

```bash
cd apps/web && bunx playwright test e2e/qa/_template.spec.ts
cd apps/web && bunx playwright test e2e/qa/billing-purchase.spec.ts --repeat-each=3
```

## Base URL

Configured in `e2e/support/env.ts`: `WEB_URL` / `API_URL` default to portless (`https://visual-ai.localhost`, `https://api.visual-ai.localhost`). Override with `E2E_WEB_URL` / `E2E_API_URL` when using `dev:direct:*`.

## Auth

- One-time: copy `.env.e2e.example` → `.env.e2e.local` and fill Clerk test keys plus the seeded e2e user (`E2E_CLERK_USER_ID`, `E2E_CLERK_USER_EMAIL`).
- Seed the Mongo user: `cd apps/api && bun run seed:e2e-user`.
- Refresh storage state: `cd apps/web && bun run auth:state` (runs `e2e/auth.setup.ts`, writes `playwright/.auth/user.json` at `AUTH_STATE_PATH`).
- Specs in the `chromium` project reuse that storage state; `@guest` specs use an empty state.

## No webServer

`playwright.config.ts` does **not** start the Vue app or API. Both must already be running locally (dev servers). Tests never spawn servers.

## Environment file

- Template: `.env.e2e.example`
- Local secrets: `.env.e2e.local` (gitignored), loaded by `playwright.config.ts` via `dotenv` (does not override existing shell vars).
- `e2e/global.setup.ts` runs preflight checks for required vars.

## Mocking third parties

Prefer **`page.route`** to block or stub third-party network calls (analytics, payment SDKs, external APIs) so tests stay deterministic.

Use **`page.addInitScript`** to stub browser-only SDK globals before navigation when the app reads `window.*` (e.g. overlay checkout).

The real local API is used for data unless a spec explicitly routes API calls. **There is no seed init script:** each test creates its own state through the real API (or stubs only the provider UI boundary). Tests must not depend on shared mutable DB state from other tests.

## Selector policy

- Prefer **`getByRole`**, **`getByLabel`**, and **`getByTestId`**.
- Do **not** use CSS selectors, `nth-child`, or **`waitForTimeout`** for synchronization.
- Use Playwright auto-waiting and `expect` polling instead.

## Layout

| Path                         | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `e2e/README.md`              | This file                                   |
| `e2e/qa/_template.spec.ts`   | Copy to start new `e2e/qa/<area>.spec.ts`   |
| `e2e/qa/*.spec.ts`           | Feature QA specs                            |
| `e2e/scenarios/*.feature.md` | Human-readable scenarios                    |
| `e2e/fixtures/`              | Shared Playwright fixtures (`qa.ts`, stubs) |
| `e2e/support/`               | Env, preflight, webhook signing helpers     |

## Fixtures

See `e2e/fixtures/README.md`. New QA specs should import `test` and `expect` from `e2e/fixtures/qa.ts` for the authenticated page, console-error guard, screenshots, and signed webhook helper.
