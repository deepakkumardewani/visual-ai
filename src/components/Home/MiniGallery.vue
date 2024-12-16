<script setup lang="ts">
import { ref } from 'vue'
import { ref as vueRef } from 'vue'
import { useDisplay } from 'vuetify'

import gallery from '@/utils/gallery.json'

// Get 5 random images from gallery data
const randomImages = vueRef([...gallery].sort(() => 0.5 - Math.random()).slice(0, 6))

const { xs, smAndUp } = useDisplay()
const selectedImage = ref(null)

// Add function to handle image click
const showImageDetails = (img: any) => {
  selectedImage.value = img
}
</script>

<template>
  <div id="gallery" class="tw-py-16">
    <v-row>
      <v-col cols="12">
        <div class="tw-flex tw-flex-col tw-justify-center tw-items-center tw-mb-12">
          <v-chip
            v-motion-pop-visible-once
            class="tw-mb-6"
            color="purple-lighten-2"
            size="large"
            label
          >
            Gallery
          </v-chip>
          <h2
            v-motion-slide-visible-once-left
            class="tw-text-3xl sm:tw-text-4xl font-weight-bold tw-mb-4 text-center"
          >
            Explore Our Creative Collection
          </h2>
          <p
            v-motion-slide-visible-once-right
            class="text-body-1 text-medium-emphasis text-center tw-max-w-2xl tw-mb-6"
          >
            Discover a world of AI-generated masterpieces created by our community. Get inspired and
            see what's possible with our technology.
          </p>
          <v-btn
            to="/gallery"
            v-motion-pop-visible-once
            color="purple-lighten-2"
            size="large"
            class="text-center"
            variant="outlined"
            prepend-icon="fas fa-images"
          >
            View All Artworks
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <div v-if="smAndUp" class="masonry-grid">
          <div
            v-for="(img, index) in randomImages"
            :key="index"
            class="masonry-item"
            @click="showImageDetails(img)"
          >
            <v-hover v-slot="{ isHovering, props }">
              <v-card
                v-motion
                :initial="{ opacity: 0, y: 50 }"
                :visibleOnce="{ opacity: 1, y: 0 }"
                :delay="index * 100"
                class="tw-overflow-hidden tw-rounded-lg tw-transition-transform hover:tw-scale-[1.02]"
                v-bind="props"
                elevation="4"
              >
                <v-img :src="img.url" cover class="gallery-image">
                  <template v-slot:placeholder>
                    <v-row class="fill-height ma-0" align="center" justify="center">
                      <v-progress-circular
                        indeterminate
                        color="purple-lighten-2"
                      ></v-progress-circular>
                    </v-row>
                  </template>
                  <v-expand-transition>
                    <div
                      v-if="isHovering"
                      class="tw-absolute tw-inset-0 tw-bg-purple-900/50 tw-p-6 tw-flex tw-flex-col tw-justify-end"
                    >
                      <p class="text-body-1 font-weight-medium tw-text-white">{{ img.prompt }}</p>
                      <!-- <v-btn
                        color="purple-lighten-2"
                        variant="elevated"
                        class="tw-mt-4"
                        size="small"
                        prepend-icon="fas fa-eye"
                      >
                        View Details
                      </v-btn> -->
                    </div>
                  </v-expand-transition>
                </v-img>
              </v-card>
            </v-hover>
          </div>
        </div>

        <!-- Mobile view -->
        <div v-if="xs" class="tw-space-y-6">
          <v-fade-transition group>
            <div v-for="(img, index) in randomImages" :key="index">
              <v-card
                v-motion
                :initial="{ opacity: 0, y: 50 }"
                :visibleOnce="{ opacity: 1, y: 0 }"
                :delay="index * 100"
                class="tw-overflow-hidden"
                elevation="4"
              >
                <v-img :src="img.url" cover>
                  <template v-slot:placeholder>
                    <v-row class="fill-height ma-0" align="center" justify="center">
                      <v-progress-circular
                        indeterminate
                        color="purple-lighten-2"
                      ></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
                <v-card-text class="tw-bg-purple-900/50">
                  <p class="text-body-2">{{ img.prompt }}</p>
                </v-card-text>
              </v-card>
            </div>
          </v-fade-transition>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped lang="scss">
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-gap: 1.5rem;
  grid-auto-flow: dense;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1.5rem;
}

.gallery-image {
  aspect-ratio: 1;
  @media (min-width: 768px) {
    aspect-ratio: calc(4 / 3);
  }
}
.grid-container,
.grid-item,
.img-card {
  // These can be removed
}
</style>
