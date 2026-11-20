# Go-live checklist: separate Cloudinary cloud for dev, e2e and staging

Production (`ddzuitkzt`) must only appear in `.env.production*` files. Everything else uses a second free cloud.

## Owner steps

1. Create a second free Cloudinary account (the dev cloud). Optional: set a 70% usage alert in its console.
2. Note its cloud name, API key and API secret.
3. Repoint each file below to the dev cloud:
   - `apps/web/.env.local`: `VITE_CLOUDINARY_BASE_URL` (and `VITE_CLOUDINARY_ASSETS_URL` until Phase 4 removes it)
   - `apps/web/.env.staging`: same vars
   - `apps/web/.env.e2e*` (including `.env.e2e-preview`, `.env.e2e.local`): same vars
   - `apps/api/.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, keep `CLOUDINARY_BASE_PATH=private/development/uploads`
   - `apps/api/.env.staging`: same vars
4. Re-upload or accept that old production-hosted reference images will not validate against the dev cloud.
5. Run the leak check and confirm exit code 0:

   ```
   node apps/web/scripts/check-cloudinary-env.mjs; echo $?
   ```

6. Upload an image in a dev session and confirm it appears in the dev cloud, not production.

The script exits 1 and names each non-production env file that still contains `ddzuitkzt`.

# Go-live checklist: Dodo Pro subscription

## Test mode (done)

- Product "Visual AI Pro" ($5 USD, recurring monthly, `digital_products`) created in Dodo test mode: `pdt_0Nr936dADT9Drdc19jS1H`. It is set as `DODO_PRODUCT_ID_PRO` in the local `apps/api/.env` (gitignored). Set the same var in staging and `infra/.env` (the schema requires it when `PAYMENT_PROVIDER=dodo`).
- A test-mode subscription checkout session was created through `createSubscriptionCheckout` (host `test.checkout.dodopayments.com`).

## Live mode (owner, ask first)

1. Create the same product in live mode (Dodo dashboard or MCP with the live key). Product creation is a manual go-live step.
2. Set the live `DODO_PRODUCT_ID_PRO`, `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, and `DODO_PAYMENTS_ENVIRONMENT=live_mode`.
3. In the Dodo webhook settings subscribe the endpoint to the subscription events below.
4. Enable Adaptive Currency (Settings > Business) in live mode.

## Webhook events and payload fields

Source: `dodopayments` SDK 2.55.0 webhook union (`resources/webhooks/webhooks.d.ts`). The dodopayments MCP was not reachable from the build agent, so names were read from the SDK types, which mirror the Dodo docs.

| Dodo event                                                             | Normalized     | Effect on user                                                                                 |
| ---------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `subscription.active`                                                  | activated      | `plan=pro`, status `active`, `currentPeriodEnd = next_billing_date`, `cancelAtPeriodEnd=false` |
| `subscription.renewed`                                                 | renewed        | same as active (extends period end)                                                            |
| `subscription.cancelled`                                               | cancelled      | status `cancelled`, `cancelAtPeriodEnd=true`, Pro until the stored period end                  |
| `subscription.failed`, `subscription.on_hold`, `subscription.past_due` | payment_failed | status `past_due`, Pro until the stored period end (grace)                                     |
| `subscription.expired`                                                 | expired        | `plan=free`, status `expired`                                                                  |

Ignored: `subscription.paused`, `unpaused`, `plan_changed`, `updated`, `update_payment_method`.

Payload `data` extends the Dodo `Subscription`: `subscription_id`, `status`, `next_billing_date`, `previous_billing_date`, `cancel_at_next_billing_date`, `product_id`, `metadata`, `customer`. The envelope carries `type` and `timestamp`.

Idempotency and ordering: the Standard Webhooks `webhook-id` header plus the payload `timestamp`. The newest applied timestamp is stored in `subscription.lastEventAt`; an event with an older or equal timestamp is a no-op. Non-activation events only apply to the stored `providerSubscriptionId`.

## Owner checks in test mode

- Confirm `metadata.userId` from the checkout session is present on subscription webhook payloads (the lifecycle keys on it). If Dodo does not copy session metadata onto the subscription, tell the builder so the user lookup can fall back to the customer email or the subscription id.
- Complete a test checkout and confirm `GET /users/<id>` shows `plan: "pro"`.

# Go-live checklist: Adaptive Currency (T8.3)

**STATUS: DONE. Owner confirmed Adaptive Currency is enabled (2026-11-04).**

- [ ] Test mode: enable Adaptive Currency in the Dodo dashboard (Settings > Business).
- [ ] Test mode: confirm Adaptive Currency supports subscriptions (needed for Pro).
- [ ] Test mode: complete a checkout with a non-US billing address and confirm local currency shows for a credit pack.
- [ ] Test mode: same non-US checkout for Pro; confirm local currency shows.
- [ ] Live mode: enable Adaptive Currency, repeat the checks above.
- [ ] Record confirmation here (date, who, test vs live): 2026-11-04, owner (verbal confirmation in /build-phases session): Adaptive Currency already enabled; per-step test/live checkout results not itemised.

Supporting evidence (builder): `cd apps/api && bun run test` passed, 76 files, 973 tests.

# Go-live checklist: SPEC success criteria map (T10.2)

Each SPEC success criterion maps to a line below. Code-verifiable lines were run by the builder in T10.3; the rest are owner actions. Do not touch live resources until the owner has reviewed.

| #   | SPEC success criterion                                                             | Type         | Owner action / command                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Production Cloudinary <= ~4 credits/month                                          | Owner        | Interim: 7-day bandwidth < 1 GB on the Cloudinary dashboard (Reports > Usage) after deploy. Final: full-month credits <= ~4 at month end.                                                                                                                                                                                                                                                                          |
| 2   | Full Playwright run (dev and e2e-preview) makes 0 requests to `res.cloudinary.com` | Code         | `cd apps/web && bun run test:e2e` and `E2E_SERVER=prod bun run test:e2e` (asserted by `e2e/qa/landing-no-cloudinary.spec.ts`).                                                                                                                                                                                                                                                                                     |
| 3   | Dev and e2e use 0 production credits                                               | Code + owner | `node apps/web/scripts/check-cloudinary-env.mjs; echo $?` must print 0 (first checklist above). Owner: finish the second Cloudinary account repoint and the 70% usage alert, then upload in a dev session and confirm it lands in the dev cloud.                                                                                                                                                                   |
| 4   | Landing/marketing pages request no Cloudinary URLs                                 | Code         | `cd apps/web && bunx playwright test e2e/qa/landing-no-cloudinary.spec.ts`; in prod, open `/` with DevTools Network filtered on `cloudinary` and expect no requests.                                                                                                                                                                                                                                               |
| 5   | Pro purchasable via Dodo, every perk enforced server-side                          | Code + owner | Code: `cd apps/api && bun run test` and `cd apps/web && bunx playwright test e2e/qa/pro-tier.spec.ts`. Owner (ask first): create the live Pro product, set live `DODO_PRODUCT_ID_PRO` in prod and `infra/.env`, subscribe the webhook endpoint to the subscription events above, enable Adaptive Currency (done 2026-11-04), then buy Pro once with a real card and confirm `GET /users/<id>` shows `plan: "pro"`. |
| 6   | Production geo header confirmed                                                    | Owner        | On production, send a request through the edge and confirm the country header reaches the API (local currency shows on the pricing dialog from a non-US location; no header gives USD).                                                                                                                                                                                                                            |
| 7   | Total infra (Replicate + DigitalOcean + Cloudinary) < $30/month, Cloudinary $0     | Owner        | At month end, sum the Replicate, DigitalOcean and Cloudinary invoices; confirm < $30 and that Cloudinary stayed on the free plan.                                                                                                                                                                                                                                                                                  |
| 8   | Webhook lifecycle (activate, renew, cancel, fail) flips `plan` with idempotency    | Code + owner | Code: `cd apps/api && bun run test` (webhook mapper and idempotency tests). Owner: in test mode run checkout, cancel and a failed payment, replay a webhook and confirm the user state does not change twice.                                                                                                                                                                                                      |

Local suite commands, all expected green: `cd apps/api && bun run test`; `cd apps/web && bun run test`; `bun run check`; `bun run lint`; `cd apps/web && bun run test:e2e`; `cd apps/web && E2E_SERVER=prod bun run test:e2e`.
