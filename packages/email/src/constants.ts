export const SITE_URL = 'https://visual-ai.app';
export const EMAIL_IMAGE_BASE_URL = `${SITE_URL}/email`;
export const UTM_QUERY = 'utm_source=email&utm_medium=announcement&utm_campaign=v2-launch';

export const FALLBACK_NAME = 'there';
export const BRAND_NAME = 'Visual AI';

export const COLORS = {
  background: '#f4f1ec',
  card: '#ffffff',
  text: '#1f1b16',
  muted: '#6b6258',
  accent: '#c98a5a',
  buttonText: '#ffffff',
  border: '#e6dfd5',
} as const;

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function withUtm(path: string): string {
  return `${SITE_URL}${path}?${UTM_QUERY}`;
}
