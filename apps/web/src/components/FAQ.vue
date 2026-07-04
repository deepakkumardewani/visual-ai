<script setup lang="ts">
import Accordion from '@/components/Accordion.vue';

defineProps({
  faqs: {
    type: Array as PropType<{ question: string; answer: string; active?: boolean }[]>,
    required: true,
  },
});
</script>
<template>
  <div class="tw-text-center tw-text-2xl sm:tw-text-4xl tw-my-8">Frequently Asked Questions</div>

  <v-row justify="center">
    <v-col cols="10" sm="8">
      <Accordion
        v-for="(faq, index) in faqs"
        :key="index"
        :title="faq.question"
        :id="`faqs-${index}`"
        :active="faq.active"
      >
        <div v-html="faq.answer"></div>
      </Accordion>
    </v-col>
  </v-row>
</template>

<style scoped></style>
