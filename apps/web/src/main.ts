/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */
// Composables
// Plugins
import { registerPlugins } from '@/plugins';
import { useAppStore } from '@/stores/app';
import { createApp } from 'vue';

// Components
import App from './App.vue';

import '@/style.scss';

const app = createApp(App);

registerPlugins(app);

// Eagerly init the app store so theme class + Vuetify sync run before first paint.
useAppStore();

app.mount('#app');
