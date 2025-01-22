// src/router/index.js
import { useUser } from 'vue-clerk'
import { createRouter, createWebHistory } from 'vue-router'

import Contact from '@/pages/Contact.vue'
import Dashboard from '@/pages/Dashboard.vue'
import Examples from '@/pages/Examples.vue'
import Faqs from '@/pages/Frequent.vue'
import Gallery from '@/pages/Gallery.vue'
import Landing from '@/pages/Landing.vue'
import Pricing from '@/pages/Pricing.vue'
import Privacy from '@/pages/PrivacyPolicy.vue'
import Profile from '@/pages/Profile.vue'
import Refund from '@/pages/RefundPolicy.vue'
import Signin from '@/pages/Signin.vue'
import Signup from '@/pages/Signup.vue'
import Terms from '@/pages/Terms.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile
  },
  {
    path: '/faqs',
    name: 'faqs',
    component: Faqs
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: Pricing
  },
  {
    path: '/signin',
    name: 'signin',
    component: Signin
  },
  {
    path: '/signup',
    name: 'signup',
    component: Signup
  },
  {
    path: '/terms',
    name: 'terms',
    component: Terms
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: Privacy
  },
  {
    path: '/refund',
    name: 'refund',
    component: Refund
  },
  {
    path: '/contact',
    name: 'contact',
    component: Contact
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: Gallery
  },
  {
    path: '/examples',
    name: 'examples',
    component: Examples
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
