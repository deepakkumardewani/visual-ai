import type { ModelProvider } from '@/types/primitives';

import bflLogo from '@/assets/providers/bfl.svg';
import bytedanceLogo from '@/assets/providers/bytedance.svg';
import googleLogo from '@/assets/providers/google.svg';
import openaiLogo from '@/assets/providers/openai.svg';
import xaiLogo from '@/assets/providers/xai.svg';

export const KNOWN_PROVIDERS: readonly ModelProvider[] = [
  'openai',
  'google',
  'bfl',
  'bytedance',
  'xai',
  'pruna',
  'zimage',
  'community',
  'recraft',
  'topaz',
] as const;

/**
 * Brand marks sourced from Simple Icons (OpenAI, Google) and LobeHub icons
 * (BFL, ByteDance, xAI). Pruna and Z-Image have no public brand mark and
 * intentionally fall back to a lettermark.
 */
const PROVIDER_LOGOS: Partial<Record<ModelProvider, string>> = {
  openai: openaiLogo,
  google: googleLogo,
  bfl: bflLogo,
  bytedance: bytedanceLogo,
  xai: xaiLogo,
};

const PROVIDER_LABELS: Record<ModelProvider, string> = {
  openai: 'OpenAI',
  google: 'Google',
  bfl: 'BFL',
  bytedance: 'ByteDance',
  xai: 'xAI',
  pruna: 'Pruna',
  zimage: 'Z-Image',
  community: 'Community',
  recraft: 'Recraft',
  topaz: 'Topaz',
};

export function isKnownProvider(provider: string): provider is ModelProvider {
  return (KNOWN_PROVIDERS as readonly string[]).includes(provider);
}

export function getProviderLogo(provider: ModelProvider): string | undefined {
  return PROVIDER_LOGOS[provider];
}

export function getProviderLettermark(provider: string): string {
  if (isKnownProvider(provider)) {
    return PROVIDER_LABELS[provider].charAt(0).toUpperCase();
  }
  return provider.charAt(0).toUpperCase() || '?';
}
