import { COLORS, FONT_SIZE } from '../constants.js';

/** Small uppercase label shared by the header eyebrow and each highlight number. */
export const eyebrowStyle = {
  fontSize: `${FONT_SIZE.eyebrow}px`,
  lineHeight: '16px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: COLORS.accentText,
} as const;
