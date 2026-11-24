<script setup lang="ts">
import { getModelDefinition, type TtsTagNode } from '@visual-ai/shared';
import { computed } from 'vue';

import AppModal from '@/components/AppModal.vue';
import { tagLabel } from '@/components/Speech/TagChipNode';

import type { PendingSwitch } from '@/composables/useTtsEditor';

const TITLE_ID = 'convert-tags-title';
const DESCRIPTION_ID = 'convert-tags-desc';

const props = defineProps<{ pending: PendingSwitch | null }>();
const emit = defineEmits<{ convert: []; keep: [] }>();

const targetLabel = computed(() =>
  props.pending ? getModelDefinition(props.pending.target).label : '',
);

function describe(tag: TtsTagNode): string {
  if (tag.type === 'pause') return `pause of ${tag.seconds} s`;
  if (tag.type === 'direction') return `direction "${tag.text}"`;
  return tagLabel(tag);
}
</script>

<template>
  <AppModal
    :open="pending !== null"
    max-width="30rem"
    :labelled-by="TITLE_ID"
    :described-by="DESCRIPTION_ID"
    trap-focus
    @close="emit('keep')"
  >
    <template #title>Switch to {{ targetLabel }}?</template>

    <div
      v-if="pending"
      :id="DESCRIPTION_ID"
      class="body convert-tags-body"
      data-testid="convert-tags-dialog"
    >
      <p class="copy">{{ targetLabel }} cannot express some of the tags in your text.</p>
      <section v-if="pending.conversion.approximated.length">
        <h3 class="heading">Approximated</h3>
        <ul class="list" data-testid="convert-approximated">
          <li v-for="(tag, index) in pending.conversion.approximated" :key="index">
            {{ describe(tag) }}
            <template v-if="pending.conversion.suggestedEmotion">
              becomes the Emotion setting: {{ pending.conversion.suggestedEmotion }}
            </template>
          </li>
        </ul>
      </section>
      <section v-if="pending.conversion.dropped.length">
        <h3 class="heading">Removed</h3>
        <ul class="list" data-testid="convert-dropped">
          <li v-for="(tag, index) in pending.conversion.dropped" :key="index">
            {{ describe(tag) }}
          </li>
        </ul>
      </section>
      <p class="copy">Convert changes your text now. You can undo it right after.</p>
    </div>

    <template #actions>
      <button
        type="button"
        class="modal-btn modal-btn--ghost"
        data-testid="convert-keep"
        @click="emit('keep')"
      >
        Keep original
      </button>
      <button
        type="button"
        class="modal-btn modal-btn--primary"
        data-testid="convert-apply"
        @click="emit('convert')"
      >
        Convert
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.copy {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}

.heading {
  margin: 0 0 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.9rem;
  color: rgb(var(--tw-ink-primary));
}

.modal-btn {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid rgb(var(--tw-ink-primary));
    outline-offset: 2px;
  }

  &--ghost {
    border: 1px solid rgb(var(--tw-border));
    color: rgb(var(--tw-ink-primary));
  }

  &--primary {
    border: 1px solid transparent;
    background: rgb(var(--tw-accent));
    color: rgb(var(--tw-canvas));
  }
}
</style>

<style lang="scss">
/* AppModal's close button is 40px; touch targets need 44px on small screens. */
@media (max-width: 640px) {
  .app-modal:has(.convert-tags-body) .app-modal__close {
    width: 2.75rem;
    height: 2.75rem;
  }
}
</style>
