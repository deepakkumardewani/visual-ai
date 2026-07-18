/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */
// Composables
// Plugins
import { registerPlugins } from '@/plugins';
import router from '@/router';
import { useAppStore } from '@/stores/app';

import { createApp } from 'vue';

// Components
import App from './App.vue';

import '@/style.scss';

const app = createApp(App);

registerPlugins(app);

// Eagerly init the app store so theme class + Vuetify sync run before first paint.
useAppStore();

// Wait for the router to resolve the initial route before mounting, so route-derived
// layout classes (e.g. header padding) are correct on first paint instead of toggling
// in a moment after mount — which otherwise animates via Vuetify's v-main transition.
void router.isReady().then(() => {
  app.mount('#app');
});
