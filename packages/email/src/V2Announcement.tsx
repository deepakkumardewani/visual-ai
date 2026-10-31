import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { DAILY_CREDITS } from '@visual-ai/shared';

import { Highlight, type HighlightProps } from './components/Highlight.js';
import {
  BRAND_NAME,
  COLORS,
  EMAIL_IMAGE_BASE_URL,
  FALLBACK_NAME,
  FONT_STACK,
  SITE_URL,
  withUtm,
} from './constants.js';

export interface V2AnnouncementData {
  firstName?: string;
  unsubscribeUrl: string;
  postalAddress: string;
}

const MAX_WIDTH_PX = 600;
const LOGO_SIZE_PX = 48;
const HERO_WIDTH_PX = 600;
const PREHEADER = `Visual AI V2 is here: new models, styles, sizes and voice prompts. ${DAILY_CREDITS} free credits every day.`;

const HIGHLIGHTS: readonly HighlightProps[] = [
  {
    image: 'models.png',
    alt: 'Model picker listing the new image models',
    title: 'New models',
    description: 'More image models to pick from, each tuned for a different look.',
  },
  {
    image: 'styles.png',
    alt: 'Style picker with thumbnails of each style',
    title: 'Style picker',
    description: 'Apply a style in one click and see it on a thumbnail first.',
  },
  {
    image: 'sizes.png',
    alt: 'Aspect ratio options in the sidebar',
    title: 'More sizes',
    description: 'Choose from more aspect ratios for posts, wallpapers and prints.',
  },
  {
    image: 'voice.png',
    alt: 'Microphone button recording a spoken prompt',
    title: 'Voice dictation',
    description: 'Tap the mic and say your prompt instead of typing it.',
  },
];

const BENEFITS: readonly string[] = [
  `${DAILY_CREDITS} free credits every day`,
  'A cleaner studio with Create, Explore and Assets in one place',
  'Credits you buy never expire',
];

const SECONDARY_LINKS: readonly { label: string; href: string }[] = [
  { label: 'Pricing', href: withUtm('/pricing') },
  { label: 'Explore', href: withUtm('/explore') },
  { label: 'Support', href: withUtm('/contact') },
];

const bodyStyle = {
  backgroundColor: COLORS.background,
  fontFamily: FONT_STACK,
  margin: 0,
  padding: '24px 0',
};
const containerStyle = {
  maxWidth: `${MAX_WIDTH_PX}px`,
  width: '100%',
  backgroundColor: COLORS.card,
  padding: '24px',
};
const headlineStyle = {
  fontSize: '28px',
  lineHeight: '34px',
  fontWeight: 800,
  color: COLORS.text,
  margin: '16px 0 8px',
};
const mutedStyle = { fontSize: '15px', lineHeight: '22px', color: COLORS.muted, margin: '0 0 8px' };
const buttonStyle = {
  backgroundColor: COLORS.accent,
  color: COLORS.buttonText,
  fontSize: '16px',
  fontWeight: 700,
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function V2Announcement({ firstName, unsubscribeUrl, postalAddress }: V2AnnouncementData) {
  const name = firstName?.trim() || FALLBACK_NAME;

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
          <Img
            src={`${EMAIL_IMAGE_BASE_URL}/logo.png`}
            alt={BRAND_NAME}
            width={LOGO_SIZE_PX}
            height={LOGO_SIZE_PX}
          />
          <Text style={headlineStyle}>Visual AI V2 is here</Text>
          <Text style={mutedStyle}>
            Hi {name}, we rebuilt the studio around how you actually create.
          </Text>
          <Img
            src={`${EMAIL_IMAGE_BASE_URL}/hero.png`}
            alt="The redesigned Visual AI dashboard"
            width={HERO_WIDTH_PX}
            style={{
              width: '100%',
              maxWidth: `${HERO_WIDTH_PX}px`,
              height: 'auto',
              borderRadius: '8px',
              display: 'block',
            }}
          />
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={withUtm('/create/image')} style={buttonStyle}>
              Try V2 now
            </Button>
          </Section>
          {HIGHLIGHTS.map((highlight) => (
            <Highlight key={highlight.image} {...highlight} />
          ))}
          <Section>
            {BENEFITS.map((benefit) => (
              <Text key={benefit} style={{ ...mutedStyle, color: COLORS.text }}>
                {`✓ ${benefit}`}
              </Text>
            ))}
          </Section>
          <Section style={{ textAlign: 'center', margin: '16px 0' }}>
            {SECONDARY_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                style={{ color: COLORS.accent, fontSize: '15px', margin: '0 10px' }}
              >
                {label}
              </Link>
            ))}
          </Section>
          <Hr style={{ borderColor: COLORS.border }} />
          <Text style={{ ...mutedStyle, fontSize: '12px', lineHeight: '18px' }}>
            You get this because you have a {BRAND_NAME} account at {SITE_URL}. {postalAddress}
          </Text>
          <Text style={{ ...mutedStyle, fontSize: '12px' }}>
            <Link href={unsubscribeUrl} style={{ color: COLORS.muted }}>
              Unsubscribe
            </Link>
          </Text>
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
