<script setup lang="ts">
import { SignIn } from 'vue-clerk';

import AuthShell from '@/components/Auth/AuthShell.vue';
</script>

<template>
  <AuthShell>
    <SignIn path="/signin" routing="path" sign-up-url="/signup" />
  </AuthShell>
</template>
