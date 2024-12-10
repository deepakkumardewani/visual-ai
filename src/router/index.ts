// src/router/index.js
import { useUser } from 'vue-clerk'
import { createRouter, createWebHistory } from 'vue-router'

import Contact from '@/pages/Contact.vue'
import Dashboard from '@/pages/Dashboard.vue'
import Faqs from '@/pages/FAQS.vue'
import Home from '@/pages/Home.vue'
import Pricing from '@/pages/Pricing.vue'
import Privacy from '@/pages/Privacy.vue'
import Profile from '@/pages/Profile.vue'
import Refund from '@/pages/Refund.vue'
import Signin from '@/pages/Signin.vue'
import Signup from '@/pages/Signup.vue'
import Terms from '@/pages/Terms.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/faqs',
    name: 'Faqs',
    component: Faqs
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: Pricing
  },
  {
    path: '/signin',
    name: 'Signin',
    component: Signin
  },
  {
    path: '/signup',
    name: 'Signup',
    component: Signup
  },
  {
    path: '/terms',
    name: 'Terms',
    component: Terms
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: Privacy
  },
  {
    path: '/refund',
    name: 'Refund',
    component: Refund
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
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
