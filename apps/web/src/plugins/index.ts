import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { createHead } from '@unhead/vue/client';
import { MotionPlugin } from '@vueuse/motion';
import type { App } from 'vue';
import { clerkPlugin } from 'vue-clerk';

import { clerkAppearance } from '@/utils/clerkAppearance';

import { vReveal } from '../directives/reveal';
import router from '../router';
import pinia from '../stores';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const AFTER_SIGN_IN_URL = import.meta.env.VITE_CLERK_SIGN_IN_FORCE_REDIRECT_URL;
const AFTER_SIGN_UP_URL = import.meta.env.VITE_CLERK_SIGN_UP_FORCE_REDIRECT_URL;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export function registerPlugins(app: App) {
  app.component('font-awesome-icon', FontAwesomeIcon); // Register component globally
  app.use(clerkPlugin, {
    publishableKey: PUBLISHABLE_KEY,
    forceRedirectUrl: AFTER_SIGN_IN_URL,
    afterSignInUrl: AFTER_SIGN_IN_URL,
    afterSignUpUrl: AFTER_SIGN_UP_URL,
    signInUrl: '/signin',
    signUpUrl: '/signup',
    appearance: clerkAppearance,
  });
  app.use(MotionPlugin);
  app.use(createHead());
  app.directive('reveal', vReveal);
  app.use(router).use(pinia);
}
