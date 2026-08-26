export const SITE_ORIGIN = 'https://visual-ai.app';
export const SITE_NAME = 'Visual AI';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

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
