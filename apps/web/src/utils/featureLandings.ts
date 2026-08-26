import { FeatureType } from '@/types';

export interface FeatureLandingFaq {
  question: string;
  answer: string;
}

export interface FeatureLandingCopy {
  path: string;
  feature: FeatureType;
  createPath: string;
  keyword: string;
  /** Short studio name for related-tool links. */
  navLabel: string;
  title: string;
  description: string;
  h1: string;
  /** 40–60 word extractable definition for people and AI crawlers. */
  definition: string;
  howHeading: string;
  steps: string[];
  ctaLabel: string;
  faqs: FeatureLandingFaq[];
}

export const FEATURE_LANDINGS: FeatureLandingCopy[] = [
  {
    path: '/text-to-image',
    feature: FeatureType.IMAGE,
    createPath: '/create',
    keyword: 'text to image',
    navLabel: 'Text to image',
    title: 'Text to Image Generator | Visual AI',
    description:
      'Turn a prompt into a studio-grade image on Visual AI. Free daily credits, no Discord, commercial use. Generate photoreal or illustrated stills in the browser.',
    h1: 'Text to image — in the browser',
    definition:
      'Visual AI is a text-to-image generator: you type a prompt, pick a model, and download a still. New accounts get 50 credits plus 30 daily credits. There is no Discord bot and no subscription tier — buy extra credit packs in INR when you need them.',
    howHeading: 'How to generate an image',
    steps: [
      'Open the generator and write a clear prompt (subject, lighting, style).',
      'Choose a model — faster drafts cost 1 credit; higher-fidelity models cost more.',
      'Pick an aspect ratio and generate. Download JPG, PNG, or WebP.',
    ],
    ctaLabel: 'Generate an image',
    faqs: [
      {
        question: 'Is Visual AI a free AI image generator?',
        answer:
          'Yes. You start with 50 credits and receive 30 more every day. Daily credits reset; purchased credits do not expire.',
      },
      {
        question: 'Which models can I use for text to image?',
        answer:
          'Several, from faster drafts to higher-fidelity generators. Pick one in the studio; image-to-image lives in the same workspace.',
      },
      {
        question: 'Can I use generated images commercially?',
        answer: 'Yes. You own the images you generate and may use them in commercial projects.',
      },
    ],
  },
  {
    path: '/image-upscaler',
    feature: FeatureType.UPSCALE,
    createPath: '/create/upscale',
    keyword: 'AI image upscaler',
    navLabel: 'Upscale',
    title: 'AI Image Upscaler to 4K | Visual AI',
    description:
      'Upscale photos to 4K with AI on Visual AI. Compare models, keep edges sharp, and pay in credits — not a monthly Pro plan. Start with free daily credits.',
    h1: 'AI image upscaler — sharper 4K without mush',
    definition:
      'Visual AI’s image upscaler rebuilds detail so a small photo can reach up to 4K. Utility upscalers cost 2 credits; Clarity Pro and Topaz cost 4. Compare outputs on /compare, then run the same models on your file.',
    howHeading: 'How to upscale an image',
    steps: [
      'Upload a JPG, PNG, or WebP on the upscaler.',
      'Pick a model. Start with a 2-credit upscaler; use premium models when you need extra texture.',
      'Download the result. Side-by-side model samples live on the compare page.',
    ],
    ctaLabel: 'Open the upscaler',
    faqs: [
      {
        question: 'Does the AI upscaler go to 4K?',
        answer:
          'Yes. Output can reach 4K depending on the source and model. Texture and edges are reconstructed rather than simply stretched.',
      },
      {
        question: 'How many credits does upscaling cost?',
        answer:
          'Standard upscalers are 2 credits. Premium upscalers (Clarity Pro, Topaz) are 4 credits. Daily and purchased credits both apply.',
      },
      {
        question: 'Where can I compare upscale models?',
        answer:
          'Use /compare for before/after sliders per model, then open /create/upscale to run your own file.',
      },
    ],
  },
  {
    path: '/colorize-photo',
    feature: FeatureType.COLORIZE,
    createPath: '/create/colorize',
    keyword: 'colorize black and white photo',
    navLabel: 'Colorize',
    title: 'Colorize Black and White Photos | Visual AI',
    description:
      'Colorize a black and white photo with AI. Visual AI adds period-appropriate color to family and archival scans. 2 credits per run, free daily credits to start.',
    h1: 'Colorize black and white photos with AI',
    definition:
      'Upload a monochrome scan and Visual AI predicts natural color — skin, fabric, sky — without a desktop plugin. Colorize costs 2 credits per image. It is built for family archives, not for inventing a new scene; keep the original file as your master.',
    howHeading: 'How do I colorize an old photo?',
    steps: [
      'Scan or photograph the print so the subject is sharp and well lit.',
      'Open Colorize, upload the file, and choose basic or advanced.',
      'Review tones, then download. Restore scratches first on Photo restorer if the print is damaged.',
    ],
    ctaLabel: 'Colorize a photo',
    faqs: [
      {
        question: 'How do I colorize an old photo?',
        answer:
          'Open /create/colorize, upload a black-and-white scan, run colorize (2 credits), and download PNG, JPG, or WebP. For torn prints, restore first, then colorize.',
      },
      {
        question: 'Will the colors look historically accurate?',
        answer:
          'The model aims for natural, era-appropriate tones. Always keep the original scan; treat color as an interpretation, not a forensic record.',
      },
      {
        question: 'Can I colorize for free?',
        answer:
          'Yes, using your 30 daily credits (and the 50 credits you receive at signup). Each colorize run costs 2 credits.',
      },
    ],
  },
  {
    path: '/photo-restorer',
    feature: FeatureType.REVIVE,
    createPath: '/create/revive',
    keyword: 'restore old photos',
    navLabel: 'Restore',
    title: 'Restore Old Photos with AI | Visual AI',
    description:
      'Restore old photos with AI: repair scratches, fading, and creases. Visual AI Revive is 2 credits per image, with free daily credits and optional colorize after repair.',
    h1: 'Restore old photos — scratches, fade, and tears',
    definition:
      'Revive is Visual AI’s photo restorer. It reduces scratches, creases, and age noise so faces and handwriting are readable again. A restore costs 2 credits. Pair it with Colorize when the print is black and white. Files stay in your account; we do not claim ownership of your family photos.',
    howHeading: 'How to restore a damaged print',
    steps: [
      'Photograph the print flat, with even light and no glare.',
      'Upload to Revive and run a restore (2 credits).',
      'If the original is monochrome, send the result to Colorize next.',
    ],
    ctaLabel: 'Restore a photo',
    faqs: [
      {
        question: 'Can AI restore a torn or faded family photo?',
        answer:
          'Revive targets scratches, creases, noise, and fade. Severe missing pieces may still need a human retoucher. Start with a well-lit scan of the original.',
      },
      {
        question: 'Should I colorize before or after restore?',
        answer:
          'Restore first so the colorizer sees a cleaner structure, then colorize if the print is black and white.',
      },
      {
        question: 'How much does photo restore cost?',
        answer:
          '2 credits per run. Use daily credits or bought packs. Credits you purchase do not expire.',
      },
    ],
  },
  {
    path: '/remove-background',
    feature: FeatureType.REMOVE_BG,
    createPath: '/create/remove_bg',
    keyword: 'AI background remover',
    navLabel: 'Remove background',
    title: 'AI Background Remover | Visual AI',
    description:
      'Remove image backgrounds with AI in the browser. Visual AI isolates the subject for listings and composites. 2 credits per image, free daily credits, PNG download.',
    h1: 'AI background remover for product and portraits',
    definition:
      'Visual AI’s background remover isolates the subject so you can drop it on a new backdrop or keep a transparent PNG. Each run costs 2 credits. It is a photo tool in the same studio as generate, upscale, colorize, and restore — not a separate desktop app.',
    howHeading: 'How to remove a background',
    steps: [
      'Upload a photo with a clear subject.',
      'Run Remove background (2 credits).',
      'Download a transparent PNG, or composite in your editor.',
    ],
    ctaLabel: 'Remove a background',
    faqs: [
      {
        question: 'Does the background remover export transparent PNG?',
        answer:
          'Yes. Download PNG when you need an alpha channel for shops, slides, or further editing.',
      },
      {
        question: 'How many credits does background removal cost?',
        answer: '2 credits per image. Daily credits and purchased credits both work.',
      },
      {
        question: 'Does it work on product shots and portraits?',
        answer:
          'Yes. It isolates a clear subject — a person, product, or object — so you can keep a transparent PNG or place it on a new backdrop.',
      },
    ],
  },
];

export function featureLandingByPath(path: string): FeatureLandingCopy | undefined {
  return FEATURE_LANDINGS.find((item) => item.path === path);
}

export function otherFeatureLandings(path: string): FeatureLandingCopy[] {
  return FEATURE_LANDINGS.filter((item) => item.path !== path);
}
