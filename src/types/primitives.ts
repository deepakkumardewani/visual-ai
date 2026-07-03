export type ModelTier = "budget" | "standard" | "premium";

export type ModelProvider = "openai" | "google" | "bfl" | "bytedance" | "xai" | "pruna" | "zimage";

export interface SegmentedOption<T extends string | number = string> {
  label: string;
  value: T;
}
