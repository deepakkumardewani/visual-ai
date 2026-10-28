<script setup lang="ts">
import AppModal from '@/components/AppModal.vue';
import {
  VOICE_INPUT_DISCLOSURE_BODY,
  VOICE_INPUT_DISCLOSURE_CONFIRM,
  VOICE_INPUT_DISCLOSURE_TITLE,
} from '@/composables/voiceInputDisclosure';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  accept: [];
}>();
</script>

<template>
  <AppModal
    :open="open"
    max-width="28rem"
    labelled-by="voice-input-disclosure-title"
    described-by="voice-input-disclosure-desc"
    :show-close="false"
    :close-on-escape="false"
    :close-on-overlay="false"
  >
    <template #title>
      <span id="voice-input-disclosure-title">{{ VOICE_INPUT_DISCLOSURE_TITLE }}</span>
    </template>

    <p id="voice-input-disclosure-desc" class="voice-disclosure__copy">
      {{ VOICE_INPUT_DISCLOSURE_BODY }}
    </p>

    <template #actions>
      <button
        type="button"
        data-testid="voice-disclosure-accept"
        class="modal-btn modal-btn--primary"
        @click="emit('accept')"
      >
        {{ VOICE_INPUT_DISCLOSURE_CONFIRM }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.voice-disclosure__copy {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}
</style>
