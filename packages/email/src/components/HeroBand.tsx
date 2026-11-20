import { Column, Img, Row, Section, Text } from '@react-email/components';

import {
  BRAND_NAME,
  COLORS,
  EMAIL_IMAGE_BASE_URL,
  EMAIL_PADDING_X_PX,
  FONT_SIZE,
  LOGO_SIZE_PX,
  RADIUS_PX,
  SPACE,
} from '../constants.js';
import { DASHBOARD_FEATURE } from '../highlights.js';
import { CtaButton } from './CtaButton.js';
import { ScreenshotPanel } from './ScreenshotPanel.js';
import { eyebrowStyle } from './styles.js';

interface HeroBandProps {
  name: string;
  ctaHref: string;
}

const ACCENT_RULE_WIDTH_PX = 48;
const ACCENT_RULE_HEIGHT_PX = 3;
const GLOW = 'rgba(201, 138, 90, 0.28)';

// Solid backgroundColor is the Outlook fallback; the glow is progressive enhancement.
const bandStyle = {
  backgroundColor: COLORS.panel,
  backgroundImage: `radial-gradient(ellipse at 50% 0%, ${GLOW} 0%, ${COLORS.panel} 65%)`,
  borderRadius: `${RADIUS_PX}px ${RADIUS_PX}px 0 0`,
} as const;
// Padding lives on the cell: table padding is ignored by Outlook.
const bandCellStyle = {
  padding: `${SPACE.lg}px ${EMAIL_PADDING_X_PX}px ${SPACE.xl}px`,
} as const;
const pillStyle = {
  display: 'inline-block',
  border: `1px solid ${COLORS.accent}`,
  borderRadius: '999px',
  padding: '2px 10px',
  marginRight: `${SPACE.xs}px`,
  color: COLORS.accent,
} as const;
const headlineStyle = {
  fontSize: `${FONT_SIZE.hero}px`,
  lineHeight: '44px',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  // Avoids a lone word on the last line where supported; harmless elsewhere.
  textWrap: 'balance',
  color: COLORS.onDark,
  margin: `${SPACE.sm}px 0 ${SPACE.sm}px`,
} as const;
const ruleStyle = {
  width: `${ACCENT_RULE_WIDTH_PX}px`,
  height: `${ACCENT_RULE_HEIGHT_PX}px`,
  backgroundColor: COLORS.accent,
  lineHeight: `${ACCENT_RULE_HEIGHT_PX}px`,
  fontSize: '1px',
  marginBottom: `${SPACE.md}px`,
} as const;
const introStyle = {
  fontSize: `${FONT_SIZE.body}px`,
  lineHeight: '26px',
  color: COLORS.onDarkMuted,
  margin: `0 0 ${SPACE.lg}px`,
} as const;
const captionTitleStyle = {
  fontSize: `${FONT_SIZE.title}px`,
  lineHeight: '26px',
  fontWeight: 700,
  color: COLORS.onDark,
  margin: `${SPACE.sm}px 0 ${SPACE.xxs}px`,
} as const;
const captionBodyStyle = {
  ...introStyle,
  margin: `0 0 ${SPACE.md}px`,
} as const;

/** Dark launch band: brand, "V2" badge, display headline, intro and the new dashboard. */
export function HeroBand({ name, ctaHref }: HeroBandProps) {
  return (
    <Section style={bandStyle} bgcolor={COLORS.panel}>
      <Row>
        <Column style={bandCellStyle}>
          <Img
            src={`${EMAIL_IMAGE_BASE_URL}/logo.png`}
            alt={BRAND_NAME}
            width={LOGO_SIZE_PX}
            height={LOGO_SIZE_PX}
          />
          <Text
            style={{
              ...eyebrowStyle,
              color: COLORS.accent,
              margin: `${SPACE.lg}px 0 0`,
            }}
          >
            <span style={pillStyle}>V2</span>
            What&apos;s new
          </Text>
          <Text style={headlineStyle}>{`${BRAND_NAME} V2 is here`}</Text>
          <div style={ruleStyle}>&nbsp;</div>
          <Text style={introStyle}>
            Hi {name}, thanks for creating with us. V2 brings Create, Explore and Assets under one
            roof, adds more models and a style picker you can preview, and lets you speak your
            prompt. Your daily free credits just went up too.
          </Text>
          <ScreenshotPanel image={DASHBOARD_FEATURE.image} alt={DASHBOARD_FEATURE.alt} />
          <Text style={captionTitleStyle}>{DASHBOARD_FEATURE.title}</Text>
          <Text style={captionBodyStyle}>{DASHBOARD_FEATURE.description}</Text>
          <CtaButton href={ctaHref}>Try V2 now</CtaButton>
        </Column>
      </Row>
    </Section>
  );
}
