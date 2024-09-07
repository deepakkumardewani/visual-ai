<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SignedIn, SignedOut, useClerk, useUser } from 'vue-clerk'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

import Coin from '@/components/Coin.vue'
import PricingDialog from '@/components/PricingDialog.vue'
import ThemeButton from '@/components/ThemeButton.vue'
import { useAppStore } from '@/stores/app'
import { useDialogStore } from '@/stores/dialog'

const dialogStore = useDialogStore()

type Feature = {
  id: string
  title: string
  icon: string
}

const { xs } = useDisplay()
const { user } = useUser()
const { signOut } = useClerk()
const route = useRoute()
const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
const feature = ref<Feature>({
  id: 'ai_image',
  title: 'AI Image Generator',
  icon: '$imageFrame'
})
const userInitials = ref<string | undefined>('')
const fullName = ref<string | undefined>('')
const email = ref<string | undefined>('')
const userImage = ref<string | undefined>('')
const creditsRemaining = ref<number>(20)

const features = ref<Feature[]>([
  {
    id: 'ai_image',
    title: 'AI Image Generator',
    icon: '$imageFrame'
  },
  {
    id: 'image_upscaler',
    title: 'Image Upscaler',
    icon: '$expand'
  },
  {
    id: 'colorize_image',
    title: 'Colorize Image',
    icon: '$dropper'
  },
  {
    id: 'revive_old_photos',
    title: 'Revive Old Photos',
    icon: '$camera'
  }
])
function getUserInitials() {
  if (!user.value) return ''
  if (!user.value.firstName || !user.value.lastName) return ''
  return user.value?.firstName?.charAt(0) + user.value?.lastName?.charAt(0)
}

function handleSelected(item: Feature) {
  appStore.setFeature(item.id)
}
watch(user, (value) => {
  if (value) {
    userInitials.value = getUserInitials()
    fullName.value = value.fullName ?? ''
    email.value = value.primaryEmailAddress?.emailAddress
    userImage.value = value.imageUrl
  }
})

onMounted(() => {
  appStore.setFeature('ai_image')
})
</script>
<template>
  <v-app-bar :elevation="0" color="transparent" class="bg-asideBg">
    <v-row class="align-center">
      <v-col cols="8">
        <div class="tw-relative tw-flex tw-min-w-0 tw-shrink-0 tw-items-center tw-gap-3">
          <div class="ml-2">
            <img src="/src/assets/logo.png" width="30" />
          </div>
          <div class="tw-hidden lg:tw-block">
            <span class="gradient-text">Visual AI</span>
            <span class="trademark">TM</span>
          </div>

          <div class="tw-relative tw-min-w-0 tw-flex-1 tw-lg:tw-flex-none">
            <v-select
              v-if="route.path === '/dashboard'"
              @update:model-value="handleSelected"
              :items="features"
              v-model="feature"
              max-width="250"
              bg-color="transparent"
              color="purple-lighten-3"
              variant="outlined"
              :prepend-inner-icon="isDark ? `${feature.icon}Dark` : feature.icon"
              density="compact"
              hide-details
              item-title="title"
              item-value="title"
              return-object
            >
              <template v-slot:item="{ item, props }">
                <v-list-item
                  :prepend-icon="isDark ? `${item.raw.icon}Dark` : item.raw.icon"
                  v-bind="props"
                >
                </v-list-item>
              </template>
            </v-select>
          </div>
        </div>
      </v-col>

      <v-col cols="4">
        <div class="tw-flex tw-shrink-0 tw-gap-4">
          <div id="export-area" class="ml-auto tw-flex tw-items-center tw-gap-2 tw-lg:tw-gap-4">
            <!-- SignedOut -->
            <SignedOut>
              <v-btn
                v-if="route.path === '/'"
                class="mx-4"
                variant="tonal"
                size="small"
                color="purple-lighten-2"
                to="/dashboard"
                >Try it now</v-btn
              >

              <v-btn
                v-if="route.path === '/dashboard'"
                class="mx-4"
                variant="tonal"
                color="purple-lighten-2"
                size="small"
                to="/signin"
              >
                Sign Up
              </v-btn>
            </SignedOut>

            <!-- SignedIn -->

            <SignedIn>
              <Coin />
              <ThemeButton />
              <v-btn
                v-if="route.path !== '/dashboard'"
                class="mx-4"
                size="small"
                variant="tonal"
                color="purple-lighten-2"
                to="/dashboard"
              >
                Launch App
              </v-btn>
              <v-btn
                v-if="route.path === '/dashboard' && !xs"
                @click="dialogStore.reveal"
                class="mx-4"
                size="small"
                variant="tonal"
                color="purple-lighten-2"
              >
                Subscribe to Pro
              </v-btn>
            </SignedIn>
          </div>
          <SignedIn>
            <div id="user" class="tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-lg:tw-gap-3">
              <v-menu min-width="200px" rounded>
                <template v-slot:activator="{ props }">
                  <div v-if="user" v-bind="props" class="mr-4">
                    <v-avatar class="mr-2" size="small">
                      <v-img alt="user image" :src="userImage">
                        <template v-slot:error>
                          <span class="text-body-1">{{ userInitials }}</span>
                        </template>
                      </v-img>
                    </v-avatar>
                    <v-icon
                      size="x-small"
                      class="tw-cursor-pointer"
                      icon="fas fa-caret-down"
                    ></v-icon>
                  </div>
                </template>
                <v-card>
                  <v-card-text>
                    <div class="mx-auto text-center">
                      <v-avatar>
                        <v-img alt="user image" :src="userImage">
                          <template v-slot:error>
                            <span class="text-body-1">{{ userInitials }}</span>
                          </template>
                        </v-img>
                      </v-avatar>
                      <h3 class="tw-font-bold">{{ fullName }}</h3>
                      <p class="text-caption mt-1">
                        {{ email }}
                      </p>
                      <v-divider class="my-3"></v-divider>
                      <v-divider class="my-3"></v-divider>
                      <v-btn @click="signOut({ redirectUrl: '/' })" variant="text"> Logout </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-menu>
            </div>
          </SignedIn>
        </div>
      </v-col>

      <!-- <v-col :cols="!mobile && route.path !== '/dashboard' ? 4 : 2">
        <v-app-bar-title class="mx-4 text-h5"> </v-app-bar-title>
      </v-col>
      <v-col cols="2"> </v-col>
      <v-col
        v-if="!mobile && route.path !== '/dashboard'"
        cols="4"
        class="d-flex justify-center align-center"
      >
        <v-btn variant="text">About</v-btn>
        <v-btn variant="text">Gallery</v-btn>
        <v-btn variant="text">Features</v-btn>
      </v-col>
      <v-col
        :cols="!mobile && route.path !== '/dashboard' ? 4 : 6"
        class="d-flex justify-end align-center"
        align="end"
      >
        <SignedOut>
          <v-btn
            v-if="route.path === '/'"
            class="mx-4"
            variant="tonal"
            size="small"
            color="purple-lighten-2"
            to="/dashboard"
            >Try it now</v-btn
          >

          <v-btn
            v-if="route.path === '/dashboard'"
            class="mx-4"
            variant="tonal"
            color="purple-lighten-2"
            size="small"
            to="/login"
          >
            Sign Up
          </v-btn>
        </SignedOut>

        <SignedIn>
          <ThemeButton />
          <v-btn
            v-if="route.path !== '/dashboard'"
            class="mx-4"
            size="small"
            variant="tonal"
            color="purple-lighten-2"
            to="/dashboard"
          >
            Launch App
          </v-btn>
          <v-btn
            v-if="route.path === '/dashboard'"
            @click="dialogStore.reveal"
            class="mx-4"
            size="small"
            variant="tonal"
            color="purple-lighten-2"
          >
            Subscribe to Pro
          </v-btn>

          <v-menu min-width="200px" rounded>
            <template v-slot:activator="{ props }">
              <div v-if="user" v-bind="props" class="mr-4">
                <v-avatar class="mr-2" size="small">
                  <v-img alt="user image" :src="userImage">
                    <template v-slot:error>
                      <span class="text-body-1">{{ userInitials }}</span>
                    </template>
                  </v-img>
                </v-avatar>
                <v-icon size="x-small" class="tw-cursor-pointer" icon="fas fa-caret-down"></v-icon>
              </div>
            </template>
            <v-card>
              <v-card-text>
                <div class="mx-auto text-center">
                  <v-avatar>
                    <v-img alt="user image" :src="userImage">
                      <template v-slot:error>
                        <span class="text-body-1">{{ userInitials }}</span>
                      </template>
                    </v-img>
                  </v-avatar>
                  <h3 class="tw-font-bold">{{ fullName }}</h3>
                  <p class="text-caption mt-1">
                    {{ email }}
                  </p>
                  <v-divider class="my-3"></v-divider>
                  <p>Credits remaining</p>
                  <p class="tw-font-bold tw-text-lg">{{ creditsRemaining }}</p>
                  <v-progress-linear max="20" v-model="creditsRemaining"></v-progress-linear>
                  <v-divider class="my-3"></v-divider>
                  <v-btn @click="signOut({ redirectUrl: '/' })" variant="text"> Logout </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-menu>
        </SignedIn>
      </v-col> -->
    </v-row>
  </v-app-bar>
  <PricingDialog />
</template>

<style scoped lang="scss">
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
