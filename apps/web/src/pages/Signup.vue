<script setup lang="ts">
import { SignUp } from 'vue-clerk';

import AuthShell from '@/components/Auth/AuthShell.vue';
</script>

<template>
  <AuthShell>
    <SignUp path="/signup" routing="path" sign-in-url="/signin" />
  </AuthShell>
</template>
