import { storeToRefs } from 'pinia';
import { onBeforeUnmount, onMounted } from 'vue';

import { FeatureType } from '@/types';

import { useAppStore } from '@/stores/app';

import { trySubmitFeature } from '@/composables/useFeatureSubmit';

const COMPOSER_INPUT_SELECTOR = '[data-testid="composer-textarea-input"]';
const GENERATE_TAB = 1;

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

/**
 * Dashboard keyboard shortcuts:
 * - Cmd/Ctrl+Enter → submit active feature when valid and idle
 * - `/` → focus prompt textarea when not already typing in a field
 */
export function useGlobalShortcuts() {
  const appStore = useAppStore();
  const { tab, feature } = storeToRefs(appStore);

  function onKeydown(event: KeyboardEvent) {
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
