// src/router/index.js
import { useUser } from 'vue-clerk';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import Landing from '@/pages/Landing.vue';

import {
  APP_SURFACE,
  dashboardRedirectLocation,
  isValidFeatureParam,
} from '@/utils/dashboardRoutes';
import { toSafeInternalPath } from '@/utils/safeRedirect';

const Compare = () => import('@/pages/Compare.vue');
const Contact = () => import('@/pages/Contact.vue');
const Dashboard = () => import('@/pages/Dashboard.vue');
const ExploreImage = () => import('@/pages/ExploreImage.vue');
const Examples = () => import('@/pages/Examples.vue');
const FeatureLanding = () => import('@/pages/FeatureLanding.vue');
const Faqs = () => import('@/pages/Frequent.vue');
const Gallery = () => import('@/pages/Gallery.vue');
const LandingV2 = () => import('@/pages/LandingV2.vue');
const LandingV3 = () => import('@/pages/LandingV3.vue');
const Pricing = () => import('@/pages/Pricing.vue');
const Privacy = () => import('@/pages/PrivacyPolicy.vue');
const Profile = () => import('@/pages/Profile.vue');
const Refund = () => import('@/pages/RefundPolicy.vue');
const Signin = () => import('@/pages/Signin.vue');
const Signup = () => import('@/pages/Signup.vue');
const Terms = () => import('@/pages/Terms.vue');
const SongStudio = () => import('@/pages/SongStudio.vue');
const Music = () => import('@/pages/Music.vue');
const Video = () => import('@/pages/Video.vue');
const Speech = () => import('@/pages/Speech.vue');
const StudioPlaceholder = () => import('@/components/Studio/StudioPlaceholder.vue');

/** Studio routes stay on the placeholder until the slice that ships their page replaces them. */
function studioPlaceholderRoute(
  path: string,
  name: string,
  props: { studio: string; label: string },
): RouteRecordRaw {
  return { path, name, component: StudioPlaceholder, props, meta: { requiresAuth: true } };
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
  },
  {
    path: '/v2',
    name: 'landing-v2',
    component: LandingV2,
  },
  {
    path: '/v3',
    name: 'landing-v3',
    component: LandingV3,
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
    path: '/video',
    name: APP_SURFACE.VIDEO,
    component: Video,
    meta: { requiresAuth: true },
  },
  {
    path: '/audio/song',
    name: APP_SURFACE.AUDIO_SONG,
    component: SongStudio,
    meta: { requiresAuth: true },
  },
  {
    path: '/audio/music',
    name: APP_SURFACE.AUDIO_MUSIC,
    component: Music,
    meta: { requiresAuth: true },
  },
  {
    path: '/audio/speech',
    name: APP_SURFACE.AUDIO_SPEECH,
    component: Speech,
    meta: { requiresAuth: true },
  },
  studioPlaceholderRoute('/tools/image-watermark', APP_SURFACE.TOOLS_IMAGE_WATERMARK, {
    studio: 'tools',
    label: 'Image watermark',
  }),
  studioPlaceholderRoute('/tools/video-watermark', APP_SURFACE.TOOLS_VIDEO_WATERMARK, {
    studio: 'tools',
    label: 'Video watermark',
  }),
  studioPlaceholderRoute('/tools/autocaption', APP_SURFACE.TOOLS_AUTOCAPTION, {
    studio: 'tools',
    label: 'Autocaption',
  }),
  studioPlaceholderRoute('/tools/sketch', APP_SURFACE.TOOLS_SKETCH, {
    studio: 'tools',
    label: 'Sketch to image',
  }),
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
  const requiresAuth =
    authRequiredRoutes.includes(to.name as string) || Boolean(to.meta.requiresAuth);
  if (requiresAuth && isSignedIn.value === false) {
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
