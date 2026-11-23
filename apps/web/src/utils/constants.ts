import {
  faEnvelope,
  faFileContract,
  faHandHolding,
  faImages,
  faQuestionCircle,
  faShieldAlt,
  faTag,
} from '@/plugins/icons';

import { type FeatureSelect, FeatureType } from '@/types';

import generalFAQ from './generalFAQ.json';
import pricingFAQ from './pricingFAQ.json';

export { MODEL_IDS } from '@visual-ai/shared';

/** Speech (media studio) FAQs, SPEC section 9. Plain text: the FAQ renderer does not parse markdown. */
export const MEDIA_FAQS = [
  {
    question: 'Which speech model should I pick?',
    answer:
      'For the most expressive, steerable delivery pick Inworld TTS 2 (write directions in brackets like [whisper in a hushed style]). For solid quality with fixed emotion tags at a lower price pick Inworld TTS 1.5 Max. For long scripts (up to 10,000 characters), many languages, voice cloning and fine control of speed, pitch and volume pick Minimax Speech 2.8 HD (best fidelity) or 2.8 Turbo (faster, cheaper). For short clips and quick drafts pick Chatterbox Turbo (up to 500 characters, lowest cost).',
  },
  {
    question: 'How do tags like laugh or sigh work?',
    answer:
      'Type / in the editor and choose a tag. Each model uses its own syntax, we write it correctly for you. Only tags the selected model supports are shown.',
  },
  {
    question: 'What happens to my tags when I switch models?',
    answer:
      'Your text is never lost. Tags the new model cannot perform are highlighted so you can convert, edit or remove them. Unsupported tags are left out of the generated audio.',
  },
  {
    question: 'Why is my text limit different per model?',
    answer:
      'Limits come from the model: 2,000 characters for Inworld, 10,000 for Minimax, 500 for Chatterbox. Tags count toward the limit.',
  },
  {
    question: 'How much does speech cost?',
    answer:
      'You see the exact credits before you press Generate, based on the character count. Failed generations do not use credits.',
  },
  {
    question: 'Which languages are supported?',
    answer:
      'Inworld: 15 production languages (English, Chinese, Japanese, Korean, Russian, Italian, Spanish, Portuguese, French, German, Polish, Dutch, Hindi, Hebrew, Arabic), Inworld 2 also has experimental support for 90+ more. Minimax Speech 2.8 HD: 32+ languages; 2.8 Turbo: 40+ languages; both accept a language hint. Chatterbox: best in English.',
  },
  {
    question: 'How do I add pauses?',
    answer:
      'Use the Pause tag in the / menu (Inworld 1.5 Max and Minimax). For Inworld 2 use a direction such as [say with deliberate pauses].',
  },
  {
    question: 'Can I clone my voice?',
    answer:
      'Yes, on Minimax 2.8 models. Upload 10 seconds to 5 minutes of clean audio (MP3, M4A or WAV, under 20 MB) and confirm you own the voice or have the right to use it. Cloning costs credits once.',
  },
  {
    question: "Is it OK to clone someone else's voice?",
    answer:
      'Only with their permission. You must confirm this before cloning, and we keep a record of the confirmation.',
  },
  {
    question: 'Can I use the audio commercially?',
    answer:
      "Most of these models allow commercial use, but each has its own license. Check the model's license and our Terms before publishing.",
  },
  {
    question: 'Why does the generated speech sound different each time?',
    answer:
      'Models sample randomly; lower the temperature or set a seed (where available) for repeatable results.',
  },
  {
    question: 'Can I edit the audio after generating?',
    answer:
      'Yes: trim, fade, change volume and speed, loop, and export MP3 or WAV right on the result.',
  },
  {
    question: 'Is speech generation real-time streaming?',
    answer: 'No. Generation takes a few seconds and the finished file is saved to History.',
  },
];

// Pricing FAQs
export const PRICING_FAQS = [...pricingFAQ, ...MEDIA_FAQS];

export const GENERAL_FAQS = [...generalFAQ, ...pricingFAQ, ...MEDIA_FAQS];

// Image Formats
export const IMAGE_FORMATS = [
  {
    title: 'JPG',
  },
  {
    title: 'PNG',
  },
  {
    title: 'WEBP',
  },
];

// export const IMAGE_VARIATIONS = [
//   {
//     title: '1',
//     value: 1,
//     isPro: false
//   },
//   {
//     title: '2',
//     value: 2,
//     isPro: true
//   },
//   {
//     title: '3',
//     value: 3,
//     isPro: true
//   },
//   {
//     title: '4',
//     value: 4,
//     isPro: true
//   }
// ]

export const IMAGE_SIZES = ['2X', '4X'];

export const IMAGE_SIZE_OPTIONS = [
  { value: 'mini', title: 'Mini' },
  { value: 'small', title: 'Small' },
  { value: 'medium', title: 'Medium' },
  { value: 'large', title: 'Large' },
];

export const SIZE_CLASSES = {
  mini: 'tw-grid-cols-3 sm:tw-grid-cols-4 md:tw-grid-cols-6 lg:tw-grid-cols-8',
  small: 'tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-5 lg:tw-grid-cols-6',
  medium: 'tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-grid-cols-5',
  large: 'tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4',
};

/** How many aspect ratios show in the sidebar primary row */
export const PRIMARY_ASPECT_COUNT = 4;

// Aspect Ratios — order defines primary-row preference (first N available per model)
export const ASPECT_RATIOS = [
  {
    title: '1:1',
    name: 'Square',
    icon: '$square',
    type: 'square',
  },
  {
    title: '2:3',
    name: 'Portrait',
    icon: '$portrait',
    type: 'vertical',
  },
  {
    title: '3:2',
    name: 'Standard',
    icon: '$standard',
    type: 'horizontal',
  },
  {
    title: '4:5',
    name: 'Social Post',
    icon: '$socialPost',
    type: 'vertical',
  },
  {
    title: '9:16',
    name: 'Social Story',
    icon: '$socialStory',
    type: 'vertical',
  },
  {
    title: '16:9',
    name: 'Widescreen',
    icon: '$widescreen',
    type: 'horizontal',
  },
  {
    title: '21:9',
    name: 'Cinematic',
    icon: '$cinematic',
    type: 'horizontal',
  },
  {
    title: '4:3',
    name: 'Classic',
    icon: '$standard',
    type: 'horizontal',
  },
  {
    title: '3:4',
    name: 'Classic Portrait',
    icon: '$portrait',
    type: 'vertical',
  },
  {
    title: '5:4',
    name: 'Soft Landscape',
    icon: '$standard',
    type: 'horizontal',
  },
  {
    title: '9:21',
    name: 'Tall Cinematic',
    icon: '$socialStory',
    type: 'vertical',
  },
  {
    title: '2:1',
    name: 'Ultra Wide',
    icon: '$cinematic',
    type: 'horizontal',
  },
  {
    title: '1:2',
    name: 'Tall',
    icon: '$portrait',
    type: 'vertical',
  },
  {
    title: '19.5:9',
    name: 'Phone Wide',
    icon: '$cinematic',
    type: 'horizontal',
  },
  {
    title: '9:19.5',
    name: 'Phone Tall',
    icon: '$socialStory',
    type: 'vertical',
  },
  {
    title: '20:9',
    name: 'Cinema Wide',
    icon: '$cinematic',
    type: 'horizontal',
  },
  {
    title: '9:20',
    name: 'Cinema Tall',
    icon: '$socialStory',
    type: 'vertical',
  },
  {
    title: '4:1',
    name: 'Banner Wide',
    icon: '$cinematic',
    type: 'horizontal',
  },
  {
    title: '1:4',
    name: 'Banner Tall',
    icon: '$portrait',
    type: 'vertical',
  },
  {
    title: '8:1',
    name: 'Strip Wide',
    icon: '$cinematic',
    type: 'horizontal',
  },
  {
    title: '1:8',
    name: 'Strip Tall',
    icon: '$portrait',
    type: 'vertical',
  },
  {
    title: 'auto',
    name: 'Auto',
    icon: '$square',
    type: 'square',
  },
];

export const FEATURES: FeatureSelect[] = [
  {
    id: FeatureType.IMAGE,
    name: 'image',
    title: 'AI Image Generator',
    icon: '$imageFrame',
  },
  {
    id: FeatureType.UPSCALE,
    name: 'upscaler',
    title: 'Image Upscaler',
    icon: '$expand',
  },
  {
    id: FeatureType.COLORIZE,
    name: 'colorizer',
    title: 'Colorize Image',
    icon: '$dropper',
  },
  {
    id: FeatureType.REVIVE,
    name: 'reviver',
    title: 'Revive Photos',
    icon: '$camera',
  },
  {
    id: FeatureType.REMOVE_BG,
    name: 'remove_bg',
    title: 'Remove Background',
    icon: '$layers',
  },
];

export const FOOTER_LINKS = [
  { text: 'Examples', path: '/examples', icon: faImages },
  { text: 'Contact Us', path: '/contact', icon: faEnvelope },
  { text: 'Privacy Policy', path: '/privacy', icon: faShieldAlt },
  { text: 'Terms of Service', path: '/terms', icon: faFileContract },
  { text: 'Refund Policy', path: '/refund', icon: faHandHolding },
  { text: 'Pricing', path: '/pricing', icon: faTag },
  { text: 'FAQ', path: '/faqs', icon: faQuestionCircle },
];
