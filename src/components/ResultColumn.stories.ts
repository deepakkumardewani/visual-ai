import type { Meta, StoryObj } from '@storybook/vue3'
import { createPinia, setActivePinia } from 'pinia'

import { FeatureType } from '@/types'

import ResultColumn from './ResultColumn.vue'

// Create and set up Pinia store before each story
const pinia = createPinia()
setActivePinia(pinia)

const meta = {
  title: 'Components/ResultColumn',
  component: ResultColumn,
  tags: ['autodocs'],
  decorators: [
    () => ({
      template: '<div style="padding: 1rem; height: 600px;"><story/></div>',
      setup() {
        setActivePinia(createPinia())
      }
    })
  ],
  parameters: {
    docs: {
      description: {
        component: 'Result display component for showing generated or enhanced images.'
      }
    }
  }
} satisfies Meta<typeof ResultColumn>

export default meta
type Story = StoryObj<typeof meta>

const sampleImages = [
  {
    name: 'image1',
    aiImageUrl: 'https://picsum.photos/800/600',
    aiImagePublicId: 'sample1',
    originalImageUrl: 'https://picsum.photos/400/300',
    originalPublicId: 'original1',
    enhancedImageUrl: 'https://picsum.photos/1600/1200',
    enhancedPublicId: 'enhanced1'
  }
]

const multipleImages = [
  {
    name: 'image1',
    aiImageUrl: 'https://picsum.photos/800/600',
    aiImagePublicId: 'sample1'
  },
  {
    name: 'image2',
    aiImageUrl: 'https://picsum.photos/800/600',
    aiImagePublicId: 'sample2'
  },
  {
    name: 'image3',
    aiImageUrl: 'https://picsum.photos/800/600',
    aiImagePublicId: 'sample3'
  },
  {
    name: 'image4',
    aiImageUrl: 'https://picsum.photos/800/600',
    aiImagePublicId: 'sample4'
  }
]

export const SingleImage: Story = {
  parameters: {
    mockData: {
      feature: FeatureType.IMAGE,
      images: sampleImages,
      isLoading: false,
      imageData: {
        imageType: 'horizontal'
      }
    }
  }
}

export const MultipleImages: Story = {
  parameters: {
    mockData: {
      feature: FeatureType.IMAGE,
      images: multipleImages,
      isLoading: false,
      imageData: {
        imageType: 'horizontal'
      }
    }
  }
}

export const UpscaleComparison: Story = {
  parameters: {
    mockData: {
      feature: FeatureType.UPSCALE,
      images: sampleImages,
      isLoading: false,
      upscaleInProgress: false,
      imageData: {
        featureType: 'upscale'
      }
    }
  }
}

export const ColorizeComparison: Story = {
  parameters: {
    mockData: {
      feature: FeatureType.COLORIZE,
      images: sampleImages,
      isLoading: false,
      colorizeInProgress: false,
      imageData: {
        featureType: 'colorize'
      }
    }
  }
}

export const LoadingState: Story = {
  parameters: {
    mockData: {
      feature: FeatureType.IMAGE,
      images: [],
      isLoading: true
    }
  }
}

export const ProcessingState: Story = {
  parameters: {
    mockData: {
      feature: FeatureType.UPSCALE,
      images: sampleImages,
      upscaleInProgress: true,
      imageData: {
        featureType: 'upscale'
      }
    }
  }
}

export const ErrorState: Story = {
  parameters: {
    mockData: {
      feature: FeatureType.IMAGE,
      images: [],
      isLoading: false,
      errMsg: 'Failed to generate image. Please try again.'
    }
  }
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    mockData: {
      feature: FeatureType.IMAGE,
      images: multipleImages,
      isLoading: false,
      imageData: {
        imageType: 'vertical'
      }
    }
  }
}
