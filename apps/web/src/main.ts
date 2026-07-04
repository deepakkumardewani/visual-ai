/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */
// Composables
// Plugins
import { registerPlugins } from "@/plugins";
import { createApp } from "vue";

// Components
import App from "./App.vue";

import "@/style.scss";

const app = createApp(App);

registerPlugins(app);

app.mount("#app");
