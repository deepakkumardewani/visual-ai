// src/router/index.js
import { useUser } from 'vue-clerk';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import Home from '@/pages/Home.vue';

import { ADMIN_FEEDBACK_ROUTE, adminGuardForRoute } from '@/router/adminGuard';

import {
  APP_SURFACE,
  dashboardRedirectLocation,
  isValidFeatureParam,
} from '@/utils/dashboardRoutes';
import { toSafeInternalPath } from '@/utils/safeRedirect';

const AdminFeedback = () => import('@/pages/AdminFeedback.vue');
const Compare = () => import('@/pages/Compare.vue');
const Contact = () => import('@/pages/Contact.vue');
const Dashboard = () => import('@/pages/Dashboard.vue');
const ExploreImage = () => import('@/pages/ExploreImage.vue');
const Examples = () => import('@/pages/Examples.vue');
const FeatureLanding = () => import('@/pages/FeatureLanding.vue');
const Faqs = () => import('@/pages/Frequent.vue');
const Gallery = () => import('@/pages/Gallery.vue');
const NotFound = () => import('@/pages/NotFound.vue');
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
    component: Home,
  },
  {
    path: '/text-to-image',
    name: 'seo-text-to-image',
    component: FeatureLanding,
  },
  {
    path: '/image-upscaler',
    name: 'seo-image-upscaler',
    component: FeatureLanding,
  },
  {
    path: '/colorize-photo',
    name: 'seo-colorize-photo',
    component: FeatureLanding,
  },
  {
    path: '/photo-restorer',
    name: 'seo-photo-restorer',
    component: FeatureLanding,
  },
  {
    path: '/remove-background',
    name: 'seo-remove-background',
    component: FeatureLanding,
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
    path: '/admin/feedback',
    name: ADMIN_FEEDBACK_ROUTE,
    component: AdminFeedback,
    beforeEnter: adminGuardForRoute,
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
    // Wildcard: Clerk's path routing returns to sub-paths like /signin/sso-callback
    path: '/signin/:pathMatch(.*)*',
    name: 'signin',
    component: Signin,
    // Only a validated same-origin path reaches Clerk as the post-sign-in destination.
    props: (route) => ({ redirect: toSafeInternalPath(route.query.redirect) }),
  },
  {
    path: '/signup/:pathMatch(.*)*',
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
  {
    // Unknown paths render a real 404 in place, keeping the bad URL visible to the visitor.
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    // Land on in-page anchors such as /pricing#packs; everything else starts at the top.
    if (to.hash) return { el: to.hash };
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const { isSignedIn } = useUser();

  // List of routes that require authentication
  const authRequiredRoutes = ['profile', 'explore-image'];

  // undefined means Clerk has not loaded yet. Redirecting then bounces a signed-in session through /signin.
  if (authRequiredRoutes.includes(to.name as string) && isSignedIn.value === false) {
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
