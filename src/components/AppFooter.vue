<template>
  <v-footer app absolute min-height="60" color="transparent" class="tw-flex flex-column">
    <div class="d-flex w-100 align-center justify-center px-4">
      <div class="text-caption text-disabled">
        &copy; 2024
        <span class="d-none d-sm-inline-block">Visual AI | </span>
        <span class="d-none d-sm-inline-block ml-1"> All rights reserved</span>
      </div>

      <v-spacer></v-spacer>

      <v-btn to="/contact" size="small" class="mx-4 text-none" variant="text">Contact US</v-btn>
      <v-btn to="/privacy" size="small" class="mx-4 text-none" variant="text">Privacy Policy</v-btn>
      <v-btn to="/terms" size="small" class="mx-4 text-none" variant="text">Terms of Service</v-btn>
      <v-btn to="/faq" size="small" class="mx-4 text-none" variant="text">FAQ</v-btn>
    </div>
  </v-footer>
</template>

<script setup lang="ts"></script>
