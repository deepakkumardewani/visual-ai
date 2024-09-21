<script setup lang="ts">
import Accordion from '@/components/Accordion.vue'

defineProps({
  faqs: {
    type: Array as PropType<{ question: string; answer: string; active?: boolean }[]>,
    required: true
  }
})
</script>
<template>
  <div class="text-h3 tw-text-center ma-8">Frequently Asked Questions</div>

  <v-row justify="center">
    <v-col cols="12" sm="8">
      <Accordion
        v-for="(faq, index) in faqs"
        :title="faq.question"
        :id="`faqs-${index}`"
        :active="faq.active"
      >
        {{ faq.answer }}
      </Accordion>
    </v-col>
  </v-row>
</template>

<style scoped></style>
