import { DAILY_CREDITS, SIGNUP_CREDITS } from '@visual-ai/shared';

import { MODELS as CATALOG_MODELS, getFeaturedModels } from '@/utils/models';
import { transformCreditsLabel } from '@/utils/creditCopy';
import galleryData from '@/utils/gallery.json';

/** Single source for the free-credits promise so the hero and final CTA cannot drift. */
export const FREE_CREDITS_COPY = `${SIGNUP_CREDITS} free credits to keep, plus ${DAILY_CREDITS.free} more each day that reset daily. No card needed.`;

export interface GalleryItem {
  url: string;
  aspectRatio: string;
  prompt: string;
}

export interface ToolChapter {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  ctaLabel: string;
  ctaTo: string;
  /**
   * 'gallery' chapters render a generated-image cluster, 'compare' a before/after slider,
   * 'cutout' a set of transparent cutouts paired with their originals.
   */
  media: ToolMedia;
}

/**
 * How a cutout is framed inside its card. Small subjects (a product on a wide
 * frame) are scaled up around their own centre so they read at card size.
 */
export interface CutoutFraming {
  /** 1 leaves the frame as is; above 1 zooms in on the subject. */
  zoom: number;
  /** Subject centre in percent of the frame; the card recentres on it. */
  focusX: number;
  focusY: number;
}

export interface CutoutPair {
  /** The source photo, shown as a small inset. */
  original: string;
  /** Transparent webp of the subject alone. */
  cutout: string;
  /** Describes the subject; the component adds "background removed" / "original photo". */
  alt: string;
  framing: CutoutFraming;
}

export type ToolMedia =
  | { kind: 'gallery'; images: string[] }
  | { kind: 'compare'; before: string; after: string }
  | { kind: 'cutout'; pairs: CutoutPair[] };

export interface Stat {
  value: string;
  label: string;
}

export interface Faq {
  question: string;
  answer: string;
}

const STILL_IMAGE_MODEL_COUNT = CATALOG_MODELS.filter(
  (model) => !model.id.startsWith('UPSCALE_'),
).length;

export function getLandingStats(): Stat[] {
  return [
    { value: '500+', label: 'Creators on board' },
    { value: 'Thousands', label: 'Images rendered' },
    { value: String(STILL_IMAGE_MODEL_COUNT), label: 'Still-image models' },
  ];
}

export const STATS: Stat[] = getLandingStats();

const galleryItems = galleryData as GalleryItem[];

const CUTOUT_FULL_FRAME: CutoutFraming = { zoom: 1, focusX: 50, focusY: 50 };

/** Measured from the cutout's alpha: the sneakers span ~68% of the frame, centred at 52% / 63%. */
const CUTOUT_SNEAKERS_FRAMING: CutoutFraming = { zoom: 1.4, focusX: 52, focusY: 56 };

const REMOVE_BG_PAIRS: CutoutPair[] = [
  {
    original: '/landing/remove-bg-person.360ed339.webp',
    cutout: '/landing/remove-bg-person-cutout.eff56965.webp',
    alt: 'Woman in a mustard wool coat',
    framing: CUTOUT_FULL_FRAME,
  },
  {
    original: '/landing/remove-bg-product.54a6f505.webp',
    cutout: '/landing/remove-bg-product-cutout.9943c670.webp',
    alt: 'Pair of white leather sneakers',
    framing: CUTOUT_SNEAKERS_FRAMING,
  },
  {
    original: '/landing/remove-bg-pet.1b314262.webp',
    cutout: '/landing/remove-bg-pet-cutout.bd1d723c.webp',
    alt: 'Golden retriever sitting',
    framing: CUTOUT_FULL_FRAME,
  },
];

/** A curated slice of real generated images for the showcase wall. */
export const SHOWCASE: GalleryItem[] = galleryItems.slice(0, 12);

export const TOOLS: ToolChapter[] = [
  {
    id: 'generate',
    eyebrow: 'Text to image',
    title: 'Words in. Images out.',
    body: 'Type a prompt and pick a model for drafts or fidelity — Google, OpenAI, xAI, ByteDance, and Black Forest Labs. Prompt adherence tight enough that your first try is usually your last.',
    points: [
      'Fast drafts through studio-quality models, across labs',
      'Seven aspect ratios — square to cinematic 21:9',
      'Up to four variations per prompt',
    ],
    ctaLabel: 'Start generating',
    ctaTo: '/text-to-image',
    media: {
      kind: 'gallery',
      images: galleryItems.slice(0, 3).map((item) => item.url),
    },
  },
  {
    id: 'upscale',
    eyebrow: 'Upscale',
    title: 'More pixels. No blur.',
    body: 'Take a low-res image to 4K — edges rebuilt, texture recovered, the detail that bicubic scaling smears back where it belongs.',
    points: [
      'Output up to 4K resolution',
      'Preserves texture and clean edges',
      'Export as JPG, PNG, or WebP',
    ],
    ctaLabel: 'Try the upscaler',
    ctaTo: '/image-upscaler',
    media: {
      kind: 'compare',
      before: '/landing/upscale-1.769d2c02.webp',
      after: '/landing/upscale-1.1.d76f06d3.webp',
    },
  },
  {
    id: 'colorize',
    eyebrow: 'Colorize',
    title: 'Color that fits the era.',
    body: 'Give monochrome photos natural, period-appropriate color — skin tones, fabric, and skies that look like they were always there.',
    points: [
      'Natural, era-appropriate tones',
      'Made for archival and family photos',
      'Basic and advanced modes',
    ],
    ctaLabel: 'Colorize a photo',
    ctaTo: '/colorize-photo',
    media: {
      kind: 'compare',
      before: '/landing/colorize-1.144e6229.webp',
      after: '/landing/colorize-1.1.382dd645.webp',
    },
  },
  {
    id: 'revive',
    eyebrow: 'Restore',
    title: 'Rescue the ones that matter.',
    body: 'Scratches, fading, torn edges — the damage that makes old prints heartbreaking. Revive removes it and brings back what age took.',
    points: [
      'Removes scratches, creases, and noise',
      'Recovers faded faces and detail',
      'Built for irreplaceable originals',
    ],
    ctaLabel: 'Revive a photo',
    ctaTo: '/photo-restorer',
    media: {
      kind: 'compare',
      before: '/landing/revive-1.001ae842.webp',
      after: '/landing/revive-1.1.fe6b12b1.webp',
    },
  },
  {
    id: 'remove-bg',
    eyebrow: 'Background',
    title: 'Subject in. Backdrop out.',
    body: 'Isolate a person or product for listings and composites. Download a transparent PNG without a desktop cutout tool.',
    points: [
      'Transparent PNG export',
      `${transformCreditsLabel('remove_bg')} per image`,
      'Same studio as generate and restore',
    ],
    ctaLabel: 'Remove a background',
    ctaTo: '/remove-background',
    media: { kind: 'cutout', pairs: REMOVE_BG_PAIRS },
  },
];

export function toolBySeoPath(path: string): ToolChapter | undefined {
  return TOOLS.find((tool) => tool.ctaTo === path);
}

/** Featured still-image models for marketing — not the full catalog. */
export const MODELS = getFeaturedModels();
export { getFeaturedModels };

export const FAQS: Faq[] = [
  {
    question: 'Is there really a free plan?',
    answer: `Yes. Every new account gets ${SIGNUP_CREDITS} persistent credits plus ${DAILY_CREDITS.free} daily credits (unused daily credits reset). Generate, upscale, colorize, restore, and remove backgrounds — no card and no subscription required to start.`,
  },
  {
    question: 'How do credits work?',
    answer: `Each generation or edit spends credits. You get ${SIGNUP_CREDITS} persistent credits that stay on the account, plus ${DAILY_CREDITS.free} daily credits that reset unused at the end of the day. Purchased credits never expire.`,
  },
  {
    question: 'Which models can I use?',
    answer:
      'Still-image models from Google, OpenAI, xAI, ByteDance, and Black Forest Labs, plus upscalers and utilities like colorize, restore, and background removal. See per-model costs on /pricing#model-costs.',
  },
  {
    question: 'What formats can I download?',
    answer:
      'All accounts can download in JPG, PNG, and WebP. Choose the format that works best for your needs.',
  },
  {
    question: 'Can I restore old or black-and-white photos?',
    answer:
      'Yes. Colorize adds believable color to monochrome images, and Revive repairs scratches, fading, and creases on damaged prints.',
  },
  {
    question: 'Do I need a subscription?',
    answer:
      'No. You can use Visual AI on the free tier, add an optional Pro monthly subscription, or buy one-off credit packs whose credits never expire.',
  },
];

export const NAV_LINKS = [
  { label: 'Tools', href: '#tools' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Models', href: '#models' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const HERO_IMAGE = '/landing/hero.0053f405.webp';
