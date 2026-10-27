import { DAILY_CREDITS, REFERRAL_BONUS, SIGNUP_CREDITS } from '@visual-ai/shared';

export const SITE_ORIGIN = 'https://visual-ai.app';
export const SITE_NAME = 'Visual AI';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

/** Signup + daily credits for marketing copy and FAQ JSON-LD sources. */
export function newAccountCreditsDefinition(): string {
  return `New accounts get ${SIGNUP_CREDITS} credits plus ${DAILY_CREDITS} daily credits.`;
}

export function freeTierSignupFaqAnswer(): string {
  return `Yes. You start with ${SIGNUP_CREDITS} credits and receive ${DAILY_CREDITS} more every day. Daily credits reset; purchased credits do not expire.`;
}

export function colorizeFreeTierFaqAnswer(): string {
  return `Yes, using your ${DAILY_CREDITS} daily credits (and the ${SIGNUP_CREDITS} credits you receive at signup). Each colorize run costs 2 credits.`;
}

export function referralGiveEarnCopy(): string {
  return `Give ${REFERRAL_BONUS} credits and earn ${REFERRAL_BONUS} credits for each new referral who signs up.`;
}

const ORGANIZATION_CREATOR = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_ORIGIN,
} as const;

export function canonicalUrl(path: string): string {
  if (!path || path === '/') {
    return SITE_ORIGIN;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: DEFAULT_OG_IMAGE,
  };
}

export function webApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description:
      'AI studio for text-to-image generation, upscaling, colorize, photo restore, and background removal.',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web Browser',
    creator: ORGANIZATION_CREATOR,
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtml(faq.answer),
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function itemListJsonLd(options: {
  name: string;
  description?: string;
  items: Array<{ name: string; path?: string; description?: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    itemListElement: options.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.description ? { description: item.description } : {}),
      ...(item.path ? { url: canonicalUrl(item.path) } : {}),
    })),
  };
}
