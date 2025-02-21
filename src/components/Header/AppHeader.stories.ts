import type { Meta, StoryObj } from '@storybook/vue3'

import AppHeader from './AppHeader.vue'

const meta = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    isAuthenticated: {
      control: 'boolean',
      description: 'Whether the user is authenticated'
    },
    userProfile: {
      control: 'object',
      description: 'User profile information'
    }
  }
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {
  args: {
    isAuthenticated: false
  }
}

export const LoggedIn: Story = {
  args: {
    isAuthenticated: true,
    userProfile: {
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?img=3'
    }
  }
}
