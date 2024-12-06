<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

import { useDialogStore } from '@/stores/dialog'
import { useUserStore } from '@/stores/user'

import AnimatedCounter from '@/components/Header/AnimatedCounter.vue'

const { smAndUp } = useDisplay()
const userStore = useUserStore()
const router = useRouter()
const { credits, isPro, hasJustSubscribed } = storeToRefs(userStore)
const dialogStore = useDialogStore()
</script>
<template>
  <v-menu :open-on-hover="smAndUp" location="bottom end" offset="5">
    <template v-slot:activator="{ props }">
      <div
        v-bind="props"
        class="tw-flex tw-items-center tw-p-4 tw-gap-3 tw-h-8 tw-justify-center tw-border-2 tw-border-[#3b0764] dark:tw-border-white tw-rounded-full"
      >
        <div v-if="smAndUp">
          <v-icon size="x-small" icon="$coin" />
        </div>
        <div class="tw-font-bold">
          <AnimatedCounter :number="credits" :animate="hasJustSubscribed" />
        </div>
      </div>
    </template>
    <v-card class="pa-3 text-center tw-text-sm">
      <div>
        <span class="tw-font-bold">{{ credits }}</span> credits left for today
      </div>
      <div>
        <template v-if="!isPro">
          <span
            @click="router.push('/pricing')"
            class="tw-text-yellow-600 dark:tw-text-yellow-500 tw-underline hover:tw-text-decoration-none tw-cursor-pointer"
            >Subscribe to Pro</span
          >
          for more or
        </template>
        <span
          @click="dialogStore.showBuyCredits"
          class="tw-text-yellow-600 dark:tw-text-yellow-500 tw-underline hover:tw-text-decoration-none tw-cursor-pointer"
          >Buy Credits</span
        >
      </div>
    </v-card>
  </v-menu>
</template>

<style scoped></style>
