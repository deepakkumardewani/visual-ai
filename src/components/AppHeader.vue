<script setup lang="ts">
import { SignedIn, SignedOut, useClerk, useUser } from 'vue-clerk'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const { user } = useUser()
const { signOut } = useClerk()

const userInitials = ref<string | undefined>('')
const fullName = ref<string | undefined>('')
const email = ref<string | undefined>('')

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
  }
})
</script>
<template>
  <v-app-bar :elevation="2">
    <v-img class="mx-2" src="/src/assets/logo.png" max-height="30" max-width="30" contain></v-img>
    <v-row class="align-center">
      <v-col :cols="!mobile ? 4 : 6">
        <v-app-bar-title class="mx-4 text-h5">Visual AI</v-app-bar-title>
      </v-col>
      <v-col v-if="!mobile" cols="4" class="d-flex justify-center align-center">
        <v-btn>About</v-btn>
        <v-btn>Gallery</v-btn>
        <v-btn>Features</v-btn>
      </v-col>
      <v-col :cols="!mobile ? 4 : 6" class="d-flex justify-end align-center">
        <SignedOut>
          <v-btn class="mx-4" variant="tonal" color="purple-lighten-2" href="/login"
            >Try It Now</v-btn
          >
        </SignedOut>

        <SignedIn>
          <v-tooltip text="10 credits remaining" offset="20" location="bottom">
            <template v-slot:activator="{ props }">
              <v-progress-circular
                v-bind="props"
                class="mx-4"
                model-value="10"
                :size="35"
                :width="3"
                color="teal"
              >
                10
              </v-progress-circular>
            </template>
          </v-tooltip>

          <v-menu min-width="200px" rounded>
            <template v-slot:activator="{ props }">
              <v-btn v-if="user" icon v-bind="props" class="mr-4">
                <v-avatar color="brown" size="small">
                  <span class="text-body-1">{{ userInitials }}</span>
                </v-avatar>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <div class="mx-auto text-center">
                  <h3>{{ fullName }}</h3>
                  <p class="text-caption mt-1">
                    {{ email }}
                  </p>
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
