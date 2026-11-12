import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { DAILY_CREDITS } from '@visual-ai/shared';

import { CreditsCallout } from './components/CreditsCallout.js';
import { CtaButton } from './components/CtaButton.js';
import { Footer } from './components/Footer.js';
import { Highlight } from './components/Highlight.js';
import { HeroBand } from './components/HeroBand.js';
import {
  BRAND_NAME,
  COLORS,
  EMAIL_PADDING_X_PX,
  EMAIL_WIDTH_PX,
  FALLBACK_NAME,
  FONT_SIZE,
  FONT_STACK,
  PREVIOUS_DAILY_CREDITS,
  RADIUS_PX,
  SPACE,
  withUtm,
} from './constants.js';
import { HIGHLIGHTS } from './highlights.js';

export interface V2AnnouncementData {
  firstName?: string;
  unsubscribeUrl: string;
  postalAddress: string;
}

const PREHEADER = `A rebuilt studio, more models and styles, and voice prompts. Daily free credits go from ${PREVIOUS_DAILY_CREDITS} to ${DAILY_CREDITS.free}.`;
const CTA_PATH = '/create/image';

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
const contentStyle = {
  padding: `${SPACE.xl}px ${EMAIL_PADDING_X_PX}px ${SPACE.lg}px`,
};
const closingHeadingStyle = {
  fontSize: `${FONT_SIZE.title + 4}px`,
  lineHeight: '32px',
  fontWeight: 800,
  color: COLORS.text,
  textAlign: 'center',
  margin: `0 0 ${SPACE.sm}px`,
} as const;
const closingTextStyle = {
  fontSize: `${FONT_SIZE.body}px`,
  lineHeight: '26px',
  color: COLORS.muted,
  textAlign: 'center',
  margin: `${SPACE.sm}px 0 0`,
} as const;

export function V2Announcement({ firstName, unsubscribeUrl, postalAddress }: V2AnnouncementData) {
  const name = firstName?.trim() || FALLBACK_NAME;
  const ctaHref = withUtm(CTA_PATH);

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <title>{`${BRAND_NAME} V2 is here`}</title>
      </Head>
      <Preview>{PREHEADER}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <HeroBand name={name} ctaHref={ctaHref} />
          <Section>
            <Row>
              <Column style={contentStyle}>
                <CreditsCallout />
                {HIGHLIGHTS.map((highlight, index) => (
                  <Highlight
                    key={highlight.title}
                    {...highlight}
                    eyebrow={String(index + 1).padStart(2, '0')}
                  />
                ))}
                <Text style={closingHeadingStyle}>Ready to try it?</Text>
                <CtaButton href={ctaHref}>Open the studio</CtaButton>
                <Text
                  style={closingTextStyle}
                >{`${DAILY_CREDITS.free} free credits every day.`}</Text>
                <Footer postalAddress={postalAddress} unsubscribeUrl={unsubscribeUrl} />
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

V2Announcement.PreviewProps = {
  firstName: 'Alex',
  unsubscribeUrl: 'https://api.visual-ai.app/email/unsubscribe?token=preview',
  postalAddress: 'Preview Street 1, Example City',
} satisfies V2AnnouncementData;

export default V2Announcement;
