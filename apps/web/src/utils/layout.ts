/** Header/layout breakpoints in px. Mobile is strictly below MOBILE_MAX; desktop starts at DESKTOP_MIN. */
export const BREAKPOINT = {
  MOBILE_MAX: 768,
  DESKTOP_MIN: 1024,
} as const;

/** Create page layout split; matches DashboardShell / Tailwind `sm`. Intentionally separate from BREAKPOINT. */
export const CREATE_LAYOUT_SM = 640;

/** Height of the fixed top bar (`tw-h-16`). The single source for header-dependent heights. */
export const HEADER_BAR_PX = 64;

/** CSS custom property holding the space the header occupies above page content. */
export const APP_HEADER_HEIGHT_VAR = '--app-header-h';

/**
 * Tailwind height utility: full dynamic viewport minus the header. Must stay a complete static
 * literal (Tailwind scans source text, not template results); the value comes from the
 * `APP_HEADER_HEIGHT_VAR` property that AppHeader publishes from `HEADER_BAR_PX` / measurement.
 */
export const HEIGHT_BELOW_HEADER_CLASS = 'tw-h-[calc(100dvh-var(--app-header-h,64px))]';
