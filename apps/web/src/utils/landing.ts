import { FLUX_MODES } from "@/utils/constants";
import galleryData from "@/utils/gallery.json";

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
  media: { kind: "gallery"; images: string[] } | { kind: "compare"; before: string; after: string };
}

export interface Stat {
  value: string;
  label: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export const STATS: Stat[] = [
  { value: "500+", label: "Creators on board" },
  { value: "Thousands", label: "Images rendered" },
  { value: "5", label: "FLUX models" },
];

const galleryItems = galleryData as GalleryItem[];

/** A curated slice of real generated images for the showcase wall. */
export const SHOWCASE: GalleryItem[] = galleryItems.slice(0, 12);

export const TOOLS: ToolChapter[] = [
  {
    id: "generate",
    eyebrow: "Text to image",
    title: "Words in. Images out.",
    body: "Type a prompt and FLUX renders it — photoreal, painterly, or conceptual. Prompt adherence tight enough that your first try is usually your last.",
    points: [
      "FLUX Lightning through FLUX 1.1 Pro",
      "Seven aspect ratios — square to cinematic 21:9",
      "Up to four variations per prompt",
    ],
    ctaLabel: "Start generating",
    ctaTo: "/signup",
    media: {
      kind: "gallery",
      images: galleryItems.slice(0, 3).map((item) => item.url),
    },
  },
  {
    id: "upscale",
    eyebrow: "Upscale",
    title: "More pixels. No blur.",
    body: "Take a low-res image to 4K — edges rebuilt, texture recovered, the detail that bicubic scaling smears back where it belongs.",
    points: [
      "Output up to 4K resolution",
      "Preserves texture and clean edges",
      "Export as JPG, PNG, or WebP",
    ],
    ctaLabel: "Try the upscaler",
    ctaTo: "/signup",
    media: {
      kind: "compare",
      before: `${BASE_URL}/examples/upscale/upscale-1.jpg`,
      after: `${BASE_URL}/examples/upscale/upscale-1.1.png`,
    },
  },
  {
    id: "colorize",
    eyebrow: "Colorize",
    title: "Color that fits the era.",
    body: "Give monochrome photos natural, period-appropriate color — skin tones, fabric, and skies that look like they were always there.",
    points: [
      "Natural, era-appropriate tones",
      "Made for archival and family photos",
      "Basic and advanced modes",
    ],
    ctaLabel: "Colorize a photo",
    ctaTo: "/signup",
    media: {
      kind: "compare",
      before: `${BASE_URL}/examples/colorize/colorize-1.webp`,
      after: `${BASE_URL}/examples/colorize/colorize-1.1.png`,
    },
  },
  {
    id: "revive",
    eyebrow: "Restore",
    title: "Rescue the ones that matter.",
    body: "Scratches, fading, torn edges — the damage that makes old prints heartbreaking. Revive removes it and brings back what age took.",
    points: [
      "Removes scratches, creases, and noise",
      "Recovers faded faces and detail",
      "Built for irreplaceable originals",
    ],
    ctaLabel: "Revive a photo",
    ctaTo: "/signup",
    media: {
      kind: "compare",
      before: `${BASE_URL}/examples/revive/revive-1.png`,
      after: `${BASE_URL}/examples/revive/revive-1.1.png`,
    },
  },
];

/** Reused from the app's single source of truth so the model line never drifts. */
export const MODELS = FLUX_MODES;

export const FAQS: Faq[] = [
  {
    question: "Is there really a free plan?",
    answer:
      "Yes. Every account gets 20 credits a day, refreshed daily, with access to generation, upscaling, colorizing, and reviving — no card required to start.",
  },
  {
    question: "How do credits work?",
    answer:
      "Each generation or edit spends credits. Free accounts get 20 a day that reset every 24 hours; Pro accounts get 1,000 a month with unused credits rolling over up to a 2,000 cap.",
  },
  {
    question: "Which models can I use?",
    answer:
      "The full FLUX family — from FLUX Lightning for speed to FLUX 1.1 Pro and FLUX Realism for top-tier quality and prompt adherence.",
  },
  {
    question: "What formats can I download?",
    answer:
      "JPG on the free plan, with PNG and WebP added on Pro — alongside higher quality, more variations, and the full set of aspect ratios.",
  },
  {
    question: "Can I restore old or black-and-white photos?",
    answer:
      "Yes. Colorize adds believable color to monochrome images, and Revive repairs scratches, fading, and creases on damaged prints.",
  },
];

export const NAV_LINKS = [
  { label: "Tools", href: "#tools" },
  { label: "Showcase", href: "#showcase" },
  { label: "Models", href: "#models" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const HERO_IMAGE = `${ASSETS_URL}/hero.png`;
