<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useDisplay } from "vuetify";

import { useDialogStore } from "@/stores/dialog";

const { mobile } = useDisplay();

const dialogStore = useDialogStore();
const { showPremiumDialog } = storeToRefs(dialogStore);

const aboutImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/about.jpg`;
const features = [
  {
    title: "AI Image Generator",
    description: "Create High Quality Images using Text",
  },
  {
    title: "Upscale Images",
    description: "Upscale Images in High Resolution",
  },
  {
    title: "Colorize Images",
    description: "Put Color back into your Images",
  },
  {
    title: "Deoldify Images",
    description: "Bring your Old photos back to Life",
  },
];
</script>
<template>
  <div class="text-center">
    <v-dialog
      width="auto"
      v-model="showPremiumDialog"
      :fullscreen="mobile"
      :max-width="mobile ? '100%' : '1000'"
      content-class="tw-flex tw-items-center tw-justify-center"
    >
      <v-card class="no-scrollbar tw-flex tw-flex-col tw-h-full purple-gradient">
        <v-card-text class="pa-0">
          <div
            class="tw-flex tw-h-screen tw-items-center tw-justify-center tw-flex-col md:tw-flex-row tw-p-4 tw-pb-0"
          >
            <!-- Features column -->
            <div
              class="md:tw-relative tw-inset-0 tw-w-full md:tw-w-[50%] tw-h-screen tw-justify-center tw-p-4 tw-px-7 md:tw-pr-20 tw-flex tw-flex-col"
            >
              <h1 class="tw-text-white tw-text-5xl tw-font-medium tw-py-6">
                Unlock the full potential of Visual AI
              </h1>
              <p class="tw-text-white tw-text-xl tw-mt-4 tw-font-bold">
                Get full access to all AI features and more generations.
              </p>
              <div class="tw-py-4">
                <ul class="tw-list-none tw-text-white tw-space-y-2 tw-flex tw-flex-col">
                  <li v-for="feature in features" :key="feature.title" class="tw-flex">
                    <v-icon icon="fas fa-circle" size="8" color="white" class="tw-mr-2 tw-mt-2.5" />
                    <div>
                      <span class="tw-font-bold tw-text-xl">{{ feature.title }}</span>
                      <div>
                        <span class="tw-text-lg">{{ feature.description }}</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <div class="tw-py-4 tw-text-center">
                <v-btn color="yellow-darken-3" block dark class="font-weight-bold">
                  Get Premium
                </v-btn>

                <div
                  @click="dialogStore.hidePremium()"
                  class="tw-text-white tw-my-3 tw-cursor-pointer"
                >
                  Maybe later
                </div>
              </div>
            </div>

            <!-- Image column -->
            <div class="tw-hidden md:tw-block tw-relative tw-w-full md:tw-w-[50%] tw-h-screen">
              <img
                :src="aboutImage"
                alt="AI Generated Image"
                class="tw-object-cover tw-w-full tw-h-[90%] tw-rounded-t-full"
              />
              />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.purple-gradient {
  background: linear-gradient(to bottom, #8733cc, #691bef);
}
</style>
