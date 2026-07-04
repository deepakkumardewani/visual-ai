<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const { tab } = storeToRefs(appStore);

const tabs = [
  { id: 1, name: 'Create' },
  { id: 2, name: 'History' },
];

const activeTabIndex = computed(() => tabs.findIndex((t) => t.id === tab.value));
</script>

<template>
  <div class="tabs-container">
    <div class="tabs tw-bg-black/50">
      <button
        v-for="tabItem in tabs"
        :key="tabItem.id"
        @click="tab = tabItem.id"
        class="tab tw-text-neutral-400"
        :class="{ active: tab === tabItem.id }"
      >
        {{ tabItem.name }}
      </button>
      <div
        class="slider tw-bg-[#C9A84C] dark:tw-bg-[#C98A5A]"
        :style="{ transform: `translateX(${activeTabIndex * 100}%)` }"
      ></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabs-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0.5rem 0.5rem;
}

.tabs {
  position: relative;
  display: flex;
  width: 70%;
  border-radius: 9999px;
  padding: 0.25rem;
}

.tab {
  position: relative;
  width: 70%;
  z-index: 1;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.tab.active {
  color: #ffffff;
}

.slider {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  right: 0.25rem;
  bottom: 0.25rem;
  width: calc(50% - 0.25rem);
  border-radius: 9999px;
  transition: transform 0.3s ease;
}
</style>
