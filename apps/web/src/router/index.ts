// src/router/index.js
import { useUser } from 'vue-clerk';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import Landing from '@/pages/Landing.vue';

import {
  APP_SURFACE,
  dashboardRedirectLocation,
  isValidFeatureParam,
} from '@/utils/dashboardRoutes';

const Compare = () => import('@/pages/Compare.vue');
const Contact = () => import('@/pages/Contact.vue');
const Dashboard = () => import('@/pages/Dashboard.vue');
const ExploreImage = () => import('@/pages/ExploreImage.vue');
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

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
  },
  {
    path: '/create/:feature?',
    name: APP_SURFACE.CREATE,
    component: Dashboard,
    beforeEnter(to) {
      const feature = to.params.feature;
      if (feature && !isValidFeatureParam(feature)) {
        return { path: '/create', query: to.query, hash: to.hash };
      }
    },
  },
  {
    path: '/explore',
    name: APP_SURFACE.EXPLORE,
    component: Dashboard,
  },
  {
    path: '/assets',
    name: APP_SURFACE.ASSETS,
    component: Dashboard,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    redirect: (to) => dashboardRedirectLocation(to),
  },
  {
    path: '/explore/:id',
    name: 'explore-image',
    component: ExploreImage,
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
  {
    path: '/compare',
    name: 'compare',
    component: Compare,
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
  const authRequiredRoutes = ['profile', 'explore-image'];

  if (
    authRequiredRoutes.includes(to.name as string) &&
    (isSignedIn.value === undefined || isSignedIn.value === false)
  ) {
    // Redirect to signin page if trying to access protected route while not authenticated
    return { name: 'signin', query: { redirect: to.fullPath } };
  }
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vite:dynamic-reload')) {
      console.warn('Reloading page to fix dynamic import error');
      localStorage.setItem('vite:dynamic-reload', 'true');
      location.assign(to.fullPath);
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err);
    }
  } else {
    console.error(err);
  }
});

void router.isReady().then(() => {
  localStorage.removeItem('vite:dynamic-reload');
});

export default router;
