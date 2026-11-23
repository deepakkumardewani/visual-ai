# Media API pipeline, uploads and assets

# evidence: apps/api/src/routes/media.ts, services/media-service.ts, lib/media-upload.ts, e2e/fixtures/media.ts, e2e/support/paidCallGuard.ts

## @critical Fake music generate returns 202, SSE completes and the balance drops by exactly the cost.

## @critical Failure variant (noCharge) returns 202, SSE reports an error with noCharge and the balance is unchanged.

## @critical Insufficient variant returns 402 with required and available and nothing is enqueued.

## @high Fake audio appears in GET /media/assets (and only under type=audio).

## @high Uploading sample.mp3 returns an uploadId and durationSec.

## @high sample.mp3 renamed .png is rejected for an image purpose before any storage call.

## @critical Guard self-test: a deliberately un-intercepted POST to each broadened paid path is reported by the guard and never reaches a paid service.
