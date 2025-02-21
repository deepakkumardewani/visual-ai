import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import Coin from './Coin.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Header/Coin',
  component: Coin,
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
        component: 'Credit balance display with hover menu showing credit information.'
      }
    },
    viewport: {
      defaultViewport: 'desktop'
    }
  }
} satisfies Meta<typeof Coin>

export default meta
type Story = StoryObj<typeof meta>

export const FreeTierLowCredits: Story = {
  parameters: {
    mockData: {
      credits: 5,
      isPro: false,
      hasJustSubscribed: false
    }
  }
}

export const FreeTierHighCredits: Story = {
  parameters: {
    mockData: {
      credits: 100,
      isPro: false,
      hasJustSubscribed: false
    }
  }
}

export const ProTierCredits: Story = {
  parameters: {
    mockData: {
      credits: 500,
      isPro: true,
      hasJustSubscribed: false
    }
  }
}

export const JustSubscribed: Story = {
  parameters: {
    mockData: {
      credits: 1000,
      isPro: true,
      hasJustSubscribed: true
    }
  }
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    mockData: {
      credits: 100,
      isPro: false,
      hasJustSubscribed: false
    }
  }
}
