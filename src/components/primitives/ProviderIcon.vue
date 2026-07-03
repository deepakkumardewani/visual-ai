<script setup lang="ts">
import { computed, ref } from "vue";

import { getProviderLettermark, getProviderLogo, isKnownProvider } from "@/utils/providerLogos";

const props = defineProps<{
  provider: string;
  size?: "sm" | "md";
}>();

const imageFailed = ref(false);

const hasLogo = computed(() => isKnownProvider(props.provider) && !imageFailed.value);
const logoSrc = computed(() =>
  isKnownProvider(props.provider) ? getProviderLogo(props.provider) : "",
);
const lettermark = computed(() => getProviderLettermark(props.provider));

const sizeClass = computed(() =>
  props.size === "sm" ? "tw-h-6 tw-w-6 tw-text-[10px]" : "tw-h-8 tw-w-8 tw-text-xs",
);

const onImageError = () => {
  imageFailed.value = true;
};
</script>

<template>
  <span
    class="tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-chip"
    :class="sizeClass"
    role="img"
    :aria-label="`${provider} provider icon`"
  >
    <img
      v-if="hasLogo"
      :src="logoSrc"
      :alt="`${provider} logo`"
      class="tw-h-full tw-w-full tw-object-cover"
      @error="onImageError"
    />
    <span
      v-else
      class="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-chip tw-bg-gradient-to-br tw-from-accent tw-to-gold tw-font-bold tw-text-canvas"
    >
      {{ lettermark }}
    </span>
  </span>
</template>
