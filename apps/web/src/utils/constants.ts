import {
  faEnvelope,
  faFileContract,
  faHandHolding,
  faImages,
  faQuestionCircle,
  faShieldAlt,
  faTag,
} from '@/plugins/icons';

import { type FeatureSelect, FeatureType, type RazorpayProduct } from '@/types';

import generalFAQ from './generalFAQ.json';
import pricingFAQ from './pricingFAQ.json';

export { MODEL_IDS } from '@visual-ai/shared';

// Pricing FAQs
export const PRICING_FAQS = pricingFAQ;

export const GENERAL_FAQS = [...generalFAQ, ...pricingFAQ];

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
export const RAZORPAY_PRODUCTS: RazorpayProduct[] = [
  { id: 1, type: 'single', credits: 120, price: 99, description: '120 credits', currency: 'INR' },
  {
    id: 2,
    type: 'single',
    credits: 250,
    price: 199,
    savings: '11%',
    description: '250 credits',
    currency: 'INR',
  },
  {
    id: 3,
    type: 'single',
    credits: 380,
    price: 299,
    savings: '22%',
    description: '380 credits',
    currency: 'INR',
  },
  {
    id: 4,
    type: 'single',
    credits: 500,
    price: 399,
    savings: '31%',
    description: '500 credits',
    currency: 'INR',
  },
  {
    id: 5,
    type: 'monthly',
    credits: 1000,
    price: 299,
    description: '1000 credits',
    currency: 'INR',
  },
];
