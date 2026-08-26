# Profile tab content audit (read-only)

Scope: tab **content** only (IA, copy, density, forms/cards, empty/error/loading). Shell nav is noted only where it duplicates tab chrome.

Design language reference: landing/pricing use Young Serif headings, muted ledes, gold accent CTAs, credit packs (not plans). Profile already uses `--tw-*` tokens and Young Serif on some headings, but Favorites is History/Tailwind chrome.

## Inventory

### Profile components (`apps/web/src/components/Profile`)

| File              | Role                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `UserDetails.vue` | Profile tab body                                                                                 |
| `Payments.vue`    | Payments tab body                                                                                |
| `Favorites.vue`   | Dead stub: wraps `History :is-favorites`. **Not used.** `Profile.vue` imports `History` directly |

Deleted leftover: `Subscription.vue` (git: removed). No subscription tab remains.

### Page / related surfaces

- `apps/web/src/pages/Profile.vue` — tabs `user` \| `favorites` \| `payments` (`?tab=`). Unused import `faCrown` (subscription leftover).
- `apps/web/src/components/History/History.vue` — Favorites body
- `apps/web/src/components/History/NoResults.vue` — empty copy
- `apps/web/src/components/Avatar.vue` — Profile hero
- `apps/web/src/components/Header/CreditsChip.vue` — credits live in header, **not** on Profile

### Dialogs

| File                               | Tied to Profile?                                              |
| ---------------------------------- | ------------------------------------------------------------- |
| `Dialogs/DeleteDialog.vue`         | Yes — mounted inside `UserDetails`                            |
| `Dialogs/BuyMoreCreditsDialog.vue` | Header / low-credits; **not** opened from Profile tabs        |
| `Dialogs/LowCreditsDialog.vue`     | Not on Profile                                                |
| `Dialogs/PricingDialog.vue`        | Store still has `showPricing`; not Profile tab content        |
| Deleted                            | `PremiumDialog`, `ProUpgradeDialog`, `ConfirmCancelSubDialog` |

### Stores

- `stores/user.ts` — `credits`, `dailyCredits`, `payments`, leftover `hasJustSubscribed`
- `stores/dialog.ts` — `showDelete` / `hideDelete`; buy-credits + pricing + low-credits

---

## Shell (affects every tab)

`Profile.vue` intro: eyebrow “Account”, H1 = tab label, subtitle = nav description. Sidebar repeats the same label + description.

**Issues:** Title stack + panel H2s (Profile hero, History “Favorites”, Payments “Payment history”) = triple hierarchy. Unused `faCrown`.

**Improve:** Drop panel H2 when intro already names the tab, or make intro static (“Account”) and keep panel titles. Remove `faCrown`. Delete or wire `Favorites.vue`.

---

## Tab 1 — Profile (`user`)

**Contains:** Avatar + display name + email; fieldsets Name (first/last, Edit/Save/Cancel + checkmark); Username (same); Email (disabled + provider hint); Danger zone → Delete account; `DeleteDialog`.

**Files:** `pages/Profile.vue`, `components/Profile/UserDetails.vue`, `components/Avatar.vue`, `components/Dialogs/DeleteDialog.vue`

**Visual:** Card-less stacked fieldsets; hero + form + danger in one column. No credits card despite credits-only product. Dual H2 (page “Profile” + `user-details__name`). Ghost/primary buttons vs landing gold CTA. Danger block is a title + hint + button, not a clear card.

**Copy:** Hero email fallback “Add your details below” contradicts locked provider email. No inline validation copy. Delete dialog is strong (irreversible + checkbox).

**Missing states:** No skeleton while `userDetails` hydrates. Save failures only `console.error` (no toast/field error). No username taken / empty-name messages. No credits / daily allowance / buy-credits CTA.

**Improvements:**

1. Credits summary card (balance, daily remaining, “Buy credits” → `showBuyCredits` or `/pricing`) at top of this tab.
2. Inline error on failed save; disable Save until valid.
3. Hero subtitle = email or “Signed in with …” — never “Add your details below” if email is immutable.
4. Danger zone: bordered card, confirm copy already in dialog — keep one sentence on page.
5. Align primary buttons with pricing CTA (accent, not generic primary if that’s the system).

---

## Tab 2 — Favorites

**Contains:** Full History UI in favorites mode: toolbar title “Favorites” + Filter; date-grouped image grid; selection/bulk actions. Collections strip hidden.

**Files:** `pages/Profile.vue` (flush panel), `components/History/History.vue`, `components/History/NoResults.vue`, unused `components/Profile/Favorites.vue`

**Visual:** Dashboard History density (filters, selection, tiles) vs account form language. Duplicate “Favorites” (page H1 + toolbar H2). Tailwind utilities vs Profile SCSS. Flush panel is correct for grid; empty states are sparse/centered muted text.

**Copy:** True favorites-empty (has history, zero favs): “You have not added any favorites yet.” — no how-to, no CTA. If `history.length === 0`, `NoResults` shows **create** empty (“Nothing here yet / create something”) — wrong for a Favorites tab (implies no generations, not “none favorited”).

**Missing states:** No loading skeleton in this tab (depends on global history fetch). No fetch-error. No empty illustration. No “heart an image in Create/History” instruction.

**Improvements:**

1. Favorites-specific empty: if no history, “Generate something, then tap heart”; if history but no favs, CTA to Create/History.
2. Hide History toolbar H2 on Profile (parent already titles the tab); keep Filter.
3. Optional lighter Profile chrome: drop bulk-select chrome until user long-presses, to reduce density.

---

## Tab 3 — Payments

**Contains:** Header “Payment history”; loading skeletons; empty dashed card + CTA; table Date / Amount (₹) / Status / Method / Description.

**File:** `components/Profile/Payments.vue` (`userStore.payments`)

**Visual:** Young Serif title matches pricing. Empty card is light dashed — OK. Table is dense; no credits-purchased column. Loading = 3 bars (good). CTA `payments__cta` vs landing `LandingButton`.

**Copy leftovers (subscriptions):**

- Subtitle: “Past charges **and subscription renewals**.”
- Empty: “When you **upgrade or buy credits**…”
- CTA: “**View plans**” → `/pricing`

**Missing states:** No error if payments fetch fails. `loading` watch `{ immediate: true }` sets `loading = false` as soon as `payments` is current (often `[]`) → empty can flash instead of skeleton. No “credits added” column. No retry.

**Improvements:**

1. Rewrite: subtitle “Receipts for credit packs.” Empty: “Buy credits to generate — receipts appear here.” CTA: “Buy credits” (packs, not plans).
2. Add Credits column from payment metadata if API has it.
3. `loading` true until user bootstrap finishes, not until `payments` ref exists.
4. Error + retry row.
5. Optional: empty CTA opens `BuyMoreCreditsDialog` instead of only `/pricing`.

---

## Subscription leftovers (Profile surface)

| Location         | Leftover                                                      |
| ---------------- | ------------------------------------------------------------- |
| `Profile.vue`    | Unused `faCrown`                                              |
| `Payments.vue`   | renewals / upgrade / View plans                               |
| `stores/user.ts` | `hasJustSubscribed` (used by `utils/payment.ts` success path) |
| `Favorites.vue`  | Unused file                                                   |
| Header           | Credits live off-page; Profile never mentions balance         |

No live Pro/subscription tab UI. Copy and crown icon are the remaining product-language debt.

---

## Cross-tab IA gap

Account page has **identity + favorites + receipts** but **no credits tab**. For a credits-only economy, the Profile tab should own balance/packs, or Payments should lead with credits purchased + buy CTA. Right now users only see credits in the header chip.
