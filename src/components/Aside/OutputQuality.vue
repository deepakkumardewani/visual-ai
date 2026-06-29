<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { VBtnToggle } from "vuetify/components";

import { useAppStore } from "@/stores/app";
import { useAsideStore } from "@/stores/aside";
import { useUserStore } from "@/stores/user";

import Heading from "@/components/Aside/Heading.vue";

const appStore = useAppStore();
const userStore = useUserStore();
const asideStore = useAsideStore();
const { isDark } = storeToRefs(appStore);
const { isPro } = storeToRefs(userStore);
const { outputQuality } = storeToRefs(asideStore);

const vSelectLightColor = ref("#9333ea");
const vSelectDarkColor = ref("#6b21a8");
</script>
<template>
  <Heading title="Quality" />
  <v-btn-toggle
    v-model="outputQuality"
    mandatory
    variant="outlined"
    density="compact"
    block
    divided
  >
    <v-btn :color="isDark ? vSelectLightColor : vSelectDarkColor"> SD </v-btn>
    <v-btn :color="isDark ? vSelectLightColor : vSelectDarkColor"
      >HD
      <template v-if="!isPro" v-slot:append>
        <v-icon size="x-small" icon="$star" />
      </template>
    </v-btn>
  </v-btn-toggle>
</template>
