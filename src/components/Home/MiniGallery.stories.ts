import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import MiniGallery from './MiniGallery.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Home/MiniGallery',
  component: MiniGallery,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="padding: 1rem;"><story/></div>',
      setup() {
        setActivePinia(createPinia())
      }
    })
  ],
  parameters: {
    docs: {
      description: {
        component: 'A responsive gallery grid showcasing AI-generated images with hover effects.'
      }
    },
    layout: 'fullscreen'
  }
} satisfies Meta<typeof MiniGallery>

export default meta
type Story = StoryObj<typeof meta>

const sampleImages = [
  {
    url: 'https://picsum.photos/800/600',
    prompt: 'A serene landscape with mountains and a lake at sunset'
  },
  {
    url: 'https://picsum.photos/800/800',
    prompt: 'Abstract digital art with vibrant colors and geometric shapes'
  },
  {
    url: 'https://picsum.photos/600/800',
    prompt: 'Portrait of a mystical character with glowing eyes'
  },
  {
    url: 'https://picsum.photos/900/600',
    prompt: 'Futuristic cityscape with flying vehicles and neon lights'
  },
  {
    url: 'https://picsum.photos/800/700',
    prompt: 'Underwater scene with bioluminescent creatures'
  },
  {
    url: 'https://picsum.photos/700/800',
    prompt: 'Fantasy forest with giant mushrooms and magical creatures'
  }
]

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    },
    mockData: {
      randomImages: sampleImages
    }
  }
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    mockData: {
      randomImages: sampleImages.slice(0, 3) // Show fewer images on mobile
    }
  }
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    mockData: {
      randomImages: sampleImages,
      isDark: true
    }
  }
}

export const Loading: Story = {
  parameters: {
    mockData: {
      randomImages: sampleImages.map((img) => ({ ...img, url: 'loading' }))
    }
  }
}

export const WithLongPrompts: Story = {
  parameters: {
    mockData: {
      randomImages: sampleImages.map((img) => ({
        ...img,
        prompt: img.prompt + '. ' + img.prompt + '. ' + img.prompt
      }))
    }
  }
}
