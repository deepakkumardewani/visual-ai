import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import ThemeButton from './ThemeButton.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Header/ThemeButton',
  component: ThemeButton,
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
        component: 'A button that toggles between light and dark theme modes.'
      }
    }
  }
} satisfies Meta<typeof ThemeButton>

export default meta
type Story = StoryObj<typeof meta>

export const LightMode: Story = {
  parameters: {
    backgrounds: {
      default: 'light'
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
