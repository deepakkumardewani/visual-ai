<script setup lang="ts">
import type { PropType } from 'vue';

import Accordion from '@/components/Accordion.vue';

defineProps({
  faqs: {
    type: Array as PropType<{ question: string; answer: string; active?: boolean }[]>,
    required: true,
  },
});
</script>

<template>
  <div class="tw-my-8 tw-text-center tw-font-display tw-text-2xl sm:tw-text-4xl">
    Frequently Asked Questions
  </div>

  <div class="tw-flex tw-justify-center">
    <div class="tw-w-10/12 tw-px-3 sm:tw-w-8/12">
      <Accordion
        v-for="(faq, index) in faqs"
        :id="`faqs-${index}`"
        :key="index"
        :title="faq.question"
        :active="faq.active"
      >
        <div v-html="faq.answer"></div>
      </Accordion>
    </div>
  </div>
</template>
