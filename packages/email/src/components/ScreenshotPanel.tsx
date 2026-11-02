import { Img, Section } from '@react-email/components';

import {
  COLORS,
  EMAIL_IMAGE_BASE_URL,
  IMAGE_WIDTH_PX,
  PANEL_PADDING_PX,
  RADIUS_PX,
} from '../constants.js';

interface ScreenshotPanelProps {
  /** File name under the public /email folder, e.g. "models.png". */
  image: string;
  alt: string;
}

/** Frames a dark app screenshot in a rounded panel so cropped edges look intentional. */
export function ScreenshotPanel({ image, alt }: ScreenshotPanelProps) {
  return (
    <Section
      style={{
        backgroundColor: COLORS.panel,
        border: `1px solid ${COLORS.panelBorder}`,
        borderRadius: `${RADIUS_PX}px`,
        padding: `${PANEL_PADDING_PX}px`,
      }}
    >
      <Img
        src={`${EMAIL_IMAGE_BASE_URL}/${image}`}
        alt={alt}
        width={IMAGE_WIDTH_PX}
        style={{
          width: '100%',
          maxWidth: `${IMAGE_WIDTH_PX}px`,
          height: 'auto',
          display: 'block',
        }}
      />
    </Section>
  );
}
