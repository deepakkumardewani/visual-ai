<script setup lang="ts">
import { faGear } from '@/plugins/icons';
import { ref } from 'vue';

import SettingsCluster from '@/components/Dashboard/ControlRail/SettingsCluster.vue';

const menu = ref(false);
</script>
<template>
  <v-menu
    v-model="menu"
    content-class="custom-menu"
    :close-on-content-click="false"
    location="bottom"
    offset="10"
  >
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="pa-2 ml-4" variant="tonal" size="sm">
        <font-awesome-icon :icon="faGear" />
      </v-btn>
    </template>

    <v-card min-width="400" class="pa-4">
      <SettingsCluster />
    </v-card>
  </v-menu>
</template>
