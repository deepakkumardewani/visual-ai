<script setup lang="ts">
import FAQ from "@/components/FAQ.vue";

import { GENERAL_FAQS } from "@/utils/constants";
</script>
<template>
  <div class="tw-max-w-screen-lg tw-mx-auto">
    <FAQ :faqs="GENERAL_FAQS" />
  </div>
</template>

<style scoped></style>
