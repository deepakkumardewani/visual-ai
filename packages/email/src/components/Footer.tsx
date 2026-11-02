import { Hr, Link, Text } from '@react-email/components';

import { BRAND_NAME, COLORS, FONT_SIZE, SPACE } from '../constants.js';

interface FooterProps {
  postalAddress: string;
  unsubscribeUrl: string;
}

const footerTextStyle = {
  fontSize: `${FONT_SIZE.small}px`,
  lineHeight: '18px',
  color: COLORS.muted,
  textAlign: 'center',
  margin: `0 0 ${SPACE.xxs}px`,
} as const;

// Legally required, so it stays readable (11px, 4.5:1) but visually recedes.
const addressStyle = {
  ...footerTextStyle,
  fontSize: `${FONT_SIZE.fine}px`,
  color: COLORS.subtle,
  margin: `${SPACE.sm}px 0 0`,
} as const;

export function Footer({ postalAddress, unsubscribeUrl }: FooterProps) {
  return (
    <>
      <Hr
        style={{
          borderColor: COLORS.border,
          margin: `${SPACE.lg}px 0 ${SPACE.md}px`,
        }}
      />
      <Text style={footerTextStyle}>
        {`You're receiving this because you have a ${BRAND_NAME} account.`}
      </Text>
      <Text style={footerTextStyle}>
        <Link href={unsubscribeUrl} style={{ color: COLORS.muted, textDecoration: 'underline' }}>
          Unsubscribe
        </Link>
      </Text>
      <Text style={addressStyle}>{postalAddress}</Text>
    </>
  );
}
