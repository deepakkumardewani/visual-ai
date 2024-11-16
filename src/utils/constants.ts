import { type Plan } from '@/stores/app'
import { Mode } from '@/stores/aside'

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

// Image Examples
export const EXAMPLES = [
  {
    prompt:
      'black forest gateau cake spelling out the words "FLUX SCHNELL", tasty, food photography, dynamic shot',
    url: 'https://res.cloudinary.com/ddzuitkzt/image/upload/v1724555480/gallery/bnutjse8nkqmhm3xxpb5.webp'
  },
  {
    prompt: 'a tiny astronaut hatching from an egg on the moon',
    url: 'https://res.cloudinary.com/ddzuitkzt/image/upload/v1724555480/gallery/qi1wdpvgxzpddklbwcbg.webp'
  },
  {
    prompt:
      'a man and woman are standing together against a backdrop, the backdrop is divided equally in half down the middle, left side is red, right side is gold, the woman is wearing a t-shirt with a yoda motif, she has a long skirt with birds on it, the man is wearing a three piece purple suit, he has spiky blue hair',
    url: 'https://res.cloudinary.com/ddzuitkzt/image/upload/v1724555480/gallery/rtbfdjd7mhwggdwav4wz.webp'
  },
  {
    prompt: 'Baby hedgehog wearing a flower crown in a garden',
    url: 'https://res.cloudinary.com/ddzuitkzt/image/upload/v1724555480/gallery/z13kdz1mbwsyn6iymd5z.webp'
  },
  {
    prompt:
      '3 magical wizards stand on a yellow table. On the left, a wizard in black robes holds a sign that says ‘AI’. In the middle, a witch in red robes holds a sign that says ‘is’ and on the right, a wizard in blue robes holds a sign that says ‘cool’. Behind them a purple dragon',
    url: 'https://res.cloudinary.com/ddzuitkzt/image/upload/v1724555480/gallery/hfzszwiatujblscjghm1.webp'
  },
  {
    prompt: 'POV someone holding their hand up, stunning black forest mountains',
    url: 'https://res.cloudinary.com/ddzuitkzt/image/upload/v1724555480/gallery/uc7plkdj78vrgy9u6daj.webp'
  }
]

// Pricing FAQs
export const PRICING_FAQS = [
  {
    question: 'What is the pricing for the service?',
    answer: 'The pricing for the service is $10 per month.'
  },
  {
    question: 'How do I pay for the service?',
    answer: 'You can pay for the service using a credit card.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, there is a 30-day free trial.'
  }
]

export const GENERAL_FAQS = [
  {
    question: 'What is the service?',
    answer: 'The service is a platform for managing your tasks.'
  },
  {
    question: 'How do I sign up for the service?',
    answer: 'You can sign up for the service by creating an account.'
  },
  {
    question: 'Is the service secure?',
    answer: 'Yes, the service is secure.'
  }
]

// Plans
export const STARTER_PLAN: Plan = {
  title: 'Starter',
  price: '0',
  description: 'Free forever',
  isFree: true,
  features: [
    {
      title: '5 credits/day Resets Daily',
      available: true
    },
    {
      title: 'Rollover Credits Capacity',
      available: false,
      tooltip: 'Coming soon'
    },
    {
      title: 'Standard quality images',
      available: true
    },
    {
      title: 'Only Webp format',
      available: true
    },
    {
      title: 'Colorize Images',
      available: false,
      tooltip: 'Coming soon'
    },
    {
      title: 'Remove Background',
      available: false,
      tooltip: 'Coming soon'
    },
    {
      title: 'Upscale Images',
      available: false,
      tooltip: 'Coming soon'
    },
    {
      title: 'Deoldify Images',
      available: false,
      tooltip: 'Coming soon'
    }
  ]
}

export const PRO_PLAN = {
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
      title: '1000 Rollover Credits Capacity',
      available: true
    },
    {
      title: 'High quality images',
      available: true
    },
    {
      title: 'Webp, PNG & JPG formats',
      available: true
    },
    {
      title: 'Colorize Images',
      available: true
    },
    {
      title: 'Remove Background',
      available: true
    },
    {
      title: 'Upscale Images',
      available: true
    },
    {
      title: 'Deoldify Images',
      available: true
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
    isPro: false
  },
  {
    title: 'WEBP',
    isPro: false
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
    isPro: false,
    name: 'Social Post',
    icon: '$socialPost',
    type: 'vertical'
  },
  {
    title: '9:16',
    isPro: true,
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
  // Add other feature types as needed
} as const
