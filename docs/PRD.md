# Visual AI — Product Requirements Document

## 1. Product Summary

Visual AI is a web-based AI image studio. Users type a prompt, pick a model, and generate images (Flux family via Replicate); they can also upscale, colorize, and restore old photos. Monetization is a freemium credit system with a Pro subscription (Razorpay).

- **Target users**: creators, marketers, and hobbyists who want fast, affordable AI images without running models themselves; secondary segment: people restoring/colorizing family photos.
- **Platform**: responsive web app (Vue 3 SPA) at a single dashboard-centric surface.

## 2. Goals

1. Fast prompt→image loop with visible progress and history.
2. Sustainable unit economics: credits map to Replicate per-image cost with margin.
3. Convert free users to Pro via model gating (premium models) and credit limits.
4. Grow organically via referrals and a public community gallery/feed.

Non-goals (current scope): video generation, mobile native apps, team/workspace features, API access for developers.

## 3. Personas

- **Free Explorer** — signs up with Clerk, gets 20 credits (refilled daily), uses fast models (`flux-schnell`, `flux-dev`).
- **Pro Creator** — pays a monthly subscription; unlocks premium models (`flux-pro`, `flux-1.1-pro`), 500 credits/month (cap 2000), higher-quality outputs.
- **Photo Restorer** — uploads old photos for colorize/revive utilities.

## 4. Feature Requirements

### 4.1 Generation (core)

| Requirement     | Detail                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Prompt composer | Prompt bar with model chip, generate CTA (Dashboard/Composer)                                           |
| Model picker    | Catalog with provider/model art, Pro badges; Pro-locked models redirect free users to `/pricing`        |
| Controls        | Aspect ratio (imageType), output format, output quality, number of outputs (1–4)                        |
| Progress        | Live progress via `/progress` polling (Redis-backed) with pending-row caption showing the active prompt |
| Results         | Result canvas with download, favorite, delete, upscale actions                                          |
| Credits         | Each generation deducts credits; insufficient credits blocks generation and prompts upgrade             |

### 4.2 Photo utilities

- **Upscale** — clarity-upscaler on generated or uploaded images.
- **Colorize** — basic (deoldify) and advanced (ddcolor).
- **Revive / Old Photos** — gfpgan face restore, bringing-old-photos-back-to-life.
- Before/after comparison slider in UI (`img-comparison-slider`).

### 4.3 History & library

- Per-user generation history with feature-type filter, favorites, single and bulk delete, no-results state.
- Community feed / gallery of public generations (Dashboard Canvas + `/gallery`).

### 4.4 Accounts & auth

- Clerk sign-up/sign-in; profile page (username, full name editing) is auth-gated.
- User lifecycle synced via Clerk webhooks; account deletion supported.

### 4.5 Monetization

- **Free**: 20 credits, daily refill to 20, base models only.
- **Pro**: Razorpay subscription; +500 credits monthly (cap 2000); premium models unlocked; cancel flow resets to free tier.
- One-time credit purchases via Razorpay orders with signature verification.
- Referral program: apply-referral endpoint grants credits; referral records stored on user.

### 4.6 Marketing site

- Landing, Examples, Gallery, Pricing, FAQs, Contact (sends email via nodemailer), Terms/Privacy/Refund pages.

## 5. User Flows (happy paths)

1. **Generate**: Sign in → Dashboard → type prompt → pick model → Generate → watch progress → view/download/favorite result → appears in history.
2. **Upgrade**: Free user clicks Pro model → redirected to Pricing → Razorpay checkout → webhook confirms → plan=pro, credits granted → model unlocked.
3. **Restore**: Upload old photo → choose colorize/revive → processed image with before/after slider → save to history.

## 6. Success Metrics

- Activation: % of signups completing ≥1 generation in first session.
- Engagement: generations/user/week; history revisit rate.
- Conversion: free→pro rate; premium-model-click → pricing → checkout funnel.
- Economics: avg Replicate cost per credit vs. revenue per credit.
- Reliability: generation success rate; p95 prompt→image latency.

## 7. Current Roadmap Direction (dashboard-v3 branch)

- Redesigned dashboard shell: sidebar, prompt bar, model picker trigger, result canvas, community feed, user generations grid.
- **Model catalog expansion** per [MODELS_COMPARISON.md](MODELS_COMPARISON.md): add budget (prunaai flux-fast, z-image-turbo), standard (seedream-4, flux-2-dev/pro, flux-kontext-pro, imagen-4, nano-banana-2), and premium (flux-2-max, kontext-max, gpt-image-2, nano-banana-pro) tiers — requires per-model input mapping and per-model credit pricing.
- Image _editing_ capability (kontext/seedream models accept reference images) — new UX surface beyond text→image.

## 8. Constraints & Risks

- Replicate model input schemas differ; the uniform request contract must be refactored before catalog expansion.
- Credit refill/webhook logic has multiple sources of truth (cron, webhook, daily endpoint) — reconcile to avoid double-grants.
- Embedded history in the User document will degrade with heavy users; pagination strategy needed.
- Razorpay is India-centric; international payments may need an additional provider.
