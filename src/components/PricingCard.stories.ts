import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import PricingCard from './PricingCard.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Components/PricingCard',
  component: PricingCard,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="padding: 1rem; max-width: 400px;"><story/></div>',
      setup() {
        setActivePinia(createPinia())
      }
    })
  ],
  parameters: {
    docs: {
      description: {
        component: 'Pricing card component displaying plan details and features.'
      }
    }
  }
} satisfies Meta<typeof PricingCard>

export default meta
type Story = StoryObj<typeof meta>

const freePlan = {
  title: 'Free',
  price: '0',
  description: 'Perfect for getting started',
  isFree: true,
  features: [
    { title: '50 Credits/month', available: true },
    { title: 'Basic Image Generation', available: true },
    { title: 'Standard Resolution', available: true },
    { title: 'Community Support', available: true },
    { title: 'Priority Processing', available: false, tooltip: 'Available in Pro plan' },
    { title: 'Advanced Features', available: false, tooltip: 'Available in Pro plan' }
  ]
}

const proPlan = {
  title: 'Pro',
  price: '499',
  description: 'For professional creators',
  isFree: false,
  features: [
    { title: 'Unlimited Credits', available: true },
    { title: 'Advanced Image Generation', available: true },
    { title: 'High Resolution Output', available: true },
    { title: 'Priority Support', available: true },
    { title: 'Priority Processing', available: true },
    { title: 'All Advanced Features', available: true }
  ]
}

export const FreeTier: Story = {
  args: {
    plan: freePlan
  },
  parameters: {
    mockData: {
      isPro: false
    }
  }
}

export const ProTier: Story = {
  args: {
    plan: proPlan
  },
  parameters: {
    mockData: {
      isPro: false
    }
  }
}

export const CurrentPlan: Story = {
  args: {
    plan: freePlan
  },
  parameters: {
    mockData: {
      isPro: true
    }
  }
}

export const DarkMode: Story = {
  args: {
    plan: proPlan
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    mockData: {
      isDark: true,
      isPro: false
    }
  }
}

export const LoadingState: Story = {
  args: {
    plan: proPlan
  },
  parameters: {
    mockData: {
      isLoading: true,
      isPro: false
    }
  }
}
