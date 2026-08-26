import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { useHead, useSeoMeta } from '@unhead/vue';

import { canonicalUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/utils/seo';

export type PageSeoJsonLd = Record<string, unknown> | Record<string, unknown>[];

export interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  image?: string;
  robots?: string;
  jsonLd?: PageSeoJsonLd;
}

export function usePageSeo(options: MaybeRefOrGetter<PageSeoOptions>) {
  const resolved = computed(() => toValue(options));

  useSeoMeta({
    title: () => resolved.value.title,
    description: () => resolved.value.description,
    ogTitle: () => resolved.value.title,
    ogDescription: () => resolved.value.description,
    ogType: 'website',
    ogUrl: () => canonicalUrl(resolved.value.path),
    ogImage: () => resolved.value.image ?? DEFAULT_OG_IMAGE,
    ogSiteName: SITE_NAME,
    twitterCard: 'summary_large_image',
    twitterTitle: () => resolved.value.title,
    twitterDescription: () => resolved.value.description,
    twitterImage: DEFAULT_OG_IMAGE,
    robots: () => resolved.value.robots ?? 'index,follow',
  });

  useHead({
    link: () => [{ rel: 'canonical', href: canonicalUrl(resolved.value.path) }],
    script: () =>
      resolved.value.jsonLd
        ? [
            {
              type: 'application/ld+json',
              innerHTML: JSON.stringify(resolved.value.jsonLd),
            },
          ]
        : [],
  });
}
