import type { FeatureSelect, Mode, PaddleProduct, Plan } from '@/types'

import generalFAQ from './generalFAQ.json'
import pricingFAQ from './pricingFAQ.json'

export const MODEL_IDS = {
  FLUX_QUICK: 'FLUX_QUICK',
  FLUX_BASIC: 'FLUX_BASIC',
  FLUX_PRO: 'FLUX_PRO',
  FLUX_1_1_PRO: 'FLUX_1_1_PRO',
  FLUX_REALISM: 'FLUX_REALISM',
  UPSCALE_IMAGE: 'UPSCALE_IMAGE',
  COLORIZE_BASIC: 'COLORIZE_BASIC',
  COLORIZE_ADVANCED: 'COLORIZE_ADVANCED',
  REVIVE: 'REVIVE',
  REMOVE_BACKGROUND: 'REMOVE_BACKGROUND'
}

// Pricing FAQs
export const PRICING_FAQS = pricingFAQ

export const GENERAL_FAQS = [...generalFAQ, ...pricingFAQ]

// Plans
export const STARTER_PLAN: Plan = {
  title: 'Starter',
  price: '0',
  description: 'Free forever',
  isFree: true,
  features: [
    {
      title: '20 credits/day Resets Daily',
      available: true
    },
    {
      title: 'No rollover credits',
      available: false
    },
    {
      title: 'Standard quality images',
      available: false
    },
    {
      title: 'Only 2 image variations',
      available: false
    },
    {
      title: 'Only JPG format',
      available: false
    },
    {
      title: 'Colorize Images',
      available: true,
      tooltip: 'Uses 3 credits per image'
    },
    {
      title: 'Upscale Images',
      available: true,
      tooltip: 'Uses 3 credits per image'
    },
    {
      title: 'Revive Old Photos',
      available: true,
      tooltip: 'Uses 3 credits per image'
    }
  ]
}

export const PRO_PLAN: Plan = {
  title: 'Pro',
  price: '5',
  description: 'Billed monthly',
  isFree: false,
  features: [
    {
      title: '300 credits/month Resets Monthly',
      available: true
    },
    {
      title: '2000 Rollover Credits Capacity',
      available: true,
      tooltip: 'Unused monthly credits will rollover to a maxiumum of 2000 rollover credits'
    },
    {
      title: 'High quality images',
      available: true
    },
    {
      title: 'Upto 4 image variations',
      available: true
    },
    {
      title: 'Webp, PNG & JPG formats',
      available: true
    },
    {
      title: 'Colorize Images',
      available: true,
      tooltip: 'Uses 1 credit per image'
    },
    {
      title: 'Upscale Images',
      available: true,
      tooltip: 'Uses 1 credit per image'
    },
    {
      title: 'Revive Old Photos',
      available: true,
      tooltip: 'Uses 1 credit per image'
    }
  ]
}

// Image Formats
export const IMAGE_FORMATS = [
  {
    title: 'JPG',
    isPro: false
  },
  {
    title: 'PNG',
    isPro: true
  },
  {
    title: 'WEBP',
    isPro: true
  }
]

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

export const IMAGE_SIZES = ['2X', '4X', '6X', '8X']

export const IMAGE_SIZE_OPTIONS = [
  { value: 'mini', title: 'Mini' },
  { value: 'small', title: 'Small' },
  { value: 'medium', title: 'Medium' },
  { value: 'large', title: 'Large' }
]

export const SIZE_CLASSES = {
  mini: 'tw-grid-cols-3 sm:tw-grid-cols-4 md:tw-grid-cols-6 lg:tw-grid-cols-8',
  small: 'tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-5 lg:tw-grid-cols-6',
  medium: 'tw-grid-cols-2 sm:tw-grid-cols-3 md:tw-grid-cols-4 lg:tw-grid-cols-5',
  large: 'tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4'
}

// Aspect Ratios
export const ASPECT_RATIOS = [
  {
    title: '1:1',
    isPro: false,
    name: 'Square',
    icon: '$square',
    type: 'square'
  },
  {
    title: '2:3',
    isPro: true,
    name: 'Portrait',
    icon: '$portrait',
    type: 'vertical'
  },
  {
    title: '3:2',
    isPro: true,
    name: 'Standard',
    icon: '$standard',
    type: 'horizontal'
  },
  {
    title: '4:5',
    isPro: true,
    name: 'Social Post',
    icon: '$socialPost',
    type: 'vertical'
  },
  {
    title: '9:16',
    isPro: false,
    name: 'Social Story',
    icon: '$socialStory',
    type: 'vertical'
  },
  {
    title: '16:9',
    isPro: false,
    name: 'Widescreen',
    icon: '$widescreen',
    type: 'horizontal'
  },
  {
    title: '21:9',
    isPro: true,
    name: 'Cinematic',
    icon: '$cinematic',
    type: 'horizontal'
  }
]

// Flux Modes
export const FLUX_MODES: Mode[] = [
  {
    title: 'Flux Lightening',
    id: MODEL_IDS.FLUX_BASIC,
    description: 'Prefers speed over quality. Good prompt adherence.',
    icon: '$fluxFast',
    isPro: false
  },
  {
    title: 'Flux Fast',
    id: MODEL_IDS.FLUX_BASIC,
    description: 'Combines speed with high quality. Great prompt adherence.',
    icon: '$fluxFast',
    isPro: false
  },

  {
    title: 'Flux Pro',
    id: MODEL_IDS.FLUX_PRO,
    description: 'State-of-the-art image generation. Top of the line prompt following.',
    icon: '$fluxPro',
    isPro: true
  },
  {
    title: 'Flux 1.1 Pro',
    id: MODEL_IDS.FLUX_1_1_PRO,
    description: 'Faster, better FLUX Pro. Excellent image quality & prompt adherence.',
    icon: '$fluxPro',
    isPro: true
  },
  {
    title: 'Flux Realism',
    id: MODEL_IDS.FLUX_REALISM,
    description: 'Best at ultra realistic photos. Prioritizes details and textures.',
    icon: '$fluxRealism',
    isPro: true
  }
]

export const FeatureType = {
  AI_IMAGE: 'AI Image',
  UPSCALE: 'Upscale',
  REVIVE: 'Revive'
} as const

export const FEATURES: FeatureSelect[] = [
  {
    id: 'ai_image',
    name: 'image',
    title: 'AI Image Generator',
    icon: '$imageFrame'
  },
  {
    id: 'image_upscaler',
    name: 'upscaler',
    title: 'Image Upscaler',
    icon: '$expand'
  },
  {
    id: 'colorize_image',
    name: 'colorizer',
    title: 'Colorize Image',
    icon: '$dropper'
  },
  {
    id: 'revive_old_photos',
    name: 'reviver',
    title: 'Revive Old Photos',
    icon: '$camera'
  }
]

export const PADDLE_PRODUCTS: PaddleProduct[] = [
  { id: 1, type: 'single', credits: 200, price: 4.99, priceId: 'pri_01jbx7ay8gdya88d5q5a80kdmb' },
  {
    id: 2,
    type: 'single',
    credits: 450,
    price: 9.99,
    priceId: 'pri_01jcdfc7tppg16ephxjs9z7j6w',
    savings: '10%'
  },
  {
    id: 3,
    type: 'single',
    credits: 960,
    price: 14.99,
    priceId: 'pri_01jcdfd9vxecgyehhvafreavnj',
    savings: '20%'
  },
  {
    id: 4,
    type: 'single',
    credits: 2000,
    price: 19.99,
    priceId: 'pri_01jcdfe1451rnbhdgtja6wrtzy',
    savings: '30%'
  },
  { id: 5, type: 'monthly', credits: 300, price: 4.99, priceId: 'pri_01jbx76xqnmyy9v3tmkf62c3cp' }
]
