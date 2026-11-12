import { Section, Text } from '@react-email/components';

import { COLORS, FONT_SIZE, SPACE } from '../constants.js';
import { ScreenshotPanel } from './ScreenshotPanel.js';
import { eyebrowStyle } from './styles.js';

export interface HighlightProps {
  /** File name under the public /email folder, e.g. "models.png". */
  image: string;
  alt: string;
  title: string;
  description: string;
  /** Short label above the title, e.g. "01". */
  eyebrow: string;
}

const highlightTitleStyle = {
  fontSize: `${FONT_SIZE.title}px`,
  lineHeight: '26px',
  fontWeight: 700,
  color: COLORS.text,
  margin: `0 0 ${SPACE.xxs}px`,
} as const;
const highlightDescriptionStyle = {
  fontSize: `${FONT_SIZE.body}px`,
  lineHeight: '24px',
  color: COLORS.muted,
  margin: 0,
} as const;
export function Highlight({ image, alt, title, description, eyebrow }: HighlightProps) {
  return (
    <Section style={{ marginBottom: `${SPACE.xl}px` }}>
      <Text style={{ ...eyebrowStyle, margin: `0 0 ${SPACE.xxs}px` }}>{eyebrow}</Text>
      <Text style={highlightTitleStyle}>{title}</Text>
      <Text style={{ ...highlightDescriptionStyle, marginBottom: `${SPACE.sm}px` }}>
        {description}
      </Text>
      <ScreenshotPanel image={image} alt={alt} />
    </Section>
  );
}
