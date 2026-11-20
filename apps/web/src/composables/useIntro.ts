import { CURRENT_INTRO_VERSION } from '@visual-ai/shared';
import { useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';

import { useUserStore } from '@/stores/user';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('intro');

const INTRO_SEEN_KEY_PREFIX = 'intro-seen:';
const INTRO_SEEN_FLAG = '1';
const INTRO_SEEN_PATH = '/users/intro-seen';
const PERSIST_ATTEMPTS = 2;

/** Shared so the user menu and the dashboard mount point drive one modal. */
const isOpen = ref(false);
/** A manual reopen must never write to the DB (the account has already seen it). */
let openedManually = false;

function seenKey(userId: string): string {
  return `${INTRO_SEEN_KEY_PREFIX}${userId}`;
}

function readSeenFlag(userId: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(userId)) === INTRO_SEEN_FLAG;
  } catch {
    return false;
  }
}

function writeSeenFlag(userId: string): void {
  try {
    window.localStorage.setItem(seenKey(userId), INTRO_SEEN_FLAG);
  } catch (error) {
    log.warn('could not write intro-seen flag', { error });
  }
}

async function putIntroSeen(): Promise<boolean> {
  const { error } = await useFetch(INTRO_SEEN_PATH, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: CURRENT_INTRO_VERSION }),
  }).json();
  return !error.value;
}

export function useIntro() {
  const userStore = useUserStore();
  const { userId, userDetails, isReady } = storeToRefs(userStore);

  function shouldAutoShow(): boolean {
    if (!userId.value) return false;
    if (readSeenFlag(userId.value)) return false;
    if (!isReady.value || !userDetails.value) return false;
    return userDetails.value.seenIntroVersion !== CURRENT_INTRO_VERSION;
  }

  function evaluate(): void {
    if (isOpen.value || !shouldAutoShow()) return;
    openedManually = false;
    isOpen.value = true;
  }

  /** Reopen from the user menu regardless of seen state; writes nothing. */
  function open(): void {
    openedManually = true;
    isOpen.value = true;
  }

  async function persistSeen(): Promise<void> {
    for (let attempt = 1; attempt <= PERSIST_ATTEMPTS; attempt += 1) {
      try {
        if (await putIntroSeen()) {
          if (userDetails.value) userDetails.value.seenIntroVersion = CURRENT_INTRO_VERSION;
          return;
        }
      } catch (error) {
        log.error('intro-seen PUT threw', { error, attempt });
      }
    }
    log.error('intro-seen PUT failed; localStorage guard stays', { userId: userId.value });
  }

  /** Close the modal and record it as seen: localStorage first, then the API. */
  async function dismiss(): Promise<void> {
    isOpen.value = false;
    if (openedManually || !userId.value) return;
    writeSeenFlag(userId.value);
    await persistSeen();
  }

  /** Mount-point hook: shows the intro once the dashboard and profile are ready. */
  function useAutoShow(): void {
    onMounted(() => {
      evaluate();
      watch([userId, userDetails, isReady], evaluate);
    });
    // A second tab that dismissed the intro closes this one.
    useEventListener(window, 'storage', (event: StorageEvent) => {
      if (event.key === seenKey(userId.value) && event.newValue === INTRO_SEEN_FLAG) {
        isOpen.value = false;
      }
    });
  }

  return { isOpen, open, dismiss, useAutoShow };
}
