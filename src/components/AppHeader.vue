<script setup lang="ts">
import { SignedIn, SignedOut } from 'vue-clerk'

const user = {
  initials: 'JD',
  fullName: 'John Doe',
  email: 'john.doe@doe.com'
}
</script>
<template>
  <v-app-bar :elevation="2">
    <v-img class="mx-2" src="/src/assets/logo.png" max-height="30" max-width="30" contain></v-img>
    <v-row>
      <v-col cols="6">
        <v-app-bar-title class="mx-4 text-h5">Visual AI</v-app-bar-title>
      </v-col>
      <v-col cols="6" class="d-flex justify-end">
        <SignedOut>
          <!-- <SignInButton /> -->
          <v-btn class="mx-4" variant="tonal" color="purple-lighten-2" href="/login"
            >Try It Free</v-btn
          >
        </SignedOut>

        <SignedIn>
          <v-menu min-width="200px" rounded>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props">
                <v-avatar color="brown" size="large">
                  <span class="text-h5">{{ user.initials }}</span>
                </v-avatar>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <div class="mx-auto text-center">
                  <v-avatar color="brown">
                    <span class="text-h5">{{ user.initials }}</span>
                  </v-avatar>
                  <h3>{{ user.fullName }}</h3>
                  <p class="text-caption mt-1">
                    {{ user.email }}
                  </p>
                  <v-divider class="my-3"></v-divider>
                  <v-btn variant="text" rounded> Edit Account </v-btn>
                  <v-divider class="my-3"></v-divider>
                  <v-btn variant="text" rounded> Disconnect </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-menu>
        </SignedIn>
      </v-col>
    </v-row>

    <!-- <template v-slot:append>


    </template> -->
  </v-app-bar>
</template>

<style scoped></style>
