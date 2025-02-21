import type { Meta, StoryObj } from '@storybook/vue3'

import FAQ from './FAQ.vue'

const meta = {
  title: 'Components/FAQ',
  component: FAQ,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="max-width: 800px; margin: 0 auto; padding: 1rem;"><story/></div>'
    })
  ],
  parameters: {
    docs: {
      description: {
        component:
          'FAQ section component that displays a list of frequently asked questions using accordions.'
      }
    }
  }
} satisfies Meta<typeof FAQ>

export default meta
type Story = StoryObj<typeof meta>

const defaultFaqs = [
  {
    question: 'What is AI Image Generation?',
    answer:
      'AI image generation uses advanced machine learning models to create images from text descriptions. Our system can generate unique visuals based on your prompts and requirements.',
    active: true
  },
  {
    question: 'How many images can I generate?',
    answer:
      'The number of images you can generate depends on your subscription plan. Free users get 50 credits per month, while Pro users get unlimited credits.'
  },
  {
    question: 'What types of images can I create?',
    answer:
      'You can create a wide variety of images including digital art, photographs, illustrations, and more. The system supports different styles and artistic preferences.'
  }
]

const faqsWithHTML = [
  {
    question: 'What are the available features?',
    answer: `
      <ul class="tw-list-disc tw-pl-4 tw-mb-4">
        <li>Text-to-Image Generation</li>
        <li>Image Upscaling</li>
        <li>Style Transfer</li>
        <li>Color Enhancement</li>
      </ul>
      <p>Each feature is designed to help you create and enhance your images effectively.</p>
    `
  },
  {
    question: 'What are the pricing plans?',
    answer: `
      <div class="tw-space-y-2">
        <p><strong>Free Plan:</strong></p>
        <ul class="tw-list-disc tw-pl-4">
          <li>50 credits/month</li>
          <li>Basic features</li>
          <li>Community support</li>
        </ul>
        <p><strong>Pro Plan:</strong></p>
        <ul class="tw-list-disc tw-pl-4">
          <li>Unlimited credits</li>
          <li>All features</li>
          <li>Priority support</li>
        </ul>
      </div>
    `
  }
]

const longFaqs = Array.from({ length: 10 }, (_, i) => ({
  question: `Frequently Asked Question ${i + 1}`,
  answer:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  active: i === 0
}))

export const Default: Story = {
  args: {
    faqs: defaultFaqs
  }
}

export const WithHTMLContent: Story = {
  args: {
    faqs: faqsWithHTML
  }
}

export const SingleQuestion: Story = {
  args: {
    faqs: [defaultFaqs[0]]
  }
}

export const ManyQuestions: Story = {
  args: {
    faqs: longFaqs
  }
}

export const AllExpanded: Story = {
  args: {
    faqs: defaultFaqs.map((faq) => ({ ...faq, active: true }))
  }
}

export const Mobile: Story = {
  args: {
    faqs: defaultFaqs
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

export const DarkMode: Story = {
  args: {
    faqs: defaultFaqs
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}
