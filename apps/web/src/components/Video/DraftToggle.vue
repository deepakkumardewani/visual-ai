<script setup lang="ts">
defineProps<{
  /** Credits a draft saves against the full render; hidden state is the parent's `v-if`. */
  saving: number;
}>();

const draft = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="toggle" data-testid="draft-toggle">
    <input
      v-model="draft"
      type="checkbox"
      role="switch"
      class="toggle__input"
      aria-describedby="draft-toggle-hint"
    />
    <span class="toggle__text">
      <span class="tw-text-sm tw-font-semibold tw-text-ink-primary">Draft preview</span>
      <span id="draft-toggle-hint" class="tw-text-xs tw-text-ink-muted" data-testid="draft-saving">
        Lower quality, saves {{ saving }} {{ saving === 1 ? 'credit' : 'credits' }}
      </span>
    </span>
  </label>
</template>

<style scoped lang="scss">
.toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border: 1px solid rgb(var(--tw-border));
  border-radius: 0.75rem;
  cursor: pointer;

  &:has(.toggle__input:checked) {
    border-color: rgb(var(--studio-accent));
  }

  &:has(.toggle__input:focus-visible) {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}

.toggle__input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: rgb(var(--studio-accent));
}

.toggle__text {
  display: flex;
  flex-direction: column;
}
</style>
