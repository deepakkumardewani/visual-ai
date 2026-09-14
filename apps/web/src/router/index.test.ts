import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createMemoryHistory } from 'vue-router';

const isSignedIn = ref<boolean | undefined>(false);

vi.mock('vue-clerk', () => ({
  useUser: () => ({ isSignedIn }),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    createWebHistory: (...args: unknown[]) =>
      actual.createMemoryHistory(...(args as Parameters<typeof createMemoryHistory>)),
  };
});

const { default: router } = await import('@/router');

describe('router', () => {
  beforeEach(async () => {
    isSignedIn.value = false;
    localStorage.clear();
    vi.restoreAllMocks();
    await router.push('/');
  });

  it('allows public routes while signed out', async () => {
    await router.push('/pricing');
    expect(router.currentRoute.value.name).toBe('pricing');
  });

  it('redirects protected profile to signin when signed out', async () => {
    await router.push('/profile');
    expect(router.currentRoute.value.name).toBe('signin');
    expect(router.currentRoute.value.query.redirect).toBe('/profile');
  });

  it('redirects explore-image when auth is still unknown', async () => {
    isSignedIn.value = undefined;
    await router.push('/explore/abc');
    expect(router.currentRoute.value.name).toBe('signin');
    expect(router.currentRoute.value.query.redirect).toBe('/explore/abc');
  });

  it('allows protected routes when signed in', async () => {
    isSignedIn.value = true;
    await router.push('/profile');
    expect(router.currentRoute.value.name).toBe('profile');
  });

  it('rewrites invalid create feature params to /create', async () => {
    await router.push('/create/not-a-real-tool');
    expect(router.currentRoute.value.path).toBe('/create');
    expect(router.currentRoute.value.name).toBe('create');
  });

  it('keeps a valid create feature param', async () => {
    await router.push('/create/upscale');
    expect(router.currentRoute.value.path).toBe('/create/upscale');
  });

  it('redirects /dashboard to /create and maps tool query', async () => {
    await router.push('/dashboard?tool=colorize&model=flux');
    expect(router.currentRoute.value.path).toBe('/create/colorize');
    expect(router.currentRoute.value.query.model).toBe('flux');
  });

  it('redirects /dashboard without a tool to /create', async () => {
    await router.push('/dashboard');
    expect(router.currentRoute.value.path).toBe('/create');
  });

  it('scrolls to the top on every navigation', () => {
    const scroll = router.options.scrollBehavior;
    expect(scroll?.({} as never, {} as never, null)).toEqual({ top: 0 });
  });

  it('reloads once when a dynamic import fails', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign },
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    router.addRoute({
      path: '/force-dynamic-error',
      name: 'force-dynamic-error',
      component: () =>
        Promise.reject(new Error('Failed to fetch dynamically imported module ./Foo.js')),
    });
    await router.push('/force-dynamic-error').catch(() => undefined);
    expect(localStorage.getItem('vite:dynamic-reload')).toBe('true');
    expect(assign).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it('logs when a second dynamic import reload still fails', async () => {
    localStorage.setItem('vite:dynamic-reload', 'true');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    router.addRoute({
      path: '/force-dynamic-error-2',
      name: 'force-dynamic-error-2',
      component: () =>
        Promise.reject(new Error('Failed to fetch dynamically imported module ./Bar.js')),
    });
    await router.push('/force-dynamic-error-2').catch(() => undefined);
    expect(error).toHaveBeenCalled();
  });

  it('logs unrelated router errors', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    router.addRoute({
      path: '/force-other-error',
      name: 'force-other-error',
      component: () => Promise.reject(new Error('chunk missing')),
    });
    await router.push('/force-other-error').catch(() => undefined);
    expect(error).toHaveBeenCalled();
  });

  it('registers the primitives playground in development', () => {
    expect(router.hasRoute('dev-primitives')).toBe(true);
  });

  it('loads lazy route components', async () => {
    for (const route of router.getRoutes()) {
      const raw = route.components?.default ?? route.component;
      if (typeof raw === 'function') {
        await Promise.resolve((raw as () => Promise<unknown>)()).catch(() => undefined);
      }
    }
  });
});
