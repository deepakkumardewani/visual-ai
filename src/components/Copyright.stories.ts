import type { Meta, StoryObj } from '@storybook/vue3'

import Copyright from './Copyright.vue'

const meta = {
  title: 'Components/Copyright',
  component: Copyright,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="padding: 1rem;"><story/></div>'
    })
  ],
  parameters: {
    docs: {
      description: {
        component: 'Copyright notice component with dynamic year and branding.'
      }
    }
  }
} satisfies Meta<typeof Copyright>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    mockData: {
      currentYear: new Date().getFullYear()
    }
  }
}

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    mockData: {
      currentYear: new Date().getFullYear()
    }
  }
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    mockData: {
      currentYear: new Date().getFullYear()
    }
  }
}

export const WithCustomYear: Story = {
  parameters: {
    mockData: {
      currentYear: 2025 // Future year for testing
    }
  }
}
