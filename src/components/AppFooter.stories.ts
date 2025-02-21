import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import AppFooter from './AppFooter.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Layout/AppFooter',
  component: AppFooter,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div><story/></div>',
      setup() {
        setActivePinia(createPinia())
      }
    })
  ],
  parameters: {
    docs: {
      description: {
        component: 'Footer component with copyright information and navigation links.'
      }
    },
    layout: 'fullscreen'
  }
} satisfies Meta<typeof AppFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    mockData: {
      route: {
        path: '/dashboard'
      },
      isDark: false,
      FOOTER_LINKS: [
        { text: 'Home', path: '/', icon: 'fas fa-home' },
        { text: 'About', path: '/about', icon: 'fas fa-info-circle' },
        { text: 'Privacy', path: '/privacy', icon: 'fas fa-shield-alt' },
        { text: 'Terms', path: '/terms', icon: 'fas fa-file-contract' }
      ]
    }
  }
}

export const HomePage: Story = {
  parameters: {
    mockData: {
      route: {
        path: '/'
      },
      isDark: false,
      FOOTER_LINKS: [
        { text: 'Home', path: '/', icon: 'fas fa-home' },
        { text: 'About', path: '/about', icon: 'fas fa-info-circle' },
        { text: 'Privacy', path: '/privacy', icon: 'fas fa-shield-alt' },
        { text: 'Terms', path: '/terms', icon: 'fas fa-file-contract' }
      ]
    }
  }
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    mockData: {
      route: {
        path: '/dashboard'
      },
      isDark: true,
      FOOTER_LINKS: [
        { text: 'Home', path: '/', icon: 'fas fa-home' },
        { text: 'About', path: '/about', icon: 'fas fa-info-circle' },
        { text: 'Privacy', path: '/privacy', icon: 'fas fa-shield-alt' },
        { text: 'Terms', path: '/terms', icon: 'fas fa-file-contract' }
      ]
    }
  }
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    mockData: {
      route: {
        path: '/dashboard'
      },
      isDark: false,
      FOOTER_LINKS: [
        { text: 'Home', path: '/', icon: 'fas fa-home' },
        { text: 'About', path: '/about', icon: 'fas fa-info-circle' },
        { text: 'Privacy', path: '/privacy', icon: 'fas fa-shield-alt' },
        { text: 'Terms', path: '/terms', icon: 'fas fa-file-contract' }
      ]
    }
  }
}
