export type ModelTier = 'budget' | 'standard' | 'premium';

export type ModelProvider =
  | 'openai'
  | 'google'
  | 'bfl'
  | 'bytedance'
  | 'xai'
  | 'pruna'
  | 'zimage'
  | 'community'
  | 'recraft'
  | 'topaz'
  | 'minimax'
  | 'inworld'
  | 'stability'
  | 'resemble'
  | 'alibaba';

export interface SegmentedOption<T extends string | number = string> {
  label: string;
  value: T;
}
