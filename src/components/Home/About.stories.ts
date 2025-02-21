import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import About from './About.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Home/About',
  component: About,
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
        component: 'About section with parallax image effect and responsive layout.'
      }
    },
    layout: 'fullscreen'
  }
} satisfies Meta<typeof About>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    },
    mockData: {
      mobile: false
    }
  }
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    mockData: {
      mobile: true
    }
  }
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}

export const WithCustomImage: Story = {
  parameters: {
    mockData: {
      aboutImage: 'https://picsum.photos/1200/800'
    }
  }
}

export const WithoutParallax: Story = {
  parameters: {
    mockData: {
      SCALE_FACTOR: 0
    }
  }
}
