<script setup lang="ts">
import { faCoins } from '@/plugins/icons';
import { useMediaQuery } from '@vueuse/core';
import { computed, nextTick, ref } from 'vue';

import { EXPENSIVE_JOB_CREDITS } from '@visual-ai/shared';

import AnimatedCounter from '@/components/Header/AnimatedCounter.vue';
import ConfirmChainActionDialog from '@/components/Dialogs/ConfirmChainActionDialog.vue';

const FALLBACK_DISABLED_REASON = 'Complete the required fields to generate.';
const CONFIRM_DIALOG_SELECTOR = '[aria-labelledby="chain-confirm-title"]';
const CANCEL_BUTTON_SELECTOR = '.modal-btn--ghost';
const REASON_ID = 'studio-action-reason';

const props = withDefaults(
  defineProps<{
    cost: number;
    estimated?: boolean;
    disabled?: boolean;
    disabledReason?: string;
    busy?: boolean;
  }>(),
  { estimated: false, disabled: false, disabledReason: '', busy: false },
);

const emit = defineEmits<{ generate: [] }>();

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
const confirmOpen = ref(false);

const isInactive = computed(() => props.disabled || props.busy);
const reason = computed(() => props.disabledReason || FALLBACK_DISABLED_REASON);
const needsConfirm = computed(() => props.cost >= EXPENSIVE_JOB_CREDITS);

// Focus lands on Cancel so an expensive job is never confirmed by a stray Enter.
async function focusCancel() {
  await nextTick();
  // Two frames: AppModal focuses its own panel in a rAF, which would otherwise win.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document
        .querySelector(CONFIRM_DIALOG_SELECTOR)
        ?.querySelector<HTMLElement>(CANCEL_BUTTON_SELECTOR)
        ?.focus();
    }),
  );
}

function onGenerate() {
  if (isInactive.value) return;
  if (!needsConfirm.value) {
    emit('generate');
    return;
  }
  confirmOpen.value = true;
  void focusCancel();
}

function onConfirm() {
  confirmOpen.value = false;
  emit('generate');
}
</script>

<template>
  <div class="action-bar" data-testid="studio-action-bar">
    <div class="action-bar__row">
      <div class="action-bar__cost" data-testid="studio-cost">
        <font-awesome-icon :icon="faCoins" aria-hidden="true" />
        <AnimatedCounter :number="cost" :animate="!prefersReducedMotion" />
        <span>credits</span>
        <span v-if="estimated" class="action-bar__tag">Estimated</span>
      </div>
      <button
        type="button"
        data-testid="studio-generate"
        class="action-bar__generate"
        :disabled="isInactive"
        :aria-busy="busy"
        :aria-describedby="disabled ? REASON_ID : undefined"
        @click="onGenerate"
      >
        {{ busy ? 'Generating...' : 'Generate' }}
      </button>
    </div>
    <p v-if="disabled" :id="REASON_ID" class="action-bar__reason" data-testid="studio-reason">
      {{ reason }}
    </p>
    <ConfirmChainActionDialog
      :open="confirmOpen"
      action-name="Generate"
      :credit-cost="cost"
      @close="confirmOpen = false"
      @confirm="onConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.action-bar {
  position: sticky;
  bottom: var(--mini-player-h, 0px);
  z-index: 10;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
  background: rgb(var(--tw-canvas));
  border-top: 1px solid rgb(var(--tw-border));

  @media (min-width: 1024px) {
    position: static;
    padding: 0;
    border-top: 0;
    background: transparent;
  }
}

.action-bar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.action-bar__cost {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: rgb(var(--studio-accent, var(--tw-ink-primary)));
}

.action-bar__tag {
  padding: 0.125rem 0.5rem;
  border: 1px solid currentColor;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.action-bar__generate {
  min-height: 44px;
  min-width: 8rem;
  padding: 0 1.5rem;
  border-radius: 9999px;
  background: rgb(var(--studio-accent, var(--tw-ink-primary)));
  color: rgb(var(--tw-canvas));
  font-weight: 600;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent, var(--tw-ink-primary)));
    outline-offset: 3px;
  }
}

.action-bar__reason {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: rgb(var(--tw-ink-muted));
}
</style>
