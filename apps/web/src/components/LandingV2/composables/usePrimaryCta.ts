import { computed, type ComputedRef } from 'vue';

import { useAuthStore } from '@/stores/auth';

const SIGNED_IN_CTA = { label: 'Open studio', to: '/create' } as const;
const SIGNED_OUT_CTA = { label: 'Start free', to: '/signin' } as const;

export interface PrimaryCta {
  label: ComputedRef<string>;
  to: ComputedRef<string>;
}

/** The auth-aware primary call to action shared by the landing scenes. */
export function usePrimaryCta(): PrimaryCta {
  const auth = useAuthStore();
  const current = computed(() => (auth.isSignedIn ? SIGNED_IN_CTA : SIGNED_OUT_CTA));
  return {
    label: computed(() => current.value.label),
    to: computed(() => current.value.to),
  };
}
