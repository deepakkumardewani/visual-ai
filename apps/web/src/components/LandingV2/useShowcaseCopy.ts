import { computed, onBeforeUnmount, ref } from 'vue';

import { useShareActions } from '@/composables/useShareActions';

export type CopyState = 'idle' | 'copied' | 'failed';

/** How long the button keeps saying "Copied" or "Couldn't copy" before it resets. */
const FEEDBACK_MS = 2200;

const COPY_LABELS: Record<CopyState, string> = {
  idle: 'Copy prompt',
  copied: 'Copied',
  failed: "Couldn't copy",
};

/**
 * Copy one prompt with inline feedback on the button itself. The global toast
 * and error logging come from `useShareActions`, so a failed copy is shown to
 * the visitor twice (toast and button label) and logged once.
 */
export function useShowcaseCopy() {
  const { copyPrompt } = useShareActions();
  const state = ref<CopyState>('idle');
  const label = computed(() => COPY_LABELS[state.value]);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function copy(prompt: string): Promise<void> {
    const ok = await copyPrompt(prompt);
    state.value = ok ? 'copied' : 'failed';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      state.value = 'idle';
    }, FEEDBACK_MS);
  }

  onBeforeUnmount(() => clearTimeout(resetTimer));

  return { state, label, copy };
}
