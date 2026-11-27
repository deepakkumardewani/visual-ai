import { Body, Container, Head, Html, Preview, Section } from '@react-email/components';
import type { ReactNode } from 'react';

import {
  COLORS,
  EMAIL_PADDING_X_PX,
  EMAIL_WIDTH_PX,
  FONT_STACK,
  RADIUS_PX,
  SPACE,
} from '../constants.js';

interface EmailShellProps {
  title: string;
  preview: string;
  children: ReactNode;
}

const bodyStyle = {
  backgroundColor: COLORS.background,
  fontFamily: FONT_STACK,
  margin: 0,
  padding: `${SPACE.md}px 0`,
};
const containerStyle = {
  maxWidth: `${EMAIL_WIDTH_PX}px`,
  width: '100%',
  backgroundColor: COLORS.card,
  borderRadius: `${RADIUS_PX}px`,
  overflow: 'hidden',
};
const contentStyle = { padding: `${SPACE.lg}px ${EMAIL_PADDING_X_PX}px` };

/** Plain internal-email frame (no marketing hero or unsubscribe footer): head, preheader and card. */
export function EmailShell({ title, preview, children }: EmailShellProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <title>{title}</title>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={contentStyle}>{children}</Section>
        </Container>
      </Body>
    </Html>
  );
}
