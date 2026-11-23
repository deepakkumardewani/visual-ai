<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ seconds: number }>();

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const pad = (value: number) => String(value).padStart(2, '0');

/** m:ss, or h:mm:ss once past an hour; non-finite or negative input reads as 0:00. */
const formatted = computed(() => {
  const total = Number.isFinite(props.seconds) ? Math.max(0, Math.floor(props.seconds)) : 0;
  const hours = Math.floor(total / SECONDS_PER_HOUR);
  const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const secs = total % SECONDS_PER_MINUTE;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
});
</script>

<template>
  <time class="tw-tabular-nums" data-testid="time-code" :datetime="`PT${Math.floor(seconds)}S`">
    {{ formatted }}
  </time>
</template>
