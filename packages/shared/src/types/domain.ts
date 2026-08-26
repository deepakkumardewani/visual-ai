// Shared domain types used by both API and web

// Note: Exported as const enum for JavaScript output; used as both type and value
export enum FeatureType {
  IMAGE = 'image',
  UPSCALE = 'upscale',
  COLORIZE = 'colorize',
  REVIVE = 'revive',
  REMOVE_BG = 'remove_bg',
}

export interface IImage {
  name: string;
  aiImagePublicId?: string;
  originalPublicId?: string;
  enhancedPublicId?: string;
  aiImageUrl?: string;
  originalImageUrl?: string;
  enhancedImageUrl?: string;
  resolution: string;
  aspectRatio: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface IImageObject {
  _id?: string;
  userId: string;
  prompt: string;
  featureType: FeatureType;
  modelName?: string;
  imageType?: string;
  isFavorite?: boolean;
  images: IImage[];
  humanReadableDate?: string;
  createdAt?: Date;
}

/** Lean community/explore feed card — one image per generation. */
export interface ExploreFeedItem {
  id: string;
  imageUrl: string;
  aspectRatio: string;
  prompt: string;
  modelName: string;
  author: string;
  authorUserId: string;
  createdAt: string;
}

export interface ExploreFeedResponse {
  items: ExploreFeedItem[];
  nextCursor: string | null;
}

export interface JobStatus {
  status: string;
  image: IImageObject | undefined;
  userCreditsRemaining: number | null;
  progress?: number;
  /** User-facing explanation, set on 'error' status for known/expected failure reasons (e.g. moderation rejection) */
  message?: string;
}

export interface RazorpayProduct {
  id: number;
  type: string;
  credits: number;
  price: number;
  savings?: string;
  description: string;
  currency: string;
}

export interface IPayment {
  transactionId: string;
  amount: number;
  description: string;
  status: string;
  paymentMethod: string;
  createdAt: Date;
  humanReadableDate: string;
}

export interface IReferral {
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: Date;
}

export interface IUser {
  userId: string;
  userName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  credits: number;
  dailyCredits: number;
  referralCode: string;
  referrals: IReferral[];
  payments: IPayment[];
  history: IImageObject[];
  favorites: IImageObject[];
  activities: { action: string; timestamp: Date; image: IImageObject }[];
}
