<script setup lang="ts">
import type { TtsDoc } from '@visual-ai/shared';
import { computed } from 'vue';

import { useTtsAdvice } from '@/composables/useTtsAdvice';

const SPLIT_SUGGESTION =
  'Long scripts read better in parts. Split this one and generate each part.';
const ESTIMATE_NOTE =
  'Estimated: Minimax bills by tokens, which can differ slightly from the character count. The final cost is worked out from your text when you generate.';

const props = defineProps<{
  doc: TtsDoc;
  chars: number;
  limit: number;
  estimated: boolean;
  modelLabel: string;
}>();

const advice = useTtsAdvice({
  doc: () => props.doc,
  chars: () => props.chars,
  limit: () => props.limit,
  estimatedCost: () => props.estimated,
});

const warning = computed(() => {
  if (advice.level.value === 'over') {
    return `Over the ${props.modelLabel} limit by ${(-advice.remaining.value).toLocaleString()} characters. See the reason beside Generate.`;
  }
  if (advice.level.value === 'near') {
    return `${advice.remaining.value.toLocaleString()} characters left for ${props.modelLabel}.`;
  }
  return '';
});
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-1 tw-text-xs tw-text-ink-muted" data-testid="text-advisor">
    <p class="tw-m-0" data-testid="advisor-length">
      Estimated spoken length:
      <span class="tw-font-semibold tw-text-ink-secondary">{{ advice.spokenLabel.value }}</span>
    </p>
    <p
      v-if="warning"
      class="advisor-warning"
      :class="{ 'advisor-warning--over': advice.level.value === 'over' }"
      role="status"
      data-testid="advisor-warning"
    >
      {{ warning }}
    </p>
    <p v-if="advice.level.value !== 'ok'" class="tw-m-0" data-testid="advisor-split">
      {{ SPLIT_SUGGESTION }}
    </p>
    <p v-if="advice.isEstimated.value" class="tw-m-0" data-testid="advisor-estimate">
      {{ ESTIMATE_NOTE }}
    </p>
    <RouterLink to="/faqs" class="advisor-link" data-testid="advisor-faq">
      Speech questions and answers
    </RouterLink>
  </div>
</template>

<style scoped lang="scss">
.advisor-warning {
  margin: 0;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));

  &--over {
    color: rgb(var(--tw-danger, 190 40 30));
  }
}

.advisor-link {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 44px;
  color: rgb(var(--studio-accent));
  text-decoration: underline;

  &:focus-visible {
    outline: 2px solid rgb(var(--studio-accent));
    outline-offset: 2px;
  }
}
</style>
