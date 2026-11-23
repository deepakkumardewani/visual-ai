import type { LocationQuery, RouteLocationNormalizedLoaded } from 'vue-router';

import { FeatureType } from '@/types';

import { FEATURES } from '@/utils/constants';

/** Vue Router names for the main app shell surfaces. */
export const APP_SURFACE = {
  CREATE: 'create',
  EXPLORE: 'explore',
  ASSETS: 'assets',
  VIDEO: 'video',
  AUDIO_SONG: 'audio-song',
  AUDIO_MUSIC: 'audio-music',
  AUDIO_SPEECH: 'audio-speech',
  TOOLS_IMAGE_WATERMARK: 'tools-image-watermark',
  TOOLS_VIDEO_WATERMARK: 'tools-video-watermark',
  TOOLS_AUTOCAPTION: 'tools-autocaption',
  TOOLS_SKETCH: 'tools-sketch',
} as const;

export type AppSurfaceName = (typeof APP_SURFACE)[keyof typeof APP_SURFACE];

/** Pinia `appStore.tab` values historically used by the dashboard. */
export const APP_SURFACE_TAB = {
  [APP_SURFACE.CREATE]: 1,
  [APP_SURFACE.EXPLORE]: 2,
  [APP_SURFACE.ASSETS]: 3,
  [APP_SURFACE.VIDEO]: 4,
  audio: 5,
  tools: 6,
} as const;

/** Header menu entry: one studio route shown in a dropdown or the mobile accordion. */
export interface NavMenuItem {
  routeName: AppSurfaceName;
  path: string;
  label: string;
  description: string;
  /** 24x24 stroke-icon path data, drawn at 16 px. */
  iconPath: string;
}

export interface NavMenuGroupDef {
  id: 'audio' | 'tools';
  label: string;
  tab: number;
  items: readonly NavMenuItem[];
}

export const AUDIO_MENU_ITEMS: readonly NavMenuItem[] = [
  {
    routeName: APP_SURFACE.AUDIO_SONG,
    path: '/audio/song',
    label: 'Song',
    description: 'Full songs with vocals from lyrics',
    iconPath: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  },
  {
    routeName: APP_SURFACE.AUDIO_MUSIC,
    path: '/audio/music',
    label: 'Music',
    description: 'Instrumentals and soundscapes from a prompt',
    iconPath: 'M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4',
  },
  {
    routeName: APP_SURFACE.AUDIO_SPEECH,
    path: '/audio/speech',
    label: 'Speech',
    description: 'Natural voiceover from your text',
    iconPath: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3',
  },
];

export const TOOLS_MENU_ITEMS: readonly NavMenuItem[] = [
  {
    routeName: APP_SURFACE.TOOLS_IMAGE_WATERMARK,
    path: '/tools/image-watermark',
    label: 'Image watermark',
    description: 'Stamp a logo or text on photos',
    iconPath: 'M4 5h16v14H4zM8 15l3-3 2 2 3-4 4 5',
  },
  {
    routeName: APP_SURFACE.TOOLS_VIDEO_WATERMARK,
    path: '/tools/video-watermark',
    label: 'Video watermark',
    description: 'Add a logo to a video clip',
    iconPath: 'M3 6h13v12H3zM16 10l5-3v10l-5-3',
  },
  {
    routeName: APP_SURFACE.TOOLS_AUTOCAPTION,
    path: '/tools/autocaption',
    label: 'Autocaption',
    description: 'Burn captions into a video automatically',
    iconPath: 'M3 5h18v14H3zM7 11h4M7 15h2M13 11h4M11 15h6',
  },
  {
    routeName: APP_SURFACE.TOOLS_SKETCH,
    path: '/tools/sketch',
    label: 'Sketch to image',
    description: 'Draw a rough idea and turn it into art',
    iconPath: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  },
];

export const NAV_MENU_GROUPS: readonly NavMenuGroupDef[] = [
  { id: 'audio', label: 'Audio', tab: APP_SURFACE_TAB.audio, items: AUDIO_MENU_ITEMS },
  { id: 'tools', label: 'Tools', tab: APP_SURFACE_TAB.tools, items: TOOLS_MENU_ITEMS },
];

const APP_SURFACE_NAMES: ReadonlySet<unknown> = new Set(Object.values(APP_SURFACE));

const ROUTE_TAB_BY_NAME: ReadonlyMap<unknown, number> = new Map<unknown, number>([
  [APP_SURFACE.CREATE, APP_SURFACE_TAB.create],
  [APP_SURFACE.EXPLORE, APP_SURFACE_TAB.explore],
  [APP_SURFACE.ASSETS, APP_SURFACE_TAB.assets],
  [APP_SURFACE.VIDEO, APP_SURFACE_TAB.video],
  ...NAV_MENU_GROUPS.flatMap((group): [unknown, number][] =>
    group.items.map((item) => [item.routeName, group.tab]),
  ),
]);

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
  return APP_SURFACE_NAMES.has(route.name);
}

export function tabFromRouteName(name: unknown): number | null {
  return ROUTE_TAB_BY_NAME.get(name) ?? null;
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
