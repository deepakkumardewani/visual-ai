<script setup lang="ts">
import { SignIn } from 'vue-clerk';

import AuthShell from '@/components/Auth/AuthShell.vue';

const props = defineProps<{
  /** Validated same-origin path to land on after sign-in (set by the route record). */
  redirect?: string;
}>();

/*
 * Read once on entry: Clerk's path routing moves to /signin/factor-one etc.
 * without our query, and the destination must survive those steps.
 */
const initialRedirect = props.redirect;

/** Overrides the global post-auth destination only when a redirect was asked for. */
const redirectProps = initialRedirect
  ? { forceRedirectUrl: initialRedirect, signUpForceRedirectUrl: initialRedirect }
  : {};
</script>

<template>
  <AuthShell>
    <SignIn path="/signin" routing="path" sign-up-url="/signup" v-bind="redirectProps" />
  </AuthShell>
</template>
