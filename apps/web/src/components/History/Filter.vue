<script setup lang="ts">
import {
  faCheck,
  faCheckSquare,
  faChevronDown,
  faSearch,
  faSquare,
  faXmark,
} from '@/plugins/icons';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { useHistoryStore } from '@/stores/history';

import Popover from '@/components/primitives/Popover.vue';

import { IMAGE_SIZE_OPTIONS } from '@/utils/constants';

const FEATURE_TYPE_OPTIONS = [
  { id: 'image', title: 'Text-to-Image' },
  { id: 'upscale', title: 'Upscale' },
  { id: 'colorize', title: 'Colorize' },
  { id: 'revive', title: 'Revive' },
];

const { selectedSize, selectedFeatureTypes, searchQuery } = storeToRefs(useHistoryStore());

const sizeOpen = ref(false);

const sizeLabel = computed(
  () => IMAGE_SIZE_OPTIONS.find((size) => size.value === selectedSize.value)?.title ?? 'Size',
);

const typeLabel = computed(() => {
  const count = selectedFeatureTypes.value.length;
  if (count === 0) return 'All types';
  if (count === 1) {
    return (
      FEATURE_TYPE_OPTIONS.find((type) => type.id === selectedFeatureTypes.value[0])?.title ??
      '1 type'
    );
  }
  return `${count} types`;
});

function selectSize(value: string) {
  selectedSize.value = value;
  sizeOpen.value = false;
}

function isTypeSelected(id: string) {
  return selectedFeatureTypes.value.includes(id);
}

function toggleFeatureType(id: string) {
  selectedFeatureTypes.value = isTypeSelected(id)
    ? selectedFeatureTypes.value.filter((type) => type !== id)
    : [...selectedFeatureTypes.value, id];
}
</script>

<template>
  <div class="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-2.5 sm:tw-w-auto">
    <div class="search-field" data-testid="history-search">
      <font-awesome-icon
        :icon="faSearch"
        class="tw-h-3.5 tw-w-3.5 tw-shrink-0 tw-text-ink-faint"
        aria-hidden="true"
      />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search prompts"
        aria-label="Search by prompt"
        class="search-field__input"
      />
      <button
        v-if="searchQuery"
        type="button"
        aria-label="Clear search"
        class="tw-shrink-0 tw-rounded-full tw-p-1 tw-text-ink-faint tw-transition-colors tw-duration-fast hover:tw-text-ink"
        @click="searchQuery = ''"
      >
        <font-awesome-icon :icon="faXmark" class="tw-h-3 tw-w-3" aria-hidden="true" />
      </button>
    </div>

    <Popover placement="bottom-end" data-testid="history-type-filter">
      <template #trigger>
        <span class="tw-flex tw-items-center tw-gap-2 tw-text-sm">
          <span class="tw-text-ink-faint">Type</span>
          <span class="tw-font-medium">{{ typeLabel }}</span>
          <font-awesome-icon
            :icon="faChevronDown"
            class="tw-h-2.5 tw-w-2.5 tw-text-ink-faint"
            aria-hidden="true"
          />
        </span>
      </template>
      <div role="group" aria-label="Filter by feature" class="tw-flex tw-flex-col tw-gap-0.5">
        <button
          v-for="type in FEATURE_TYPE_OPTIONS"
          :key="type.id"
          type="button"
          class="menu-item"
          :aria-pressed="isTypeSelected(type.id)"
          @click="toggleFeatureType(type.id)"
        >
          <font-awesome-icon
            :icon="isTypeSelected(type.id) ? faCheckSquare : faSquare"
            class="tw-h-3.5 tw-w-3.5"
            :class="isTypeSelected(type.id) ? 'tw-text-accent' : 'tw-text-ink-faint'"
            aria-hidden="true"
          />
          {{ type.title }}
        </button>
      </div>
    </Popover>

    <Popover v-model:open="sizeOpen" placement="bottom-end" data-testid="history-size-select">
      <template #trigger>
        <span class="tw-flex tw-items-center tw-gap-2 tw-text-sm">
          <span class="tw-text-ink-faint">Size</span>
          <span class="tw-font-medium">{{ sizeLabel }}</span>
          <font-awesome-icon
            :icon="faChevronDown"
            class="tw-h-2.5 tw-w-2.5 tw-text-ink-faint"
            aria-hidden="true"
          />
        </span>
      </template>
      <div role="listbox" aria-label="Image size" class="tw-flex tw-flex-col tw-gap-0.5">
        <button
          v-for="size in IMAGE_SIZE_OPTIONS"
          :key="size.value"
          type="button"
          role="option"
          :aria-selected="selectedSize === size.value"
          class="menu-item tw-justify-between"
          :class="{
            'tw-hidden sm:tw-flex': size.value === 'mini' || size.value === 'small',
          }"
          @click="selectSize(size.value)"
        >
          {{ size.title }}
          <font-awesome-icon
            v-if="selectedSize === size.value"
            :icon="faCheck"
            class="tw-h-3 tw-w-3 tw-text-accent"
            aria-hidden="true"
          />
        </button>
      </div>
    </Popover>
  </div>
</template>

<style scoped lang="scss">
.search-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  width: 100%;
  padding: 0 0.75rem;
  border: 1px solid rgb(var(--tw-hairline));
  border-radius: 9999px;
  background: rgb(var(--tw-surface-1));
  transition: border-color 0.15s ease;

  &:focus-within {
    border-color: rgba(201, 138, 90, 0.4);
  }

  @media (min-width: 640px) {
    width: 14rem;
  }
}

.search-field__input {
  min-width: 0;
  flex: 1;
  background: transparent;
  font-size: 0.875rem;
  color: rgb(var(--tw-ink));

  &::placeholder {
    color: rgb(var(--tw-ink-faint));
  }

  &:focus {
    outline: none;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: rgb(var(--tw-ink));
  text-align: left;
  transition: background-color 0.15s ease;

  &:hover,
  &:focus-visible {
    background: rgb(var(--tw-surface-2));
  }
}
</style>
