const PRODUCTION_SITE_URL = 'https://visual-ai.app';

// Override only for local previews (e.g. EMAIL_SITE_URL=https://visual-ai.localhost bun run dev).
// Defaults to production so a real send can never embed a local URL unless the var is set.
export const SITE_URL = (process.env.EMAIL_SITE_URL || PRODUCTION_SITE_URL).replace(/\/+$/, '');
export const EMAIL_IMAGE_BASE_URL = `${SITE_URL}/email`;
export const UTM_QUERY = 'utm_source=email&utm_medium=announcement&utm_campaign=v2-launch';

export const FALLBACK_NAME = 'there';
export const BRAND_NAME = 'Visual AI';
// Daily free credits before V2; the current value is DAILY_CREDITS.free in @visual-ai/shared.
export const PREVIOUS_DAILY_CREDITS = 20;

export const COLORS = {
  background: '#f4f1ec',
  card: '#fffdf9',
  text: '#1f1b16',
  muted: '#6b6258',
  accent: '#c98a5a',
  // Darker bronze for small text on white; the base accent fails 4.5:1 contrast there.
  accentText: '#8a5326',
  buttonText: '#1a140e',
  border: '#e6dfd5',
  // Matches the near-black app screenshots so their cropped edges blend into the frame.
  panel: '#0b0907',
  panelBorder: '#2b231b',
  // Text on the dark hero band; both clear 4.5:1 against COLORS.panel.
  onDark: '#f6efe6',
  onDarkMuted: '#c4b8a8',
  // Lightest text on white that still clears 4.5:1; for legal fine print.
  subtle: '#6f665c',
  accentTint: '#faf3ea',
} as const;

export const FONT_SIZE = {
  eyebrow: 12,
  small: 12,
  body: 16,
  title: 20,
  headline: 32,
  hero: 40,
  credits: 40,
  fine: 11,
} as const;

export const SPACE = { xxs: 4, xs: 8, sm: 16, md: 24, lg: 32, xl: 48 } as const;

export const EMAIL_WIDTH_PX = 600;
export const EMAIL_PADDING_X_PX = SPACE.lg;
export const CONTENT_WIDTH_PX = EMAIL_WIDTH_PX - 2 * EMAIL_PADDING_X_PX;
export const PANEL_PADDING_PX = 12;
// Screenshots sit inside a dark panel, so the image is inset by the panel padding on each side.
export const IMAGE_WIDTH_PX = CONTENT_WIDTH_PX - 2 * PANEL_PADDING_PX;
export const RADIUS_PX = 16;
export const LOGO_SIZE_PX = 40;

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function withUtm(path: string): string {
  return `${SITE_URL}${path}?${UTM_QUERY}`;
}
