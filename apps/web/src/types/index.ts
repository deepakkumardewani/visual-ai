import type { IImageObject } from '@visual-ai/shared';

// Re-export shared types
export { FeatureType } from '@visual-ai/shared';

export type {
  IImage,
  ExploreFeedItem,
  ExploreFeedResponse,
  JobStatus,
  RazorpayProduct,
  IPayment,
  IReferral,
  IUser,
} from '@visual-ai/shared';

export type { IImageObject };

export interface Feature {
  title: string;
  available: boolean;
  tooltip?: string;
}

export interface Plan {
  title: string;
  price: string;
  description: string;
  features: Feature[];
  isFree: boolean;
}

export type { Model } from './model';

export type ImageBody = {
  jobId: string;
  modelId: string;
  modelName: string;
  prompt: string;
  noOfOutputs: number;
  outputQuality?: number;
  aspectRatio: string;
  outputFormat: string;
  imageType: string;
};

// export interface VideoFeature {
//   title: string
//   description: string
//   url: string
//   ref: string
//   videoRef: Ref<HTMLVideoElement | undefined>
//   icon: string
// }

export interface IGenerateResponse {
  image: IImageObject;
  userCreditsRemaining: number;
}

export interface GalleryImage {
  url: string;
  prompt: string;
  aspectRatio: string;
}

export interface FeatureSelect {
  id: string;
  name: string;
  title: string;
  icon: string;
}

export interface GroupedObject {
  title: string;
  data: IImageObject[];
}

export interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_start: number;
  current_end: number;
  ended_at: number;
  quantity: number;
  notes: {
    [key: string]: string;
  };
  charge_at: number;
  start_at: number;
  end_at: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: boolean;
  created_at: number;
  expire_by: number;
  short_url: string;
  has_scheduled_changes: boolean;
  change_scheduled_at: number | null;
  source: string;
  offer_id: string;
  remaining_count: number;
}
export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: any[];
  created_at: number;
}
