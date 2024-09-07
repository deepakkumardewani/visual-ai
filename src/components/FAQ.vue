<script setup lang="ts">
defineProps({
  faqs: {
    type: Array as PropType<{ question: string; answer: string }[]>,
    required: true
  }
})
</script>
<template>
  <div class="text-h3 tw-text-center ma-8">Frequently Asked Questions</div>

  <v-row justify="center">
    <v-col cols="8">
      <v-expansion-panels>
        <v-expansion-panel
          v-for="(faq, index) in faqs"
          :key="index"
          :text="faq.answer"
          :title="faq.question"
        ></v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<style scoped></style>
