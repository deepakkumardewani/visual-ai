import { Img, Section, Text } from '@react-email/components';

import { COLORS, EMAIL_IMAGE_BASE_URL } from '../constants.js';

export const HIGHLIGHT_IMAGE_WIDTH = 540;

export interface HighlightProps {
  /** File name under the public /email folder, e.g. "models.png". */
  image: string;
  alt: string;
  title: string;
  description: string;
}

export function Highlight({ image, alt, title, description }: HighlightProps) {
  return (
    <Section style={{ marginBottom: '24px' }}>
      <Img
        src={`${EMAIL_IMAGE_BASE_URL}/${image}`}
        alt={alt}
        width={HIGHLIGHT_IMAGE_WIDTH}
        style={{
          width: '100%',
          maxWidth: `${HIGHLIGHT_IMAGE_WIDTH}px`,
          height: 'auto',
          borderRadius: '8px',
          display: 'block',
        }}
      />
      <Text style={{ fontSize: '18px', fontWeight: 700, color: COLORS.text, margin: '12px 0 4px' }}>
        {title}
      </Text>
      <Text style={{ fontSize: '15px', lineHeight: '22px', color: COLORS.muted, margin: 0 }}>
        {description}
      </Text>
    </Section>
  );
}
