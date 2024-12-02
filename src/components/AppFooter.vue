<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)

const currentYear = computed(() => new Date().getFullYear())

const footerLinks = [
  { text: 'Contact Us', path: '/contact', icon: 'fas fa-envelope' },
  { text: 'Privacy Policy', path: '/privacy', icon: 'fas fa-shield-alt' },
  { text: 'Terms of Service', path: '/terms', icon: 'fas fa-file-contract' },
  { text: 'Refund Policy', path: '/refund', icon: 'fas fa-hand-holding-usd' },
  { text: 'Pricing', path: '/pricing', icon: 'fas fa-tag' },
  { text: 'FAQ', path: '/faqs', icon: 'fas fa-question-circle' }
]
</script>

<template>
  <v-footer
    :color="route.path === '/' ? 'transparent' : isDark ? '#170220' : '#efebf3'"
    class="tw-w-full"
  >
    <div class="tw-w-full tw-max-w-7xl tw-mx-auto tw-px-4">
      <div class="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-between tw-w-full">
        <!-- Copyright Section -->
        <div class="tw-text-gray-400 tw-text-sm tw-mb-4 md:tw-mb-0">
          <span>&copy; {{ currentYear }} Visual AI</span>
          <span class="tw-hidden md:tw-inline-block tw-mx-2">|</span>
          <span class="tw-hidden md:tw-inline-block">All rights reserved</span>
        </div>

        <!-- Navigation Links -->
        <div class="tw-flex tw-flex-wrap tw-justify-center tw-gap-2 md:tw-gap-4">
          <v-btn
            v-for="(link, index) in footerLinks"
            :key="index"
            :to="link.path"
            variant="text"
            class="tw-text-gray-400 tw-text-sm tw-px-3"
            size="small"
          >
            <v-icon :icon="link.icon" size="small" class="tw-mr-2" />
            {{ link.text }}
          </v-btn>
        </div>
      </div>
    </div>
  </v-footer>
</template>
