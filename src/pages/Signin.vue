<script setup>
import { SignIn } from 'vue-clerk'
</script>

<template>
  <v-container class="d-flex align-center justify-center h-100">
    <SignIn path="/signin" />
  </v-container>
</template>
