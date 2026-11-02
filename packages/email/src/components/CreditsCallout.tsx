import { Section, Text } from '@react-email/components';
import { DAILY_CREDITS } from '@visual-ai/shared';

import { COLORS, FONT_SIZE, PREVIOUS_DAILY_CREDITS, RADIUS_PX, SPACE } from '../constants.js';
import { eyebrowStyle } from './styles.js';

const calloutStyle = {
  backgroundColor: COLORS.accentTint,
  border: `1px solid ${COLORS.accent}`,
  borderRadius: `${RADIUS_PX}px`,
  padding: `${SPACE.md}px`,
  textAlign: 'center',
  marginBottom: `${SPACE.xl}px`,
} as const;
const numbersStyle = {
  fontSize: `${FONT_SIZE.credits}px`,
  lineHeight: '48px',
  fontWeight: 800,
  color: COLORS.text,
  margin: `${SPACE.xxs}px 0`,
} as const;
const previousStyle = {
  color: COLORS.muted,
  textDecoration: 'line-through',
} as const;
const arrowStyle = {
  color: COLORS.accentText,
  padding: `0 ${SPACE.xs}px`,
} as const;
const captionStyle = {
  fontSize: `${FONT_SIZE.body}px`,
  lineHeight: '24px',
  color: COLORS.muted,
  margin: 0,
} as const;

/** Announces the daily free credit increase with both values visible. */
export function CreditsCallout() {
  return (
    <Section style={calloutStyle}>
      <Text style={{ ...eyebrowStyle, margin: 0 }}>More free credits</Text>
      <Text style={numbersStyle}>
        <span style={previousStyle}>{PREVIOUS_DAILY_CREDITS}</span>
        <span style={arrowStyle}>&rarr;</span>
        <span>{DAILY_CREDITS}</span>
      </Text>
      <Text style={captionStyle}>
        {`Daily free credits go up from ${PREVIOUS_DAILY_CREDITS} to ${DAILY_CREDITS}.`}
      </Text>
    </Section>
  );
}
