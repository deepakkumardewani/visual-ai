import type { ModelProvider } from "@/types/primitives";

import bflLogo from "@/assets/models/bfl.svg";
import bytedanceLogo from "@/assets/models/bytedance.svg";
import googleLogo from "@/assets/models/google.svg";
import openaiLogo from "@/assets/models/openai.svg";
import prunaLogo from "@/assets/models/pruna.svg";
import xaiLogo from "@/assets/models/xai.svg";
import zimageLogo from "@/assets/models/zimage.svg";

export const KNOWN_PROVIDERS: readonly ModelProvider[] = [
  "openai",
  "google",
  "bfl",
  "bytedance",
  "xai",
  "pruna",
  "zimage",
] as const;

const PROVIDER_LOGOS: Record<ModelProvider, string> = {
  openai: openaiLogo,
  google: googleLogo,
  bfl: bflLogo,
  bytedance: bytedanceLogo,
  xai: xaiLogo,
  pruna: prunaLogo,
  zimage: zimageLogo,
};

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: "OpenAI",
  google: "Google",
  bfl: "BFL",
  bytedance: "ByteDance",
  xai: "xAI",
  pruna: "Pruna",
  zimage: "Z-Image",
};

export function isKnownProvider(provider: string): provider is ModelProvider {
  return (KNOWN_PROVIDERS as readonly string[]).includes(provider);
}

export function getProviderLogo(provider: ModelProvider): string {
  return PROVIDER_LOGOS[provider];
}

export function getProviderLettermark(provider: string): string {
  if (isKnownProvider(provider)) {
    return PROVIDER_LABELS[provider].charAt(0).toUpperCase();
  }
  return provider.charAt(0).toUpperCase() || "?";
}
