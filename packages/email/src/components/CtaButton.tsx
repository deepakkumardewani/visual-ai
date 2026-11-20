import { Button, Section } from '@react-email/components';

import { COLORS, FONT_SIZE, RADIUS_PX } from '../constants.js';

interface CtaButtonProps {
  href: string;
  children: string;
}

const buttonStyle = {
  backgroundColor: COLORS.accent,
  color: COLORS.buttonText,
  fontSize: `${FONT_SIZE.body}px`,
  fontWeight: 700,
  // 16px vertical padding + 24px line keeps the tap target above 48px.
  padding: '16px 32px',
  lineHeight: '24px',
  borderRadius: `${RADIUS_PX / 2}px`,
  textDecoration: 'none',
  display: 'inline-block',
} as const;

export function CtaButton({ href, children }: CtaButtonProps) {
  return (
    <Section style={{ textAlign: 'center' }}>
      <Button href={href} style={buttonStyle}>
        {children}
      </Button>
    </Section>
  );
}
