import type { IImageObject } from '@visual-ai/shared';

// Re-export shared types
export { FeatureType } from '@visual-ai/shared';

export type {
  IImage,
  ExploreFeedItem,
  ExploreFeedResponse,
  JobStatus,
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
  isDeleting: boolean;
}
