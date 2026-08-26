import { MODELS as CATALOG_MODELS, getFeaturedModels } from '@/utils/models';
import galleryData from '@/utils/gallery.json';

const BASE_URL = import.meta.env.VITE_CLOUDINARY_BASE_URL;
const ASSETS_URL = import.meta.env.VITE_CLOUDINARY_ASSETS_URL;

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
  /** 'gallery' chapters render a generated-image cluster; 'compare' render a before/after slider. */
  media: { kind: 'gallery'; images: string[] } | { kind: 'compare'; before: string; after: string };
}

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
      before: `${BASE_URL}/examples/upscale/upscale-1.jpg`,
      after: `${BASE_URL}/examples/upscale/upscale-1.1.png`,
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
      before: `${BASE_URL}/examples/colorize/colorize-1.webp`,
      after: `${BASE_URL}/examples/colorize/colorize-1.1.png`,
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
      before: `${BASE_URL}/examples/revive/revive-1.png`,
      after: `${BASE_URL}/examples/revive/revive-1.1.png`,
    },
  },
  {
    id: 'remove-bg',
    eyebrow: 'Background',
    title: 'Subject in. Backdrop out.',
    body: 'Isolate a person or product for listings and composites. Download a transparent PNG without a desktop cutout tool.',
    points: [
      'Transparent PNG export',
      '2 credits per image',
      'Same studio as generate and restore',
    ],
    ctaLabel: 'Remove a background',
    ctaTo: '/remove-background',
    media: {
      kind: 'gallery',
      images: galleryItems.slice(3, 6).map((item) => item.url),
    },
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
    answer:
      'Yes. Every new account gets 50 persistent credits plus 30 daily credits (unused daily credits reset). Generate, upscale, colorize, restore, and remove backgrounds — no card and no subscription required to start.',
  },
  {
    question: 'How do credits work?',
    answer:
      'Each generation or edit spends credits. You get 50 persistent credits that stay on the account, plus 30 daily credits that reset unused at the end of the day. Purchased credits never expire.',
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
    answer: 'No. Visual AI is credits only — there are no paid subscription tiers.',
  },
];

export const NAV_LINKS = [
  { label: 'Tools', href: '#tools' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Models', href: '#models' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const HERO_IMAGE = `${ASSETS_URL}/hero.png`;
