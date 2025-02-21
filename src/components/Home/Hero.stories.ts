import type { Meta, StoryObj } from '@storybook/vue3'

import Hero from './Hero.vue'

const meta = {
  title: 'Sections/Hero',
  component: Hero,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark'
    }
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title of the hero section'
    },
    subtitle: {
      control: 'text',
      description: 'Subtitle text'
    },
    ctaText: {
      control: 'text',
      description: 'Call to action button text'
    }
  }
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Transform Your Ideas into Visual Reality',
    subtitle: 'Create stunning images from text descriptions using advanced AI',
    ctaText: 'Get Started'
  }
}

export const WithCustomContent: Story = {
  args: {
    title: 'Unleash Your Creative Vision',
    subtitle: 'Professional-grade AI image generation at your fingertips',
    ctaText: 'Try Now Free'
  }
}
