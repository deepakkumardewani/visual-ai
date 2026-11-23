import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { FeatureType } from '@/types';
import { isTypingContext } from '@visual-ai/shared';

import { useAppStore } from '@/stores/app';
import { usePlayerStore } from '@/stores/player';

import { trySubmitFeature } from '@/composables/useFeatureSubmit';

const COMPOSER_INPUT_SELECTOR = '[data-testid="composer-textarea-input"]';
const GENERATE_TAB = 1;
const SEEK_STEP_SEC = 5;
const OPEN_MODAL_SELECTOR = '[role="dialog"][aria-modal="true"]';
// Space and Enter activate these natively; handling Space again would toggle twice.
const NATIVE_ACTIVATION_SELECTOR =
  'button, a[href], summary, [role="button"], [role="slider"], video';

// Arrow keys belong to these composite widgets (tab/menu/slider navigation), not the player.
const ARROW_OWNER_SELECTOR = '[role="tablist"], [role="menu"], [role="slider"], [role="listbox"]';

/** Shared so the header icon button and the `?` key open the same shortcuts popover. */
export const shortcutsHelpOpen = ref(false);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
}

function focusComposerTextarea() {
  const el = document.querySelector<HTMLTextAreaElement>(COMPOSER_INPUT_SELECTOR);
  el?.focus();
}

function resolveFeatureId(feature: string): string {
  return feature || FeatureType.IMAGE;
}

function isMediaKeyBlocked(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return true;
  if (event.metaKey || event.ctrlKey || event.altKey) return true;
  return isTypingContext({
    target: event.target as HTMLElement | null,
    modalOpen: Boolean(document.querySelector(OPEN_MODAL_SELECTOR)),
  });
}

/** Handles the player shortcuts; returns true when the key was consumed. */
function handleMediaKey(event: KeyboardEvent, player: ReturnType<typeof usePlayerStore>): boolean {
  if (event.key === '?') {
    shortcutsHelpOpen.value = true;
    return true;
  }
  if (!player.track) return false;
  const target = event.target as HTMLElement | null;
  switch (event.key) {
    case ' ':
      if (target?.closest(NATIVE_ACTIVATION_SELECTOR)) return false;
      player.toggle();
      return true;
    case 'ArrowLeft':
      if (target?.closest(ARROW_OWNER_SELECTOR)) return false;
      player.seek(player.currentTime - SEEK_STEP_SEC);
      return true;
    case 'ArrowRight':
      if (target?.closest(ARROW_OWNER_SELECTOR)) return false;
      player.seek(player.currentTime + SEEK_STEP_SEC);
      return true;
    case 'm':
      player.setMuted(!player.muted);
      return true;
    case 'l':
      player.setLoop(!player.loop);
      return true;
    default:
      return false;
  }
}

/**
 * Dashboard keyboard shortcuts:
 * - Cmd/Ctrl+Enter → submit active feature when valid and idle
 * - `/` → focus prompt textarea when not already typing in a field
 * - Space, arrows, M, L, `?` → media player and shortcuts help (see MEDIA_SHORTCUTS), never while typing
 */
export function useGlobalShortcuts() {
  const appStore = useAppStore();
  const { tab, feature } = storeToRefs(appStore);
  const player = usePlayerStore();

  function onKeydown(event: KeyboardEvent) {
    if (!isMediaKeyBlocked(event) && handleMediaKey(event, player)) {
      event.preventDefault();
      return;
    }

    if (tab.value !== GENERATE_TAB) return;

    const isModEnter =
      (event.key === 'Enter' || event.code === 'Enter') && (event.metaKey || event.ctrlKey);

    if (isModEnter) {
      event.preventDefault();
      trySubmitFeature(resolveFeatureId(feature.value));
      return;
    }

    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      focusComposerTextarea();
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown);
  });
}
