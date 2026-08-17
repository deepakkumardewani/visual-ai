import { storeToRefs } from 'pinia';

import { useAppStore } from '@/stores/app';
import { createLogger } from '@/utils/logger';
import { copyText, shareOrCopyLink, type ShareLinkOptions } from '@/utils/share';

const log = createLogger('share-actions');

/**
 * Share link / copy prompt with the global app snackbar for feedback.
 * One implementation used by history, dialog, explore, and community cards.
 */
export function useShareActions() {
  const appStore = useAppStore();
  const { snackbar, snackbarText } = storeToRefs(appStore);

  function showToast(message: string) {
    snackbarText.value = message;
    snackbar.value = true;
  }

  async function shareLink(options: ShareLinkOptions) {
    const outcome = await shareOrCopyLink(options);
    if (outcome === 'copied') {
      showToast('Link copied');
      return outcome;
    }
    if (outcome === 'failed') {
      log.error('share failed', { url: options.url });
      showToast('Could not share link');
    }
    return outcome;
  }

  async function copyPrompt(prompt: string) {
    const trimmed = prompt?.trim() ?? '';
    if (!trimmed) {
      showToast('No prompt to copy');
      return false;
    }
    const ok = await copyText(trimmed);
    if (ok) {
      showToast('Prompt copied');
      return true;
    }
    log.error('copy prompt failed');
    showToast('Could not copy prompt');
    return false;
  }

  return {
    showToast,
    shareLink,
    copyPrompt,
  };
}
