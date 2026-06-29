<script lang="ts" setup>
import { ref, watch } from "vue";

const props = defineProps<{
  number: number;
  animate?: boolean;
}>();

const displayNumber = ref(props.number);
let interval: number | undefined;

watch(
  () => props.number,
  (newValue) => {
    if (!props.animate) {
      displayNumber.value = newValue;
      return;
    }

    if (interval) {
      clearInterval(interval);
    }

    if (newValue === displayNumber.value) {
      return;
    }

    interval = window.setInterval(() => {
      const difference = newValue - displayNumber.value;
      if (Math.abs(difference) < 1) {
        displayNumber.value = newValue;
        clearInterval(interval);
        return;
      }

      const change = difference / 10;
      displayNumber.value += change >= 0 ? Math.ceil(change) : Math.floor(change);

      if (
        (change >= 0 && displayNumber.value >= newValue) ||
        (change < 0 && displayNumber.value <= newValue)
      ) {
        displayNumber.value = newValue;
        clearInterval(interval);
      }
    }, 20);
  },
);
</script>

<template>
  <span class="tw-text-lg">{{ displayNumber }}</span>
</template>
