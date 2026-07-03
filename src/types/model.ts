import type { ModelProvider, ModelTier } from "@/types/primitives";

export interface Model {
  title: string;
  id: string;
  provider: ModelProvider;
  description: string;
  bestAt?: string;
  tier: ModelTier;
  pricePerImage?: number;
  iconUrl?: string;
  icon?: string;
  isPro: boolean;
}
