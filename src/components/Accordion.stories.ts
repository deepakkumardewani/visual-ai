import type { Meta, StoryObj } from '@storybook/vue3'

import Accordion from './Accordion.vue'

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="max-width: 600px; padding: 1rem;"><story/></div>'
    })
  ],
  parameters: {
    docs: {
      description: {
        component: 'Expandable accordion component with smooth transitions.'
      }
    }
  }
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'What is AI Image Generation?',
    id: 'ai-image',
    active: false
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args }
    },
    template: `
      <Accordion v-bind="args">
        <p>AI image generation uses advanced machine learning models to create images from text descriptions. It can generate unique visuals based on your prompts and requirements.</p>
      </Accordion>
    `
  })
}

export const InitiallyOpen: Story = {
  args: {
    title: 'How does it work?',
    id: 'how-it-works',
    active: true
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args }
    },
    template: `
      <Accordion v-bind="args">
        <p>Our system uses state-of-the-art AI models to analyze your text prompt and generate corresponding images. The process involves understanding the context, style, and elements you describe.</p>
      </Accordion>
    `
  })
}

export const LongContent: Story = {
  args: {
    title: 'Terms and Conditions',
    id: 'terms',
    active: false
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args }
    },
    template: `
      <Accordion v-bind="args">
        <div>
          <p class="mb-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <p class="mb-2">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
        </div>
      </Accordion>
    `
  })
}

export const WithList: Story = {
  args: {
    title: 'Available Features',
    id: 'features',
    active: false
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args }
    },
    template: `
      <Accordion v-bind="args">
        <ul class="list-disc pl-4">
          <li>Text to Image Generation</li>
          <li>Image Upscaling</li>
          <li>Style Transfer</li>
          <li>Color Enhancement</li>
        </ul>
      </Accordion>
    `
  })
}

export const DarkMode: Story = {
  args: {
    title: 'Dark Mode Example',
    id: 'dark-mode',
    active: false
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  },
  render: (args) => ({
    components: { Accordion },
    setup() {
      return { args }
    },
    template: `
      <Accordion v-bind="args">
        <p>This is how the accordion looks in dark mode. The content remains readable and the transitions smooth.</p>
      </Accordion>
    `
  })
}
