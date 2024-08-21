<script setup lang="ts">
import Aside from '@/components/Aside.vue'
import ResultColumn from '@/components/ResultColumn.vue'
</script>
<template>
  <v-container>
    <v-row>
      <v-col cols="3">
        <Aside />
      </v-col>
      <v-col cols="9">
        <ResultColumn />
      </v-col>
    </v-row>
    <!-- <v-row>
      <v-col cols="10"> </v-col>
      <v-col cols="2"> </v-col>
    </v-row> -->
  </v-container>
</template>

<style scoped lang="scss">
:deep(.v-skeleton-loader) {
  height: 100%;
  width: 100%;
  .v-skeleton-loader__image {
    height: 100%;
  }
}

.image {
  width: 100%;
}

.controls-column {
  background: rgb(18 18 18);
}
</style>
