<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { FeatureSelect } from '@/types';

import { useAppStore } from '@/stores/app';

import { FEATURES } from '@/utils/constants';
import { faChevronDown } from '@/plugins/icons';

import iconRegistry from '@/components/icons';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);

const features = ref<FeatureSelect[]>(FEATURES);
const feature = ref<FeatureSelect>(features.value[0]);
const isOpen = ref(false);
const triggerRef = ref<HTMLButtonElement | null>(null);
const rootRef = ref<HTMLElement | null>(null);
const itemRefs = ref<(HTMLButtonElement | null)[]>([]);

const activeIndex = computed(() => features.value.findIndex((f) => f.id === feature.value.id));

function iconComponent(iconKey: string) {
  const key = iconKey.replace('$', '');
  const lookup = isDark.value ? `${key}Dark` : key;
  return (iconRegistry as Record<string, unknown>)[lookup];
}

function resolveIcon(iconKey: string) {
  const base = iconKey.replace('$', '');
  const lookup = isDark.value ? `${base}Dark` : base;
  return (iconRegistry as Record<string, unknown>)[lookup] ?? iconRegistry[base];
}

onClickOutside(rootRef, () => {
  isOpen.value = false;
});

onMounted(() => {
  if (route.path === '/dashboard') {
    const featureId = route.query.feature as string;
    if (featureId) {
      const selectedFeature = features.value.find((f) => f.id === featureId);
      if (selectedFeature) {
        feature.value = selectedFeature;
        appStore.setFeature(selectedFeature.id);
      }
    } else {
      appStore.setFeature(feature.value.id);
      router.replace({ query: { ...route.query, feature: feature.value.id } });
    }
  }
});

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => itemRefs.value[activeIndex.value]?.focus());
  }
}

function handleSelected(item: FeatureSelect) {
  feature.value = item;
  appStore.setFeature(item.id);
  router.replace({ query: { ...route.query, feature: item.id } });
  isOpen.value = false;
  triggerRef.value?.focus();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
    event.preventDefault();
    isOpen.value = true;
    nextTick(() => itemRefs.value[activeIndex.value]?.focus());
  }
}

function onItemKeydown(event: KeyboardEvent, index: number) {
  const lastIndex = features.value.length - 1;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const next = index === lastIndex ? 0 : index + 1;
    itemRefs.value[next]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const prev = index === 0 ? lastIndex : index - 1;
    itemRefs.value[prev]?.focus();
  } else if (event.key === 'Home') {
    event.preventDefault();
    itemRefs.value[0]?.focus();
  } else if (event.key === 'End') {
    event.preventDefault();
    itemRefs.value[lastIndex]?.focus();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    isOpen.value = false;
    triggerRef.value?.focus();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleSelected(features.value[index]);
  }
}

// Keep the unused symbol referenced for type-checker
void iconComponent;
</script>

<template>
  <div ref="rootRef" class="feature-select tw-relative">
    <button
      ref="triggerRef"
      type="button"
      data-testid="feature-select-trigger"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      class="feature-select__trigger tw-flex tw-h-10 tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-border/60 tw-bg-surface-1/50 tw-pl-3 tw-pr-2 tw-text-left tw-transition-colors tw-duration-fast hover:tw-border-accent/40 hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-accent"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span
        class="feature-select__icon tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-text-accent"
      >
        <component :is="resolveIcon(feature.icon)" />
      </span>
      <span
        class="feature-select__label tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-font-medium tw-text-ink-primary"
      >
        {{ feature.title }}
      </span>
      <span
        class="tw-flex tw-h-6 tw-w-6 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-sm tw-bg-surface-2/80 tw-text-ink-muted tw-transition-transform tw-duration-fast"
        :class="{ 'tw-rotate-180': isOpen }"
        aria-hidden="true"
      >
        <font-awesome-icon :icon="faChevronDown" class="tw-text-[0.625rem]" />
      </span>
    </button>

    <transition name="feature-select-fade">
      <div
        v-if="isOpen"
        role="listbox"
        data-testid="feature-select-menu"
        class="feature-select__panel tw-absolute tw-left-0 tw-top-full tw-z-50 tw-mt-2 tw-min-w-[17rem] tw-overflow-hidden tw-rounded-md tw-border tw-border-border tw-bg-surface-1 tw-p-1.5 tw-shadow-elevated"
      >
        <button
          v-for="(item, index) in features"
          :key="item.id"
          :ref="(el) => (itemRefs[index] = el as HTMLButtonElement | null)"
          type="button"
          role="option"
          :aria-selected="item.id === feature.id"
          :data-testid="`feature-select-option-${item.id}`"
          class="feature-select__item tw-flex tw-w-full tw-items-center tw-gap-3 tw-rounded-sm tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-2.5 tw-text-left tw-text-sm tw-text-ink-primary tw-transition-colors tw-duration-fast hover:tw-bg-surface-2 focus-visible:tw-bg-surface-2 focus-visible:tw-outline-none"
          :class="{ 'feature-select__item--active tw-bg-surface-2/60': item.id === feature.id }"
          @click="handleSelected(item)"
          @keydown="onItemKeydown($event, index)"
        >
          <span class="tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-text-accent">
            <component :is="resolveIcon(item.icon)" />
          </span>
          <span class="tw-min-w-0 tw-flex-1 tw-truncate tw-font-medium">{{ item.title }}</span>
          <span
            v-if="item.id === feature.id"
            class="feature-select__check tw-h-1.5 tw-w-1.5 tw-shrink-0 tw-rounded-full tw-bg-gold"
            aria-hidden="true"
          />
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.feature-select__icon :deep(svg),
.feature-select__item span:first-child :deep(svg) {
  width: 18px;
  height: 18px;
}

.feature-select__item--active {
  color: #c9a84c;
}

:global(html:not(.tw-dark)) .feature-select__item--active {
  color: #9e7d35;
}

.feature-select-fade-enter-active,
.feature-select-fade-leave-active {
  transition:
    opacity 150ms ease-out,
    transform 150ms ease-out;
}

.feature-select-fade-enter-from,
.feature-select-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
