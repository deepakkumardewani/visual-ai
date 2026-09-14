import { describe, expect, it } from 'vitest';

import { FeatureType } from '@/types';
import {
  APP_SURFACE,
  APP_SURFACE_TAB,
  createFeatureLocation,
  dashboardRedirectLocation,
  isAppShellRoute,
  isValidFeatureParam,
  resolveCreateFeature,
  tabFromRouteName,
} from '@/utils/dashboardRoutes';

describe('dashboardRoutes', () => {
  describe('isValidFeatureParam', () => {
    it('accepts known feature ids', () => {
      expect(isValidFeatureParam(FeatureType.IMAGE)).toBe(true);
      expect(isValidFeatureParam('upscale')).toBe(true);
      expect(isValidFeatureParam('colorize')).toBe(true);
      expect(isValidFeatureParam('revive')).toBe(true);
      expect(isValidFeatureParam('remove_bg')).toBe(true);
    });

    it('rejects unknown or non-string values', () => {
      expect(isValidFeatureParam('unknown')).toBe(false);
      expect(isValidFeatureParam(1)).toBe(false);
      expect(isValidFeatureParam(undefined)).toBe(false);
      expect(isValidFeatureParam(null)).toBe(false);
    });
  });

  describe('resolveCreateFeature', () => {
    it('returns the param when valid', () => {
      expect(resolveCreateFeature(FeatureType.UPSCALE)).toBe(FeatureType.UPSCALE);
    });

    it('defaults to image for invalid params', () => {
      expect(resolveCreateFeature('nope')).toBe(FeatureType.IMAGE);
      expect(resolveCreateFeature(undefined)).toBe(FeatureType.IMAGE);
    });
  });

  describe('isAppShellRoute', () => {
    it('is true for create, explore, and assets', () => {
      expect(isAppShellRoute({ name: APP_SURFACE.CREATE })).toBe(true);
      expect(isAppShellRoute({ name: APP_SURFACE.EXPLORE })).toBe(true);
      expect(isAppShellRoute({ name: APP_SURFACE.ASSETS })).toBe(true);
    });

    it('is false for other route names', () => {
      expect(isAppShellRoute({ name: 'pricing' })).toBe(false);
      expect(isAppShellRoute({ name: undefined })).toBe(false);
    });
  });

  describe('tabFromRouteName', () => {
    it('maps shell surfaces to historic tab numbers', () => {
      expect(tabFromRouteName(APP_SURFACE.CREATE)).toBe(APP_SURFACE_TAB.create);
      expect(tabFromRouteName(APP_SURFACE.EXPLORE)).toBe(APP_SURFACE_TAB.explore);
      expect(tabFromRouteName(APP_SURFACE.ASSETS)).toBe(APP_SURFACE_TAB.assets);
      expect(tabFromRouteName(APP_SURFACE.CREATE)).toBe(1);
    });

    it('returns null for unknown names', () => {
      expect(tabFromRouteName('pricing')).toBeNull();
      expect(tabFromRouteName(undefined)).toBeNull();
    });
  });

  describe('createFeatureLocation', () => {
    it('omits the feature param for the default image tool', () => {
      expect(createFeatureLocation()).toEqual({
        name: APP_SURFACE.CREATE,
        params: {},
        query: {},
      });
      expect(createFeatureLocation(FeatureType.IMAGE, { model: 'flux' })).toEqual({
        name: APP_SURFACE.CREATE,
        params: {},
        query: { model: 'flux' },
      });
    });

    it('includes the feature param for other tools', () => {
      expect(createFeatureLocation(FeatureType.REMOVE_BG)).toEqual({
        name: APP_SURFACE.CREATE,
        params: { feature: FeatureType.REMOVE_BG },
        query: {},
      });
    });

    it('falls back to image when the feature string is invalid', () => {
      expect(createFeatureLocation('not-a-tool')).toEqual({
        name: APP_SURFACE.CREATE,
        params: {},
        query: {},
      });
    });
  });

  describe('dashboardRedirectLocation', () => {
    it('redirects a non-image tool query to /create/:feature', () => {
      expect(
        dashboardRedirectLocation({
          query: { tool: 'upscale', model: 'clarity' },
          hash: '#top',
        }),
      ).toEqual({
        path: '/create/upscale',
        query: { model: 'clarity' },
        hash: '#top',
      });
    });

    it('prefers tool over feature when both are present', () => {
      expect(
        dashboardRedirectLocation({
          query: { tool: 'revive', feature: 'colorize' },
        }),
      ).toEqual({
        path: '/create/revive',
        query: {},
        hash: undefined,
      });
    });

    it('sends image and unknown tools to /create without a param', () => {
      expect(dashboardRedirectLocation({ query: { feature: 'image', model: 'x' } })).toEqual({
        path: '/create',
        query: { model: 'x' },
        hash: undefined,
      });
      expect(dashboardRedirectLocation({ query: { feature: 'unknown' } })).toEqual({
        path: '/create',
        query: {},
        hash: undefined,
      });
    });

    it('ignores non-string tool and feature query values', () => {
      expect(dashboardRedirectLocation({ query: { tool: ['upscale'] } })).toEqual({
        path: '/create',
        query: {},
        hash: undefined,
      });
    });
  });
});
