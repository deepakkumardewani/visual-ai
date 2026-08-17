# Remaining Vuetify by feature area (`apps/web`)

Scan: opening `<v-*` tags in `apps/web/src` (`.vue`/`.ts`, excluding tests except where noted). **15 files** still contain Vuetify templates. Dashboard / Explore / Compare / Auth / Header / Dialogs are already off Vuetify.

Custom replacements that exist: `CustomButton.vue` (header gold CTA to `/create`, **not** a generic `v-btn`), `AppModal.vue` (`v-dialog`), `primitives/Popover.vue`, `primitives/Tooltip.vue`, native `<button>` + Tailwind across Dashboard (~71 files), `LandingButton.vue` on the new landing.

---

## Already migrated (no `<v-*` in page/feature components)

| Area                   | Screens                                            | Notes                                                                            |
| ---------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Landing (live `/`)** | `pages/Landing.vue` + `components/Landing/*`       | Tailwind marketing site. `FaqSection` replaced `FAQ.vue` here.                   |
| **Dashboard**          | `/create`, `/explore`, `/assets` → `Dashboard.vue` | Zero Vuetify. `v-tabs-window` / `v-divider` only in `Dashboard.test.ts` strings. |
| **Explore image**      | `/explore/:id` + `components/Explore/*`            | Migrated.                                                                        |
| **Compare**            | `/compare` + `ComparisonCard.vue`                  | Migrated.                                                                        |
| **Auth**               | `/signin`, `/signup`                               | No Vuetify. `SignupDialog` uses `AppModal`.                                      |
| **Header**             | `AppHeader` + chips/menus                          | Tailwind; `CustomButton` on header only.                                         |
| **Dialogs**            | All `components/Dialogs/*.vue`                     | Wrap **`AppModal`**, no `v-dialog`.                                              |
| **Legal**              | Terms, Privacy, Refund                             | No Vuetify.                                                                      |
| **Profile**            | `/profile`                                         | No Vuetify.                                                                      |

---

## Remaining Vuetify (user-facing)

### 1. App shell — **functional** (toast + layout root)

- **Screens:** every route (`App.vue`).
- **Tags:** `v-app`, `v-main`, `v-snackbar`.
- **Replacement:** no snackbar primitive. Layout could be a plain `#app` + `<main>`.
- **Risk:** **functional** — global toasts (credits, copy, errors). Visual: full-app theme/layout shift.

### 2. Pricing — **visual** (still a Vuetify grid)

- **Screens:** `/pricing`.
- **Page:** `v-row`, `v-col` (`pages/Pricing.vue`).
- **Card:** `v-card*`, `v-btn`, `v-icon`, `v-divider`, `v-tooltip` (`PricingCard.vue`).
- **Also:** embeds leftover `FAQ.vue` (`v-row`/`v-col`).
- **Replacement:** `Landing/PricingTeaser` + `FaqSection` + `Tooltip` + native buttons. `CustomButton` is the wrong analog.
- **Risk:** **visual regression** (plan cards, tooltips). CTA click/checkout is functional but thin.

### 3. Contact — **functional** (form + snackbar)

- **Screens:** `/contact`.
- **Tags:** `v-container`, `v-row`, `v-col`, `v-form`, `v-text-field` (4), `v-textarea`, `v-btn` (2), `v-snackbar`.
- **Replacement:** Tailwind layout; native inputs; App snackbar or local toast. No form primitive.
- **Risk:** **functional** — validation, submit, success/error toast.

### 4. Gallery — **visual + functional** (lightbox)

- **Screens:** `/gallery`.
- **Tags:** `v-container`, `v-card`, `v-img`, `v-progress-circular`, `v-dialog`, `v-btn`.
- **Replacement:** `AppModal` for lightbox; `img` + Tailwind; Explore-style viewer if you unify.
- **Risk:** **functional** dialog/loading; **visual** grid.

### 5. Examples — **visual** (tabs)

- **Screens:** `/examples`.
- **Tags:** `v-tabs`, `v-tab`, `v-tabs-window`, `v-tabs-window-item`, `v-container`.
- **Replacement:** `primitives/SegmentedControl` or native tabs (Dashboard pattern).
- **Risk:** **visual**; tab state is light functional.

### 6. FAQs page — **visual** (via shared FAQ)

- **Screens:** `/faqs` (`Frequent.vue` has no Vuetify itself).
- **Tags:** `FAQ.vue` → `v-row`, `v-col`. Also used on Pricing + `PricingDialog`.
- **Replacement:** `Landing/FaqSection`.
- **Risk:** **visual**.

### 7. Referral copy — **functional** (toast)

- **Screens:** referral dialogs + User menu (`ReferralCode.vue`).
- **Tags:** `v-btn`, `v-snackbar`.
- **Replacement:** native button + App snackbar/`AppModal` parent.
- **Risk:** **functional** copy-to-clipboard feedback.

---

## Dead / unused Vuetify (not on live `/`)

New `/` is `Landing.vue`. These are **not imported** by any page (only auto `components.d.ts`):

| File                                       | Tags                                             | Risk if deleted                       |
| ------------------------------------------ | ------------------------------------------------ | ------------------------------------- |
| `components/Home/MiniGallery.vue`          | row/col/btn/card/img/hover/progress/transitions  | none (unused)                         |
| `components/Home/Hero.vue`                 | container/row/col/btn/img                        | unused                                |
| `components/Home/About.vue`                | row/col/**v-parallax**                           | unused                                |
| `components/Home/Features.vue`, `Chip.vue` | `v-chip`                                         | unused                                |
| `components/ResultColumn.vue`              | skeleton, hover, img, btn, icon, alert, snackbar | unused; Dashboard uses `ResultCanvas` |

Safe cleanup vs migrate: delete or quarantine Home + ResultColumn rather than restyle them.

---

## Suggested migration order

1. **App snackbar + `v-app`/`v-main`** (unblocks Contact/Referral toasts).
2. **Pricing + PricingCard + FAQ** (highest visual leftover).
3. **Contact form** (only real `v-form` / `v-text-field`).
4. **Gallery dialog** (`AppModal`).
5. **Examples tabs**.
6. Delete unused Home + ResultColumn.

**Do not treat Dashboard as remaining Vuetify.**
