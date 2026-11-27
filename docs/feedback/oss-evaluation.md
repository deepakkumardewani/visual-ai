# Open-source product-feedback tools: evaluation

Date: 2026-11-27. Stats are from the GitHub API on that date (stars, latest release, last push). Feature columns for ClearFlask and Quackback are from their READMEs and not deeply verified.

We want two things: (1) a contextual in-app feedback / NPS / testimonial popup shown after a generation succeeds, and (2) optionally a public feature-vote board. This doc checks whether an existing OSS tool covers that cheaply, given our stack: Vue 3 web app, Bun API, MongoDB, Clerk auth, existing email package.

## Comparison

| Tool       | In-app survey / NPS                | Vote board       | Roadmap               | Widget / SDK               | License                                             | Self-host stack                               | Latest release (stars)                          | Fit        |
| ---------- | ---------------------------------- | ---------------- | --------------------- | -------------------------- | --------------------------------------------------- | --------------------------------------------- | ----------------------------------------------- | ---------- |
| Formbricks | Yes (core product, event triggers) | No               | No                    | JS SDK (MIT), iOS/Android  | AGPL-3.0 core, MIT SDKs, source-available `ee/` dir | Next.js + Postgres (+ Redis), Docker          | 6.2.3, 2026-11-25 (13.3k)                       | Medium     |
| Fider      | No                                 | Yes              | Basic (statuses)      | No SDK, link / iframe only | AGPL-3.0                                            | Go binary + Postgres, SMTP required           | v0.41.0, 2026-11-25 (4.6k)                      | Low        |
| Astuto     | No                                 | Yes              | Yes (statuses)        | Embeddable-ish, no SDK     | AGPL-3.0                                            | Rails + Postgres                              | v1.1.2, 2025-03-03 (2.3k), **archived 2026-01** | Reject     |
| LogChimp   | No                                 | Yes              | Yes + changelog (WIP) | No SDK                     | Open core (`server/src/ee` is proprietary)          | Node/Express + Vue + Postgres                 | v0.9.4, 2026-11-02 (1.1k), pre-1.0              | Low        |
| ClearFlask | Limited                            | Yes (ideas, Q&A) | Yes                   | Embeddable widget / SSO    | Apache-2.0                                          | Java + ElasticSearch/Dynamo-like store, heavy | 2.7.3, 2026-11-14 (452)                         | Low        |
| Quackback  | Feedback intake, voting            | Yes              | Yes + changelog       | Embeddable widget          | AGPL-3.0                                            | TypeScript, Postgres                          | v0.16.1, 2026-11-24 (374), young                | Low-Medium |

## Notes per tool

**Formbricks** is the only candidate that does in-app surveys, NPS and event-triggered popups. It ships a JS SDK and a hosted cloud. Self-hosting needs a Next.js app plus Postgres, which is a second database next to our Mongo, and users sync via the SDK, not our Mongo. Some features (teams, SSO, advanced targeting) sit behind the `ee/` license. Most of what we need is one trigger and one prompt. Source: https://github.com/formbricks/formbricks and its LICENSE file.

**Fider** is a mature, simple, Go-based idea board with votes and statuses, and it is actively maintained. It has no surveys or NPS, no popup widget, and it needs its own Postgres, SMTP and a separate auth (it has no Clerk adapter, only OAuth providers). Good for a public board, wrong for in-flow prompts. Source: https://github.com/getfider/fider

**Astuto** (Riggraz/astuto) is a Rails board with voting and a roadmap. The repo was archived in January 2026 and the last release was March 2025, so it is unmaintained. Do not adopt. Source: https://github.com/Riggraz/astuto

**LogChimp** is a Node + Vue board with voting, a roadmap and a changelog, and the stack looks close to ours. It is still pre-1.0 (v0.9.x), has about 1.1k stars, Postgres is required, and it has no survey or popup layer. Source: https://github.com/logchimp/logchimp

**ClearFlask** (Apache-2.0) is feature-rich (ideas, roadmap, Q&A, SSO, widget) but heavy to self-host (Java server and a search/DB backend) and has a small community. Over-built for our needs. Source: https://github.com/clearflask/clearflask

**Quackback** is a newer (v0.16) TypeScript feedback + roadmap + changelog tool with an embeddable widget. It is promising but young and AGPL, and it brings its own Postgres and auth. Revisit later if we want a public board. Source: https://github.com/quackbackio/quackback

(Canny, Featurebase and UserVoice were out of scope: closed SaaS with per-seat or per-tracked-user pricing.)

## Common blockers for all of them

- Every tool is a separate service with its own database (Postgres) and its own user model, so we would run and pay for another service next to Mongo.
- None can read our generation events or our credit and plan data to decide eligibility. We would have to push events out and mirror state.
- None has native Clerk identity. We would need SSO glue or anonymous submissions.
- None captures testimonial consent (a publish-on-landing opt-in tied to a user and a generation).
- AGPL-3.0 (most of them) adds obligations if we modify and expose the code.

## Recommendation: build natively

Decision: build it ourselves. Reasons:

1. **Contextual success-moment popup.** The prompt should fire right after a generation completes, with the generation as context. That is a few lines in our own event flow. With Formbricks it means wiring an SDK, custom actions and attribute syncing.
2. **Server-side eligibility in our Mongo.** Eligibility rules (N successful generations, not asked recently, not already rated, plan or credit state) are queries on data we already hold. An external tool would need that data mirrored and kept in sync.
3. **Clerk identity.** Submissions attach to our Clerk `userId` with no SSO bridge or anonymous-user reconciliation.
4. **No extra service to host or pay for.** No second database, no Docker deployment to patch, no SMTP setup. We reuse Mongo, the Bun API and the email package.
5. **Testimonial consent capture.** We need an explicit, auditable opt-in to show a quote publicly (name, avatar, quote, consent timestamp). No OSS tool models this.
6. **Small scope.** The MVP is one collection (feedback and testimonials), two or three endpoints, one Vue modal and an admin list. That is less work than integrating, theming and hosting a separate product.
7. **License and lock-in.** Avoids AGPL and `ee/` license questions, and keeps data in our own schema.

Revisit if scope grows into a public voting board plus changelog. Fider or Quackback could then run on a subdomain as a standalone add-on, without touching the in-app popup.
