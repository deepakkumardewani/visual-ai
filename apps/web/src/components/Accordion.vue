<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';

const accordionOpen = shallowRef(false);

const props = defineProps<{
  title: string;
  id: string;
  active?: boolean;
}>();

onMounted(() => {
  accordionOpen.value = Boolean(props.active);
});
</script>

<template>
  <div class="py-2 border-b tw-border-[rgb(var(--tw-hairline))]">
    <h2>
      <button
        :id="`accordion-title-${id}`"
        class="tw-flex tw-items-center tw-justify-between tw-w-full tw-text-left tw-font-semibold tw-py-2 tw-text-[rgb(var(--tw-ink-primary))]"
        @click.prevent="accordionOpen = !accordionOpen"
        :aria-expanded="accordionOpen"
        :aria-controls="`accordion-text-${id}`"
      >
        <span>{{ title }}</span>
        <svg
          class="tw-fill-[#C9A84C] tw-shrink-0 tw-ml-8"
          width="16"
          height="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            class="tw-transform tw-origin-center tw-transition tw-duration-200 tw-ease-out"
            :class="{ '!tw-rotate-180': accordionOpen }"
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            class="tw-transform tw-origin-center tw-rotate-90 tw-transition tw-duration-200 tw-ease-out"
            :class="{ '!tw-rotate-180': accordionOpen }"
          />
        </svg>
      </button>
    </h2>
    <div
      :id="`accordion-text-${id}`"
      role="region"
      :aria-labelledby="`accordion-title-${id}`"
      class="tw-grid tw-text-sm tw-text-[rgb(var(--tw-ink-secondary))] tw-overflow-hidden tw-transition-all tw-duration-300 tw-ease-in-out"
      :class="
        accordionOpen ? 'tw-grid-rows-[1fr] tw-opacity-100' : 'tw-grid-rows-[0fr] tw-opacity-0'
      "
    >
      <div class="overflow-hidden">
        <p class="tw-pb-3">
          <slot />
        </p>
      </div>
    </div>
  </div>
</template>
