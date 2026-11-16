/** Header/layout breakpoints in px. Mobile is strictly below MOBILE_MAX; desktop starts at DESKTOP_MIN. */
export const BREAKPOINT = {
  MOBILE_MAX: 768,
  DESKTOP_MIN: 1024,
} as const;

/** Create page layout split; matches DashboardShell / Tailwind `sm`. Intentionally separate from BREAKPOINT. */
export const CREATE_LAYOUT_SM = 640;
