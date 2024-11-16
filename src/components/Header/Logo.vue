<script setup lang="ts">
import { SignedOut } from 'vue-clerk'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
</script>
<template>
  <div class="tw-cursor-pointer tw-flex tw-gap-3" @click="router.push('/')">
    <div class="ml-4">
      <img src="/src/assets/logo.png" width="30" height="30" />
    </div>
    <SignedOut>
      <div class="tw-text-xl" v-if="route.path !== '/dashboard'">
        <span
          class="tw-bg-gradient-to-r tw-from-purple-400 tw-to-purple-600 tw-bg-clip-text tw-text-transparent"
          >Visual AI</span
        >
        <span
          class="trademark tw-bg-gradient-to-r tw-from-purple-400 tw-to-purple-600 tw-bg-clip-text tw-text-transparent"
          >TM</span
        >
      </div>
    </SignedOut>
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
