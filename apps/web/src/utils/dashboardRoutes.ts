import type { LocationQuery, RouteLocationNormalizedLoaded } from 'vue-router';

import { FeatureType } from '@/types';

import { FEATURES } from '@/utils/constants';

/** Vue Router names for the main app shell surfaces. */
export const APP_SURFACE = {
  CREATE: 'create',
  EXPLORE: 'explore',
  ASSETS: 'assets',
} as const;

export type AppSurfaceName = (typeof APP_SURFACE)[keyof typeof APP_SURFACE];

/** Pinia `appStore.tab` values historically used by the dashboard. */
export const APP_SURFACE_TAB = {
  [APP_SURFACE.CREATE]: 1,
  [APP_SURFACE.EXPLORE]: 2,
  [APP_SURFACE.ASSETS]: 3,
} as const;

const FEATURE_IDS = new Set(FEATURES.map((feature) => feature.id));

export function isValidFeatureParam(value: unknown): value is FeatureType {
  return typeof value === 'string' && FEATURE_IDS.has(value as FeatureType);
}

export function resolveCreateFeature(param: unknown): FeatureType {
  return isValidFeatureParam(param) ? param : FeatureType.IMAGE;
}

export function isAppShellRoute(
  route: Pick<RouteLocationNormalizedLoaded, 'name'> | { name?: string | symbol | null },
): boolean {
  const name = route.name;
  return name === APP_SURFACE.CREATE || name === APP_SURFACE.EXPLORE || name === APP_SURFACE.ASSETS;
}

export function tabFromRouteName(name: unknown): number | null {
  if (name === APP_SURFACE.CREATE) return APP_SURFACE_TAB.create;
  if (name === APP_SURFACE.EXPLORE) return APP_SURFACE_TAB.explore;
  if (name === APP_SURFACE.ASSETS) return APP_SURFACE_TAB.assets;
  return null;
}

/** Build a create-surface location. Omits `:feature` when defaulting to image. */
export function createFeatureLocation(
  feature: FeatureType | string = FeatureType.IMAGE,
  query: LocationQuery = {},
) {
  const resolved = resolveCreateFeature(feature);
  return {
    name: APP_SURFACE.CREATE,
    params: resolved === FeatureType.IMAGE ? {} : { feature: resolved },
    query,
  } as const;
}

/**
 * Redirect `/dashboard?feature=` / `?tool=` → `/create/:feature`, preserving
 * remaining query params (e.g. `model`).
 */
export function dashboardRedirectLocation(to: { query: LocationQuery; hash?: string }) {
  const tool = typeof to.query.tool === 'string' ? to.query.tool : undefined;
  const feature = typeof to.query.feature === 'string' ? to.query.feature : undefined;
  const featureId = tool ?? feature;

  const nextQuery: LocationQuery = { ...to.query };
  delete nextQuery.feature;
  delete nextQuery.tool;

  if (isValidFeatureParam(featureId) && featureId !== FeatureType.IMAGE) {
    return {
      path: `/create/${featureId}`,
      query: nextQuery,
      hash: to.hash,
    };
  }

  return {
    path: '/create',
    query: nextQuery,
    hash: to.hash,
  };
}
