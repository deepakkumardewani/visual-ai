import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import Features from './Features.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Home/Features',
  component: Features,
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
        component: 'Features section showcasing the main capabilities of the application.'
      }
    },
    layout: 'fullscreen'
  }
} satisfies Meta<typeof Features>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    },
    mockData: {
      features: [
        {
          title: 'Text-to-Image',
          description: 'Transform your ideas into stunning images with our advanced AI',
          url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/owrcv8j8uo1p9nhlxeh2.mp4',
          ref: 'textToImageVideo'
        },
        {
          title: 'Upscale',
          description: 'Enhance image quality and resolution without losing details',
          url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/x9zn6em8ylbyqhdn8mki.mp4',
          ref: 'upscaleVideo'
        }
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
      features: [
        {
          title: 'Text-to-Image',
          description: 'Transform your ideas into stunning images with our advanced AI',
          url: 'https://res.cloudinary.com/ddzuitkzt/video/upload/v1730915532/videos/owrcv8j8uo1p9nhlxeh2.mp4',
          ref: 'textToImageVideo'
        }
      ]
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
