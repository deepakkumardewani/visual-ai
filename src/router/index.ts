/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */
// Composables
import { setupLayouts } from 'virtual:generated-layouts'
import { useUser } from 'vue-clerk'
import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes)
})

router.beforeEach((to) => {
  const { isSignedIn } = useUser()

  // List of routes that require authentication
  const authRequiredRoutes = ['profile']

  if (
    authRequiredRoutes.includes(to.name as string) &&
    isSignedIn.value === undefined &&
    isSignedIn.value === false
  ) {
    // Redirect to home page if trying to access protected route while not authenticated
    return { name: '/' }
  }
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
