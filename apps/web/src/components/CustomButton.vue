<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

defineProps<{
  title: string;
}>();
</script>
<template>
  <button
    @click="router.push('/dashboard')"
    class="tw-relative tw-py-1 tw-px-3 tw-mx-3 tw-rounded-lg tw-font-medium tw-text-sm tw-text-slate-100 tw-bg-gradient-to-b tw-from-[#19022e] tw-to-[#742cab] tw-shadow-[0px_0px_12px_#8c45ff]"
  >
    <div class="tw-absolute tw-inset-0">
      <div
        class="tw-rounded-lg tw-border-white/20 tw-absolute tw-inset-0 [mask-image:linear-gradient(to_bottom, black, transparent)]"
      ></div>
      <div
        class="tw-rounded-lg tw-border tw-absolute tw-inset-0 tw-border-white/40 [mask-image:linear-gradient(to_top, black, transparent)]"
      ></div>
      <div
        class="tw-absolute tw-inset-0 tw-shadow-[0_0_10px_rgb(140, 69, 255, 0.7)] tw-rounded-lg"
      ></div>
    </div>
    <span>{{ title }}</span>
  </button>
</template>

<style scoped></style>
