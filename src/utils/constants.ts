import { type Plan } from '@/stores/app'

export const MODEL_IDS = {
  FLUX_STARTER: 'FLUX_STARTER',
  FLUX_BASIC: 'FLUX_BASIC',
  FLUX_PRO: 'FLUX_PRO',
  FLUX_REALISM: 'FLUX_REALISM',
  OLD_PHOTOS: 'OLD_PHOTOS',
  COLORIZE_BASIC: 'COLORIZE_BASIC',
  COLORIZE_ADVANCED: 'COLORIZE_ADVANCED',
  REMOVE_BACKGROUND: 'REMOVE_BACKGROUND',
  UPSCALE_IMAGE: 'UPSCALE_IMAGE'
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
    title: 'jpg',
    isPro: false
  },
  {
    title: 'png',
    isPro: true
  },
  {
    title: 'webp',
    isPro: true
  }
]

export const IMAGE_VARIATIONS = [
  {
    title: '1',
    value: 1,
    isPro: false
  },
  {
    title: '2',
    value: 2,
    isPro: true
  },
  {
    title: '3',
    value: 3,
    isPro: true
  },
  {
    title: '4',
    value: 4,
    isPro: true
  }
]
// Aspect Ratios
export const ASPECT_RATIOS = [
  {
    title: '1:1'
  },
  {
    title: '16:9'
  },
  {
    title: '21:9'
  },
  {
    title: '2:3'
  },
  {
    title: '3:2'
  },
  {
    title: '4:5'
  },
  {
    title: '5:4'
  },
  {
    title: '9:16'
  },
  {
    title: '9:21'
  }
]

// Flux Modes
export const FLUX_MODES = [
  {
    title: 'Flux Fast',
    id: MODEL_IDS.FLUX_BASIC,
    description: 'Combines speed with high quality. Great prompt adherence.',
    icon: '$fluxFast'
  },
  {
    title: 'Flux Pro',
    id: MODEL_IDS.FLUX_PRO,
    description: 'State-of-the-art image generation. Top of the line prompt following.',
    icon: '$fluxPro'
  },
  {
    title: 'Flux Realism',
    id: MODEL_IDS.FLUX_REALISM,
    description: 'Best at ultra realistic photos. Prioritizes details and textures.',
    icon: '$fluxRealism'
  }
]
