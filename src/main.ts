/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */
// Composables
import { createApp } from 'vue'
import { clerkPlugin } from 'vue-clerk'

// Plugins
import { registerPlugins } from '@/plugins'
import '@/style.scss'

// Components
import App from './App.vue'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const AFTER_SIGN_IN_URL = import.meta.env.VITE_CLERK_SIGN_IN_FORCE_REDIRECT_URL
const AFTER_SIGN_UP_URL = import.meta.env.VITE_CLERK_SIGN_UP_FORCE_REDIRECT_URL
const JWT_KEY = import.meta.env.VITE_CLERK_JWT_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

const app = createApp(App)
app.use(clerkPlugin, {
  publishableKey: PUBLISHABLE_KEY,
  afterSignInUrl: AFTER_SIGN_IN_URL,
  afterSignUpUrl: AFTER_SIGN_UP_URL,
  jwtKey: JWT_KEY,
  

})

registerPlugins(app)

app.mount('#app')
