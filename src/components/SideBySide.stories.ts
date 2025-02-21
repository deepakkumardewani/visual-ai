import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import SideBySide from './SideBySide.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Components/SideBySide',
  component: SideBySide,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="height: 600px;"><story/></div>',
      setup() {
        setActivePinia(createPinia())
      }
    })
  ],
  parameters: {
    docs: {
      description: {
        component: 'Side-by-side image comparison slider component.'
      }
    }
  }
} satisfies Meta<typeof SideBySide>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    originalImage: 'https://picsum.photos/800/600?image=1',
    enhancedImage: 'https://picsum.photos/800/600?image=2',
    inDialog: false
  }
}

export const InDialog: Story = {
  args: {
    originalImage: 'https://picsum.photos/800/600?image=3',
    enhancedImage: 'https://picsum.photos/800/600?image=4',
    inDialog: true
  }
}

export const VerticalImages: Story = {
  args: {
    originalImage: 'https://picsum.photos/600/800?image=5',
    enhancedImage: 'https://picsum.photos/600/800?image=6',
    inDialog: false
  }
}

export const Mobile: Story = {
  args: {
    originalImage: 'https://picsum.photos/800/600?image=7',
    enhancedImage: 'https://picsum.photos/800/600?image=8',
    inDialog: false
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    mockData: {
      mobile: true
    }
  }
}

export const Loading: Story = {
  args: {
    originalImage: 'https://picsum.photos/800/600?image=9',
    enhancedImage: 'https://picsum.photos/800/600?image=10',
    inDialog: false
  },
  parameters: {
    mockData: {
      ready: false,
      originalImageLoaded: false,
      enhancedImageLoaded: false
    }
  }
}

export const DarkMode: Story = {
  args: {
    originalImage: 'https://picsum.photos/800/600?image=11',
    enhancedImage: 'https://picsum.photos/800/600?image=12',
    inDialog: false
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}
