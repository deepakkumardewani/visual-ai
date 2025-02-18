import { useUser } from 'vue-clerk'
import { createRouter, createWebHistory } from 'vue-router'

import Landing from '@/pages/Landing.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/Dashboard.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/Profile.vue')
  },
  {
    path: '/faqs',
    name: 'faqs',
    component: () => import('@/pages/Frequent.vue')
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: () => import('@/pages/Pricing.vue')
  },
  {
    path: '/signin',
    name: 'signin',
    component: () => import('@/pages/Signin.vue')
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/pages/Signup.vue')
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('@/pages/Terms.vue')
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('@/pages/PrivacyPolicy.vue')
  },
  {
    path: '/refund',
    name: 'refund',
    component: () => import('@/pages/RefundPolicy.vue')
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/pages/Contact.vue')
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('@/pages/Gallery.vue')
  },
  {
    path: '/examples',
    name: 'examples',
    component: () => import('@/pages/Examples.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scrollBehavior(to, from, savedPosition) {
    // always scroll to top
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const { isSignedIn } = useUser()

  // List of routes that require authentication
  const authRequiredRoutes = ['profile']

  if (
    authRequiredRoutes.includes(to.name as string) &&
    (isSignedIn.value === undefined || isSignedIn.value === false)
  ) {
    // Redirect to signin page if trying to access protected route while not authenticated
    return { name: 'signin' }
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
