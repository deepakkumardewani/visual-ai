// src/router/index.js
import { useUser } from 'vue-clerk';
import { createRouter, createWebHistory } from 'vue-router';

import Landing from '@/pages/Landing.vue';

const Contact = () => import('@/pages/Contact.vue');
const Dashboard = () => import('@/pages/Dashboard.vue');
const Examples = () => import('@/pages/Examples.vue');
const Faqs = () => import('@/pages/Frequent.vue');
const Gallery = () => import('@/pages/Gallery.vue');
const Pricing = () => import('@/pages/Pricing.vue');
const Privacy = () => import('@/pages/PrivacyPolicy.vue');
const Profile = () => import('@/pages/Profile.vue');
const Refund = () => import('@/pages/RefundPolicy.vue');
const Signin = () => import('@/pages/Signin.vue');
const Signup = () => import('@/pages/Signup.vue');
const Terms = () => import('@/pages/Terms.vue');

const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
  },
  {
    path: '/faqs',
    name: 'faqs',
    component: Faqs,
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: Pricing,
  },
  {
    path: '/signin',
    name: 'signin',
    component: Signin,
  },
  {
    path: '/signup',
    name: 'signup',
    component: Signup,
  },
  {
    path: '/terms',
    name: 'terms',
    component: Terms,
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: Privacy,
  },
  {
    path: '/refund',
    name: 'refund',
    component: Refund,
  },
  {
    path: '/contact',
    name: 'contact',
    component: Contact,
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: Gallery,
  },
  {
    path: '/examples',
    name: 'examples',
    component: Examples,
  },
  ...(import.meta.env.DEV
    ? [
        {
          path: '/dev/primitives',
          name: 'dev-primitives',
          component: () => import('@/pages/PrimitivesPlayground.vue'),
        },
      ]
    : []),
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scrollBehavior(to, from, savedPosition) {
    // always scroll to top
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const { isSignedIn } = useUser();

  // List of routes that require authentication
  const authRequiredRoutes = ['profile'];

  if (
    authRequiredRoutes.includes(to.name as string) &&
    (isSignedIn.value === undefined || isSignedIn.value === false)
  ) {
    // Redirect to signin page if trying to access protected route while not authenticated
    return { name: 'signin' };
  }
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.warn('Reloading page to fix dynamic import error');
      localStorage.setItem('vuetify:dynamic-reload', 'true');
      location.assign(to.fullPath);
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err);
    }
  } else {
    console.error(err);
  }
});

void router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload');
});

export default router;
