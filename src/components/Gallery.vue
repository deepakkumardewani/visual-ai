<script setup lang="ts">
import { useDisplay } from 'vuetify'

import { EXAMPLES } from '@/utils/constants'

const { xs, smAndUp } = useDisplay()
</script>
<template>
  <div id="gallery" class="mt-16">
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-center align-center justify-sm-start align-sm-start">
          <v-chip class="my-4" color="purple-lighten-2" label> Gallery </v-chip>
        </div>
        <div class="text-h4 font-weight-bold my-2">
          <span> Explore Our Gallery </span>
        </div>
        <div class="my-2">
          <p>Check out our collection of stunning images created by others.</p>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div v-if="smAndUp" class="grid-container">
          <div v-for="(img, index) in EXAMPLES" :key="index" class="grid-item">
            <v-hover v-slot="{ isHovering, props }">
              <v-card class="mx-auto" color="grey-lighten-4" max-width="600" v-bind="props">
                <v-img :aspect-ratio="1 / 1" :src="img.url" cover>
                  <v-expand-transition>
                    <div
                      v-if="isHovering"
                      class="d-flex pa-4 opacity-80 transition-fast-in-fast-out bg-purple-lighten-2 v-card--reveal text-h6"
                      style="height: 100%"
                    >
                      {{ img.prompt }}
                    </div>
                  </v-expand-transition>
                </v-img>
              </v-card>
            </v-hover>
          </div>
        </div>
        <div v-if="xs">
          <div class="my-4" v-for="(img, index) in EXAMPLES" :key="index">
            <v-card class="mx-auto" max-width="344">
              <v-img :aspect-ratio="1 / 1" :src="img.url" cover> </v-img>

              <!-- <v-card-actions>
                <v-spacer></v-spacer>

                <v-btn color="purple-lighten-2" class="text-center" text="Show prompt"></v-btn>
              </v-card-actions> -->
            </v-card>
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="scss">
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0px;
  width: 100%;
}
.grid-item {
  padding: 15px 10px;
}

.img-card {
  height: 500px;
  width: 500px;
}
</style>
