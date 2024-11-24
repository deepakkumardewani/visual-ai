export interface Feature {
  title: string
  available: boolean
  tooltip?: string
}

export interface Plan {
  title: string
  price: string
  description: string
  features: Feature[]
  isFree: boolean
}

export interface Mode {
  title: string
  id: string
  description: string
  icon: string
  isPro: boolean
}

export interface IImage {
  aiImageUrl?: string
  originalImageUrl?: string
  enhancedImageUrl?: string
  name: string
  publicId: string
  resolution: string
  width: number
  height: number
  format: string
  bytes: number
  aspectRatio: string
}
export interface IImageObject {
  _id: string
  userId: string
  prompt: string
  featureType: string
  modelName: string
  imageType: string
  isFavorite: boolean
  images: IImage[]
  humanReadableDate: string
  createdAt: Date
}

export type ImageBody = {
  modelId: string
  modelName: string
  prompt: string
  noOfOutputs: number
  outputQuality: number
  aspectRatio: string
  outputFormat: string
  imageType: string
}

// export interface VideoFeature {
//   title: string
//   description: string
//   url: string
//   ref: string
//   videoRef: Ref<HTMLVideoElement | undefined>
//   icon: string
// }

export interface IGenerateResponse {
  image: IImageObject
  userCreditsRemaining: number
}

export interface GalleryImage {
  url: string
  prompt: string
  aspectRatio: string
}

export interface PaddleProduct {
  id: number
  type: string
  credits: number
  priceId: string
  price: number
  savings?: string
}

export interface FeatureSelect {
  id: string
  name: string
  title: string
  icon: string
}

export interface JobStatus {
  status: string
  image: IImageObject
  userCreditsRemaining: number
}
