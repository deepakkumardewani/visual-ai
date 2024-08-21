<script setup lang="ts">
import { SignedIn, SignedOut, useClerk, useUser } from 'vue-clerk'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const { user } = useUser()
const { signOut } = useClerk()
const route = useRoute()
const userInitials = ref<string | undefined>('')
const fullName = ref<string | undefined>('')
const email = ref<string | undefined>('')
const userImage = ref<string | undefined>('')
const creditsRemaining = ref<number>(20)
function getUserInitials() {
  if (!user.value) return ''
  if (!user.value.firstName || !user.value.lastName) return ''
  return user.value?.firstName?.charAt(0) + user.value?.lastName?.charAt(0)
}

watch(user, (value) => {
  if (value) {
    userInitials.value = getUserInitials()
    fullName.value = value.fullName ?? ''
    email.value = value.primaryEmailAddress?.emailAddress
    userImage.value = value.imageUrl
  }
})

onMounted(() => {})
</script>
<template>
  <v-app-bar :elevation="2">
    <v-img class="mx-2" src="/src/assets/logo.png" max-height="30" max-width="30" contain></v-img>
    <v-row class="align-center">
      <v-col :cols="!mobile ? 4 : 6">
        <v-app-bar-title class="mx-4 text-h5">Visual AI</v-app-bar-title>
      </v-col>
      <v-col v-if="!mobile" cols="4" class="d-flex justify-center align-center">
        <v-btn variant="text">About</v-btn>
        <v-btn variant="text">Gallery</v-btn>
        <v-btn variant="text">Features</v-btn>
      </v-col>
      <v-col :cols="!mobile ? 4 : 6" class="d-flex justify-end align-center">
        <SignedOut>
          <v-btn
            v-if="route.path === '/'"
            class="mx-4"
            variant="tonal"
            size="small"
            color="purple-lighten-2"
            to="/generate"
            >Try it now</v-btn
          >

          <v-btn
            v-if="route.path === '/generate'"
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
          <v-btn
            v-if="route.path === '/generate'"
            class="mx-4"
            variant="tonal"
            color="purple-lighten-2"
            to="/generate"
          >
            Create Image
          </v-btn>
          <v-btn
            v-if="route.path === '/generate'"
            class="mx-4"
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
      </v-col>
    </v-row>
  </v-app-bar>
</template>
