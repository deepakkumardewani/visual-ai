import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppStore } from '@/stores/app';

const driverMock = vi.hoisted(() => ({
  config: null as Record<string, any> | null,
  instance: null as Record<string, any> | null,
}));

vi.mock('driver.js', () => ({
  driver: (config: Record<string, any>) => {
    driverMock.config = config;
    const instance = {
      drive: vi.fn(),
      destroy: vi.fn(() => config.onDestroyed?.()),
      moveNext: vi.fn(),
      movePrevious: vi.fn(),
      isLastStep: vi.fn(() => false),
    };
    driverMock.instance = instance;
    return instance;
  },
}));
vi.mock('driver.js/dist/driver.css', () => ({}));

import {
  MIN_TOUR_STEPS,
  resolveTourSteps,
  startTour,
  TOUR_ANCHORS,
  TOUR_STEPS,
  TOUR_TOO_FEW_STEPS_MESSAGE,
  tourSelector,
  waitForTourAnchors,
} from './tour';

const ALL_ANCHORS = Object.values(TOUR_ANCHORS);

function addAnchor(anchor: string, visible = true): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('data-tour', anchor);
  el.getClientRects = () => (visible ? [{}] : []) as unknown as DOMRectList;
  document.body.appendChild(el);
  return el;
}

function mockReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }) as never;
}

function fakePopover() {
  const mk = () => document.createElement('div');
  return {
    title: mk(),
    description: mk(),
    footer: mk(),
    closeButton: mk(),
    wrapper: mk(),
  };
}

const originalMatchMedia = window.matchMedia;

describe('tour', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.body.innerHTML = '';
    driverMock.config = null;
    driverMock.instance = null;
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
    document.body.innerHTML = '';
  });

  describe('step data', () => {
    it('defines the 8 anchors, one step each, in order', () => {
      expect(ALL_ANCHORS).toHaveLength(8);
      expect(TOUR_STEPS.map((s) => s.anchor)).toEqual(ALL_ANCHORS);
    });

    it('builds a data-tour selector', () => {
      expect(tourSelector('mic')).toBe('[data-tour="mic"]');
    });
  });

  describe('resolveTourSteps', () => {
    it('returns all 8 steps when every anchor is visible', () => {
      ALL_ANCHORS.forEach((a) => addAnchor(a));
      const steps = resolveTourSteps();
      expect(steps.map((s) => s.anchor)).toEqual(ALL_ANCHORS);
      expect(steps[0].element).toBeInstanceOf(HTMLElement);
    });

    it('drops missing and hidden anchors', () => {
      addAnchor(TOUR_ANCHORS.modelPicker);
      addAnchor(TOUR_ANCHORS.mic, false);
      const hidden = addAnchor(TOUR_ANCHORS.sizes);
      hidden.style.visibility = 'hidden';
      expect(resolveTourSteps().map((s) => s.anchor)).toEqual([TOUR_ANCHORS.modelPicker]);
    });

    it('prefers the visible variant when several anchors share a name', () => {
      addAnchor(TOUR_ANCHORS.mic, false);
      const shown = addAnchor(TOUR_ANCHORS.mic);
      expect(resolveTourSteps()[0].element).toBe(shown);
    });
  });

  describe('waitForTourAnchors', () => {
    it('resolves once the visible count is stable and sufficient', async () => {
      vi.useFakeTimers();
      ALL_ANCHORS.forEach((a) => addAnchor(a));
      const done = vi.fn();
      void waitForTourAnchors().then(done);
      await vi.advanceTimersByTimeAsync(50);
      expect(done).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(100);
      expect(done).toHaveBeenCalled();
    });

    it('gives up after the timeout when too few anchors appear', async () => {
      vi.useFakeTimers();
      const done = vi.fn();
      void waitForTourAnchors().then(done);
      await vi.advanceTimersByTimeAsync(1400);
      expect(done).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(200);
      expect(done).toHaveBeenCalled();
    });
  });

  describe('startTour', () => {
    async function start(root?: ParentNode) {
      vi.useFakeTimers();
      const promise = startTour(root);
      await vi.advanceTimersByTimeAsync(2000);
      return promise;
    }

    it('toasts and skips driving when fewer than 2 anchors are visible', async () => {
      addAnchor(TOUR_ANCHORS.mic);
      const app = useAppStore();
      expect(MIN_TOUR_STEPS).toBe(2);

      await expect(start()).resolves.toBe(false);

      expect(app.snackbar).toBe(true);
      expect(app.snackbarText).toBe(TOUR_TOO_FEW_STEPS_MESSAGE);
      expect(app.snackbarTimeout).toBe(4000);
      expect(driverMock.instance).toBeNull();
    });

    it('drives the filtered steps with animation on', async () => {
      addAnchor(TOUR_ANCHORS.modelPicker);
      addAnchor(TOUR_ANCHORS.promptBar);
      addAnchor(TOUR_ANCHORS.mic, false);

      await expect(start()).resolves.toBe(true);

      expect(driverMock.config?.steps).toHaveLength(2);
      expect(driverMock.config?.steps[0].popover.title).toBe('Pick a model');
      expect(driverMock.config?.animate).toBe(true);
      expect(driverMock.config?.smoothScroll).toBe(true);
      expect(driverMock.instance?.drive).toHaveBeenCalledOnce();
    });

    it('disables animation under reduced motion', async () => {
      mockReducedMotion(true);
      addAnchor(TOUR_ANCHORS.modelPicker);
      addAnchor(TOUR_ANCHORS.promptBar);

      await start();

      expect(driverMock.config?.animate).toBe(false);
      expect(driverMock.config?.smoothScroll).toBe(false);
    });

    it('renders the popover with step counter and progress, and wires its actions', async () => {
      addAnchor(TOUR_ANCHORS.modelPicker);
      addAnchor(TOUR_ANCHORS.stylePicker);
      addAnchor(TOUR_ANCHORS.promptBar);
      await start();
      const popover = fakePopover();

      driverMock.config?.onPopoverRender(popover, { state: { activeIndex: 1 } });
      await vi.advanceTimersByTimeAsync(0);

      expect(popover.title.style.display).toBe('none');
      expect(popover.footer.style.display).toBe('none');
      const wrapper = popover.wrapper;
      expect(wrapper.querySelector('[data-testid="tour-step-counter"]')?.textContent).toBe('2 / 3');
      const bar = wrapper.querySelector('[role="progressbar"]');
      expect(bar?.getAttribute('aria-valuenow')).toBe('2');
      expect(bar?.getAttribute('aria-valuemax')).toBe('3');

      (wrapper.querySelector('[aria-label="Previous step"]') as HTMLElement).click();
      expect(driverMock.instance?.movePrevious).toHaveBeenCalled();
      (wrapper.querySelector('[aria-label="Next step"]') as HTMLElement).click();
      expect(driverMock.instance?.moveNext).toHaveBeenCalled();
      (wrapper.querySelector('[aria-label="Close tour"]') as HTMLElement).click();
      expect(driverMock.instance?.destroy).toHaveBeenCalledOnce();
    });

    it('updates the popover on later steps without remounting, and finishes on the last', async () => {
      addAnchor(TOUR_ANCHORS.modelPicker);
      addAnchor(TOUR_ANCHORS.promptBar);
      await start();
      const popover = fakePopover();
      driverMock.config?.onPopoverRender(popover, { state: { activeIndex: 0 } });
      driverMock.config?.onPopoverRender(popover, { state: {} });
      driverMock.config?.onPopoverRender(popover, { state: { activeIndex: 1 } });
      await vi.advanceTimersByTimeAsync(0);

      expect(popover.wrapper.children).toHaveLength(1);
      expect(popover.wrapper.textContent).toContain('Describe your image');

      driverMock.instance!.isLastStep.mockReturnValue(true);
      (popover.wrapper.querySelector('[aria-label="Finish tour"]') as HTMLElement).click();
      expect(driverMock.instance?.destroy).toHaveBeenCalledOnce();
      expect(popover.wrapper.querySelector('[data-testid="tour-step-counter"]')).toBeNull();
    });

    it('skips via the Skip button', async () => {
      addAnchor(TOUR_ANCHORS.modelPicker);
      addAnchor(TOUR_ANCHORS.promptBar);
      await start();
      const popover = fakePopover();
      driverMock.config?.onPopoverRender(popover, { state: { activeIndex: 0 } });
      await vi.advanceTimersByTimeAsync(0);

      const skip = Array.from(popover.wrapper.querySelectorAll('button')).find((b) =>
        /skip/i.test(b.textContent ?? ''),
      );
      skip?.click();
      expect(driverMock.instance?.destroy).toHaveBeenCalledOnce();
    });

    it('tolerates destroy before any popover rendered', async () => {
      addAnchor(TOUR_ANCHORS.modelPicker);
      addAnchor(TOUR_ANCHORS.promptBar);
      await start();
      expect(() => driverMock.config?.onDestroyed()).not.toThrow();
    });
  });
});
