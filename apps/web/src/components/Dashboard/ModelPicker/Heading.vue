<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <p class="tw-my-2 tw-text-sm tw-font-semibold tw-text-ink text-heading">
    {{ title }}
  </p>
</template>
