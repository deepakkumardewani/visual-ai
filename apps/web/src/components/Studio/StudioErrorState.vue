<script setup lang="ts">
import { computed } from 'vue';

import { NO_CHARGE_SENTENCE } from '@/composables/useMediaJob';

const props = withDefaults(
  defineProps<{
    /** What happened, in plain words. */
    message: string;
    /** The failure cost nothing; the no-charge sentence is shown once even if `message` has it. */
    noCharge?: boolean;
    /** The single next step. */
    actionLabel?: string;
  }>(),
  { noCharge: true, actionLabel: 'Try again' },
);

defineEmits<{ action: [] }>();

const showNoChargeLine = computed(
  () => props.noCharge && !props.message.includes(NO_CHARGE_SENTENCE),
);
</script>

<template>
  <section
    role="alert"
    data-testid="studio-error-state"
    class="tw-flex tw-flex-col tw-items-start tw-gap-3 tw-rounded-card tw-border tw-border-border tw-bg-surface-1 tw-p-4"
  >
    <p class="tw-m-0 tw-text-sm tw-text-ink-primary">{{ message }}</p>
    <p v-if="showNoChargeLine" class="tw-m-0 tw-text-sm tw-text-ink-muted">
      {{ NO_CHARGE_SENTENCE }}
    </p>
    <button
      type="button"
      data-testid="studio-error-action"
      class="studio-btn"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </section>
</template>

<style scoped lang="scss">
.studio-btn {
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: 9999px;
  background: rgb(var(--studio-accent, var(--tw-ink-primary)));
  color: rgb(var(--tw-canvas));
  font-size: 0.875rem;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent, var(--tw-ink-primary)));
    outline-offset: 2px;
  }
}
</style>
