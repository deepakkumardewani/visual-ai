<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
</script>
<template>
  <div class="tw-cursor-pointer tw-flex tw-gap-3" @click="router.push('/')">
    <div class="ml-4">
      <img src="/src/assets/logo.png" width="35" height="35" />
    </div>
    <div class="tw-text-3xl" v-if="route.path !== '/dashboard'">
      <span
        class="tw-bg-gradient-to-r dark:tw-from-purple-400 dark:tw-to-purple-600 tw-from-purple-900 tw-to-purple-800 tw-bg-clip-text tw-text-transparent"
        >Visual AI</span
      >
      <span
        class="trademark tw-bg-gradient-to-r dark:tw-from-purple-400 dark:tw-to-purple-600 tw-from-purple-900 tw-to-purple-800 tw-bg-clip-text tw-text-transparent"
        >TM</span
      >
    </div>
  </div>
</template>

<style scoped>
.trademark {
  padding-top: 1px;
  font-size: 7px;
  margin-top: 5.5px;
  font-weight: bold;
  display: inline-block;
  vertical-align: top;
  padding: 0;
  line-height: 1;
  text-align: left;
}
</style>
