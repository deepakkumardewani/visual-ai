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

export interface IUser {
  userId: string
  userName: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  referralCode: string
  referredBy: string
  credits: number
  plan: string
  subscriptionId: string
  monthlyCredits: number
  isPro: boolean
  subscriptionEnd: Date
  payments: any[]
  history: IImageObject[]
  activities: any[]
  createdAt: Date
  updatedAt: Date
}
export interface IPayment {
  transactionId: string
  amount: number
  description: string
  status: string
  paymentMethod: string
  createdAt: Date
  humanReadableDate: string
}

export enum FeatureType {
  IMAGE = 'image',
  COLORIZE = 'colorize',
  REVIVE = 'revive',
  UPSCALE = 'upscale'
}
export interface IImage {
  _id: string
  name: string
  aiImageUrl?: string
  originalImageUrl?: string
  enhancedImageUrl?: string
  aiImagePublicId?: string
  originalPublicId?: string
  enhancedPublicId?: string
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
  featureType: FeatureType
  modelName: string
  imageType: string
  isFavorite: boolean
  images: IImage[]
  humanReadableDate: string
  createdAt: Date
}

export type ImageBody = {
  jobId: string
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

export interface RazorpayProduct {
  id: number
  type: string
  credits: number
  price: number
  savings?: string
  description: string
  currency: string
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

export interface GroupedObject {
  title: string
  data: IImageObject[]
}

export interface RazorpaySubscription {
  id: string
  entity: string
  plan_id: string
  customer_id: string
  status: string
  current_start: number
  current_end: number
  ended_at: number
  quantity: number
  notes: {
    [key: string]: string
  }
  charge_at: number
  start_at: number
  end_at: number
  auth_attempts: number
  total_count: number
  paid_count: number
  customer_notify: boolean
  created_at: number
  expire_by: number
  short_url: string
  has_scheduled_changes: boolean
  change_scheduled_at: number | null
  source: string
  offer_id: string
  remaining_count: number
}
export interface RazorpayOrder {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  offer_id: string | null
  status: string
  attempts: number
  notes: any[]
  created_at: number
}
