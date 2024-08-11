<script setup lang="ts">
import { SignedIn, SignedOut, UserButton } from 'vue-clerk'
</script>
<template>
  <v-app-bar :elevation="2">
    <v-img class="mx-2" src="/src/assets/logo.png" max-height="30" max-width="30" contain></v-img>
    <v-row>
      <v-col cols="4">
        <v-app-bar-title class="mx-4">Visual AI</v-app-bar-title>
      </v-col>
      <v-col cols="4" class="d-flex justify-center">
        <v-btn>Home</v-btn>
        <v-btn>About</v-btn>
        <v-btn>Gallery</v-btn>
        <v-btn>Pricing</v-btn>
      </v-col>
      <v-col cols="4" class="d-flex justify-end">
        <SignedOut>
          <!-- <SignInButton /> -->
          <v-btn class="mx-4" variant="tonal" href="/login">Try It Free</v-btn>
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </v-col>
    </v-row>

    <!-- <template v-slot:append>


    </template> -->
  </v-app-bar>
</template>

<style scoped></style>
