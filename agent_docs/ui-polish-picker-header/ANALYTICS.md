# Per-user analytics: research and recommendation

Scope: SPEC Part 5. Research only; no code, schema or API change. Sources are the vendors' official documentation. Every cited page was fetched live on 2026-11-19 and each claim checked against it; vendor pricing changes often, so re-check numbers before committing to a plan.

## 1. Can Simple Analytics do per-user custom analytics?

Short answer: no for per-user identity, partially for per-event counts.

- Simple Analytics is cookieless and privacy-first by design. It does not store a persistent visitor identity and does not track individuals across sessions. See [Simple Analytics privacy](https://docs.simpleanalytics.com/what-we-collect) and [Why Simple Analytics](https://docs.simpleanalytics.com/).
- Custom events exist (`sa_event`) and can carry metadata. See [Events](https://docs.simpleanalytics.com/events) and [Metadata](https://docs.simpleanalytics.com/metadata).
- Sending a user id as metadata is prohibited, not merely discouraged. The metadata page states: "Do not include personal data in your metadata like email addresses, identifiers, or any other type of personal data. We don't allow it and your account might be suspended." Sending our Clerk `userId` would therefore breach their terms and risk the account.
- The tool sets no cookies and uses no local storage, fingerprinting or IP hashing, and stores no IP addresses, so there is no visitor identity to report on. See [What we collect](https://docs.simpleanalytics.com/what-we-collect).
- Reporting is aggregate. There is no "per user per date" report and no per-user cost view. Data can be pulled through the [Stats API](https://docs.simpleanalytics.com/api/stats) and the [Export API](https://docs.simpleanalytics.com/api/export-data-points) (page views and events), but cost is not a concept it models.

Conclusion: hypothesis confirmed (per-user identity is forbidden by their metadata rules and absent by design). Simple Analytics is right for anonymous traffic and funnels and wrong for images-per-user-per-date or cost-per-user.

## 2. Comparison of options

Criteria: per-user identity, custom events with properties, cost, privacy and consent, self-host burden, query and export.

| Option | Per-user identity | Custom events + properties | Cost | Privacy / consent | Self-host burden | Query / export |
|---|---|---|---|---|---|---|
| [PostHog](https://posthog.com/docs) (cloud free tier) | Yes: `identify()` with our userId creates person profiles ([identify](https://posthog.com/docs/product-analytics/identify)) | Yes, arbitrary properties; free monthly allowance that renews each month, then usage-based ([pricing](https://posthog.com/pricing)) | Free tier, then usage-based | First-party cookie by default; a cookieless mode (`always`) avoids cookies and storage and ignores opt-in/out, but it is for anonymous measurement, so per-user identity still implies cookies/consent considerations ([cookieless](https://posthog.com/tutorials/cookieless-tracking), [data collection](https://posthog.com/docs/privacy/data-collection)) | Cloud: none. Self-host is documented ([self-host](https://posthog.com/docs/self-host)); the deployment includes ClickHouse | HogQL (SQL) in UI, [Query API](https://posthog.com/docs/api/query), batch exports |
| [Umami](https://docs.umami.is/docs) | Limited: `identify` session data exists ([tracker functions](https://docs.umami.is/docs/tracker-functions)) but it is session-oriented, not a user ledger | Yes, events with data properties ([event data](https://docs.umami.is/docs/event-data)) | Free self-hosted; Cloud Hobby plan $0 (up to 100K events/month, 1 website), Pro from $20/month ([pricing](https://umami.is/pricing)) | Cookieless, no PII by design | Light: Node.js + PostgreSQL ([install](https://docs.umami.is/docs/install)) | [API](https://docs.umami.is/docs/api) and DB access; no ad hoc SQL UI |
| [Plausible](https://plausible.io/docs) (CE or cloud) | No user identity by design | Custom events with props ([custom props](https://plausible.io/docs/custom-props/introduction)) | Cloud is paid with a free trial; Community Edition is free and AGPL ([self-hosted overview](https://plausible.io/self-hosted-web-analytics)) | Cookieless, no consent banner | Moderate: you run and upgrade it yourself; the [CE repo](https://github.com/plausible/community-edition) ships a ClickHouse setup | [Stats API](https://plausible.io/docs/stats-api), CSV export |
| [Mixpanel](https://docs.mixpanel.com/) / [Amplitude](https://amplitude.com/docs) | Yes | Yes | Free tiers exist; check each vendor's pricing page | Third party holds user ids; consent needed | None (SaaS) | Rich query UI; export API/warehouse |

Take-aways:

- Only PostHog and the SaaS product analytics tools give true per-user identity. Plausible and Umami are cookieless aggregate tools, same class as Simple Analytics.
- None of them is a billing ledger. Event pipelines are sampled, can be blocked by ad blockers (client side), and are not designed to be an exact record of what a user was charged.
- Cost per user needs numbers we only know on the server (credits charged, Replicate cost). Client-side tools never see these; we would have to send server-side events, which removes most of their advantage over our own database.

## 3. First-party approach: Mongo usage ledger plus admin page

We already run MongoDB (Mongoose) and the API already owns credits and generation. A ledger answers the real question (what did each user generate and what did it cost us) exactly, with no third party and no consent concerns beyond what we already hold.

Background facts about today's data: `apps/api/src/models/image.ts` stores `userId`, `modelName`, `createdAt` and `humanReadableDate` per generation, but nothing about credits charged or Replicate cost. So images-per-user-per-date can be backfilled from `Image` (count `images.length` grouped by `userId` and `humanReadableDate`), but credits and cost cannot be backfilled accurately. Any cost shown for history would be an estimate from current model prices and must be labelled as such.

Proposed collection `UsageEvent` (append-only):

| Field | Notes |
|---|---|
| `userId` | Clerk id, string |
| `predictionId` | Replicate prediction id; unique key for idempotency |
| `model` | model identifier |
| `kind` | `image` or `video` |
| `imageCount` | number of outputs |
| `creditsCharged` | integer credits deducted |
| `costUsd` | Replicate cost from prediction metrics (see [Replicate prediction object](https://replicate.com/docs/reference/http#predictions.get), `metrics.predict_time` times the model's per-second rate, or per-output price for per-image models); nullable until known |
| `status` | `succeeded`, `failed`, `refunded` |
| `createdAt`, `day` | `day` as a UTC `YYYY-MM-DD` string to make daily grouping cheap and timezone-explicit |

Indexes ([Mongo indexes](https://www.mongodb.com/docs/manual/indexes/)):

- Unique `{ predictionId: 1 }` for idempotency.
- `{ userId: 1, createdAt: -1 }` for per-user history.
- `{ day: 1, userId: 1 }` for the admin per-date rollup.

Idempotency: write with an upsert keyed on `predictionId` (`$setOnInsert` for the immutable fields), so webhook retries and double submits create one row. Status transitions use conditional updates (`{ predictionId, status: "succeeded" }` to `refunded`) so a refund applies once. See [updateOne upsert](https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/).

Refund and failure handling: write the row when credits are reserved or charged, then update `status`. On a failed or cancelled prediction set `status: "failed"` and `creditsCharged` to 0 if credits are returned, or keep the original amount plus a `refunded` row so that the net is auditable. Cost still counts toward spend if Replicate billed a failed run; record `costUsd` regardless of status.

Admin page: an admin-only route backed by aggregation ([aggregation pipeline](https://www.mongodb.com/docs/manual/core/aggregation-pipeline/)) grouped by `day` and `userId`, showing images, credits and USD cost, with CSV export. There is no admin authorization in `apps/api/src` today, so the gate must be built: for example a Clerk role stored in `publicMetadata` and read from the session token ([Clerk RBAC with metadata](https://clerk.com/docs/guides/secure/basic-rbac)), or a server-side userId allowlist. Enforce it on the API, not only by hiding the route in the client.

Caveats: ledger writes must sit next to the credit charge so they cannot diverge; Replicate's final cost may only be available after completion, hence the nullable `costUsd` and a completion update.

## 4. Recommendation

Recommend building the first-party Mongo usage ledger with an admin-only page, and keeping Simple Analytics for anonymous traffic.

Why: the questions asked (images per user per date, cost per user) are billing facts known only on the server. A ledger gives exact answers, zero new vendors or consent surface, and reuses Mongo and Clerk. PostHog would be the second choice if product-behaviour analytics (funnels, retention per user) become a need; it should not be the system of record for cost.

Rough effort (one engineer, including tests):

| Piece | Estimate |
|---|---|
| Model, indexes, idempotent write at charge/refund points | 0.5 to 1 day |
| Capture Replicate cost on completion | 0.5 day |
| Admin authorization (new: role in Clerk `publicMetadata` or allowlist, API middleware, tests) | 0.5 to 1 day |
| Admin API (aggregation, CSV) | 0.5 day |
| Admin page (table, date filter, export) | 1 day |
| Tests (unit, mocked e2e; no real Replicate calls) | 0.5 to 1 day |
| Total | about 3.5 to 5 days |

Optional backfill of image counts only from `Image`: about 0.5 day, with cost shown as unknown for history.

Open decision for the owner: whether cost is stored in USD at write time or derived later from a price table (storing at write time is recommended so later price changes do not rewrite history).
