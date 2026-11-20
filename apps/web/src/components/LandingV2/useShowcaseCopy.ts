import { computed, onBeforeUnmount, ref } from 'vue';

import { useShareActions } from '@/composables/useShareActions';
import { createLogger } from '@/utils/logger';
import { copyText } from '@/utils/share';

export type CopyState = 'idle' | 'copied' | 'failed';

/** How long the button keeps saying "Copied" or "Couldn't copy" before it resets. */
const FEEDBACK_MS = 2200;

const COPY_LABELS: Record<CopyState, string> = {
  idle: 'Copy prompt',
  copied: 'Copied',
  failed: "Couldn't copy",
};

const FAILURE_TOAST = 'Could not copy prompt';

const log = createLogger('showcase-copy');

/**
 * Copy one prompt with feedback on the button itself. Success is confirmed by
 * the label alone; a second, louder toast would compete with it. A failure
 * also raises the app toast and is logged, since the visitor may need to copy
 * by hand.
 */
export function useShowcaseCopy() {
  const { showToast } = useShareActions();
  const state = ref<CopyState>('idle');
  const label = computed(() => COPY_LABELS[state.value]);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  function reset(): void {
    clearTimeout(resetTimer);
    state.value = 'idle';
  }

  async function copy(prompt: string): Promise<void> {
    const ok = await copyText(prompt.trim());
    if (!ok) {
      log.error('copy prompt failed', { promptLength: prompt.length });
      showToast(FAILURE_TOAST);
    }
    state.value = ok ? 'copied' : 'failed';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(reset, FEEDBACK_MS);
  }

  onBeforeUnmount(() => clearTimeout(resetTimer));

  return { state, label, copy, reset };
}
