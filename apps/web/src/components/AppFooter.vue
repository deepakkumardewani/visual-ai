<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";

import { useAppStore } from "@/stores/app";

import Copyright from "@/components/Copyright.vue";

import { FOOTER_LINKS } from "@/utils/constants";

const route = useRoute();
const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
</script>

<template>
  <v-footer
    :color="route.path === '/' ? 'transparent' : isDark ? '#170220' : '#efebf3'"
    class="tw-w-full"
  >
    <div class="tw-w-full tw-max-w-7xl tw-mx-auto tw-px-4">
      <div class="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-between tw-w-full">
        <div class="tw-w-full md:tw-w-[30%] tw-flex tw-justify-center md:tw-justify-start">
          <Copyright />
        </div>

        <div class="tw-w-full md:tw-w-[70%]">
          <div class="tw-flex tw-flex-wrap tw-justify-center md:tw-justify-end tw-gap-2">
            <v-btn
              v-for="(link, index) in FOOTER_LINKS"
              :key="index"
              :to="link.path"
              variant="text"
              class="tw-text-black dark:tw-text-gray-400 tw-text-sm tw-px-3"
              size="small"
            >
              <font-awesome-icon :icon="link.icon" size="small" class="tw-mr-2" />
              {{ link.text }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </v-footer>
</template>
