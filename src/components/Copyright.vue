<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const currentYear = new Date().getFullYear()
</script>
<template>
  <div class="tw-text-black dark:tw-text-gray-400 tw-text-sm tw-mb-4 md:tw-mb-0">
    <div>
      &copy; {{ currentYear }}
      <span
        @click="router.push('/')"
        class="tw-cursor-pointer tw-bg-gradient-to-r dark:tw-from-purple-400 dark:tw-to-purple-600 tw-from-purple-900 tw-to-purple-800 tw-bg-clip-text tw-text-transparent"
        >Visual AI</span
      >
      <span class="tw-inline-block tw-mx-2">|</span>
      <span class="tw-inline-block">All rights reserved</span>
    </div>
  </div>
</template>
