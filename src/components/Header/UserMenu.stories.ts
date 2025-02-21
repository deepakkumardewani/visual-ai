import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import UserMenu from './UserMenu.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Header/UserMenu',
  component: UserMenu,
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
        component: 'User menu dropdown with profile information and actions.'
      }
    }
  }
} satisfies Meta<typeof UserMenu>

export default meta
type Story = StoryObj<typeof meta>

export const FreeTier: Story = {
  parameters: {
    mockData: {
      userDetails: {
        fullName: 'John Doe',
        email: 'john@example.com',
        isPro: false,
        referralCode: 'JOHN123'
      }
    }
  }
}

export const ProTier: Story = {
  parameters: {
    mockData: {
      userDetails: {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        isPro: true,
        referralCode: 'JANE456'
      }
    }
  }
}

export const LongName: Story = {
  parameters: {
    mockData: {
      userDetails: {
        fullName: 'Alexander Christopher Wellington-Holmes III',
        email: 'alexander@example.com',
        isPro: true,
        referralCode: 'ALEX789'
      }
    }
  }
}
