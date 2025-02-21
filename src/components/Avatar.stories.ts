import type { Meta, StoryObj } from '@storybook/vue3'

import Avatar from './Avatar.vue'

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="padding: 1rem;"><story/></div>'
    })
  ],
  parameters: {
    docs: {
      description: {
        component: 'User avatar component that displays either an image or initials.'
      }
    }
  }
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  args: {
    size: 'small'
  },
  parameters: {
    mockData: {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://i.pravatar.cc/150?img=1'
      }
    }
  }
}

export const WithInitials: Story = {
  args: {
    size: 'small'
  },
  parameters: {
    mockData: {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: '' // Empty to trigger initials fallback
      }
    }
  }
}

export const LargeSize: Story = {
  args: {
    size: 'large'
  },
  parameters: {
    mockData: {
      user: {
        firstName: 'Jane',
        lastName: 'Smith',
        imageUrl: 'https://i.pravatar.cc/150?img=2'
      }
    }
  }
}

export const LoadingError: Story = {
  args: {
    size: 'medium'
  },
  parameters: {
    mockData: {
      user: {
        firstName: 'Robert',
        lastName: 'Johnson',
        imageUrl: 'invalid-url' // To trigger error state
      }
    }
  }
}

export const NoUser: Story = {
  args: {
    size: 'small'
  },
  parameters: {
    mockData: {
      user: null
    }
  }
}
