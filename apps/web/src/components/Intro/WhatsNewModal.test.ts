import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

const isOpen = ref(false);
const dismiss = vi.fn().mockResolvedValue(undefined);
const useAutoShow = vi.fn();
const startTour = vi.fn().mockResolvedValue(true);

vi.mock('@/composables/useIntro', () => ({
  useIntro: () => ({ isOpen, dismiss, useAutoShow, open: vi.fn() }),
}));
vi.mock('./tour', () => ({ startTour: (...args: unknown[]) => startTour(...args) }));
vi.mock('@/composables/useReducedMotion', () => ({ useReducedMotion: () => ref(false) }));

import { INTRO_SLIDES } from './slides';
import WhatsNewModal from './WhatsNewModal.vue';

const stubs = { 'font-awesome-icon': true };
let wrapper: VueWrapper;

const q = (id: string) => document.body.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const click = async (id: string) => {
  q(id)?.click();
  await nextTick();
};
const keydown = async (key: string, init: KeyboardEventInit = {}) => {
  q('whats-new-modal')?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, ...init }),
  );
  await nextTick();
};

async function openModal() {
  isOpen.value = true;
  await nextTick();
}

beforeEach(() => {
  isOpen.value = false;
  dismiss.mockClear();
  useAutoShow.mockClear();
  startTour.mockClear();
  wrapper = mount(WhatsNewModal, { global: { stubs }, attachTo: document.body });
});

afterEach(() => {
  wrapper.unmount();
});

describe('WhatsNewModal', () => {
  it('registers the auto-show hook and renders nothing while closed', () => {
    expect(useAutoShow).toHaveBeenCalledTimes(1);
    expect(q('whats-new-modal')).toBeNull();
  });

  it('opens as a labelled carousel dialog on slide 1 of 10', async () => {
    await openModal();
    const modal = q('whats-new-modal')!;
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-roledescription')).toBe('carousel');
    expect(document.getElementById(modal.getAttribute('aria-labelledby')!)?.textContent).toContain(
      "What's new in V2",
    );
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
    expect(q('whats-new-slide-title')?.textContent?.trim()).toBe(INTRO_SLIDES[0].title);
    expect(q('whats-new-live')?.textContent).toBe(`Feature 1 of 10: ${INTRO_SLIDES[0].title}`);
  });

  it('steps with the icon buttons and disables them at the ends', async () => {
    await openModal();
    const prev = q('whats-new-prev') as HTMLButtonElement;
    const next = q('whats-new-next') as HTMLButtonElement;
    expect(prev.getAttribute('aria-label')).toBe('Previous feature');
    expect(next.getAttribute('aria-label')).toBe('Next feature');
    expect(prev.disabled).toBe(true);
    await click('whats-new-next');
    expect(q('whats-new-counter')?.textContent).toBe('2 / 10');
    expect(prev.disabled).toBe(false);
    await click('whats-new-prev');
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
  });

  it('shows only the active slide', async () => {
    await openModal();
    const visible = () =>
      Array.from(document.body.querySelectorAll<HTMLElement>('[data-testid="intro-slide"]')).filter(
        (el) => el.style.display !== 'none',
      );
    expect(visible()).toHaveLength(1);
    await click('whats-new-next');
    expect(visible()).toHaveLength(1);
  });

  it('loads media for the current and next slide only', async () => {
    await openModal();
    const slides = document.body.querySelectorAll('[data-testid="intro-slide"]');
    const loaded = Array.from(slides).map((s) => s.querySelector('video, img') !== null);
    expect(loaded.slice(0, 2)).toEqual([true, true]);
    expect(loaded.slice(2).some(Boolean)).toBe(false);
  });

  it('jumps to a slide from the feature list', async () => {
    await openModal();
    await click('intro-feature-6');
    expect(q('whats-new-counter')?.textContent).toBe('6 / 10');
    expect(q('whats-new-slide-title')?.textContent?.trim()).toBe(INTRO_SLIDES[5].title);
    expect(q('intro-feature-6')?.getAttribute('aria-current')).toBe('true');
  });

  it('jumps from the mobile progress dots', async () => {
    await openModal();
    const dots = document.body.querySelectorAll<HTMLElement>(
      '[data-testid="whats-new-progress"] button',
    );
    expect(dots).toHaveLength(10);
    expect(dots[2].getAttribute('aria-label')).toBe(`Go to feature 3: ${INTRO_SLIDES[2].title}`);
    dots[2].click();
    await nextTick();
    expect(q('whats-new-counter')?.textContent).toBe('3 / 10');
  });

  it('navigates with arrow keys, clamped to the slide range', async () => {
    await openModal();
    await keydown('ArrowLeft');
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
    await keydown('ArrowRight');
    expect(q('whats-new-counter')?.textContent).toBe('2 / 10');
    await keydown('ArrowLeft');
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
    for (let i = 0; i < 12; i += 1) await keydown('ArrowRight');
    expect(q('whats-new-counter')?.textContent).toBe('10 / 10');
  });

  it('ignores unrelated keys', async () => {
    await openModal();
    await keydown('a');
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('dismisses on Escape, Skip and close', async () => {
    await openModal();
    await keydown('Escape');
    await click('whats-new-skip');
    await click('whats-new-close');
    expect(dismiss).toHaveBeenCalledTimes(3);
  });

  it('shows final-slide actions only on the last slide', async () => {
    await openModal();
    expect(q('whats-new-final-actions')).toBeNull();
    await click('intro-feature-10');
    expect(q('whats-new-final-actions')).not.toBeNull();
    expect((q('whats-new-next') as HTMLButtonElement).disabled).toBe(true);
    await click('whats-new-done');
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('starts the tour after dismissing from "Show me around"', async () => {
    await openModal();
    await click('intro-feature-10');
    await click('whats-new-tour');
    await vi.waitFor(() => expect(startTour).toHaveBeenCalledTimes(1));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('swipes between slides past the threshold and ignores short drags', async () => {
    await openModal();
    const stage = q('whats-new-stage')!;
    const swipe = async (from: number, to: number) => {
      stage.dispatchEvent(
        new TouchEvent('touchstart', {
          changedTouches: [new Touch({ identifier: 1, target: stage, clientX: from })],
        }),
      );
      stage.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [new Touch({ identifier: 1, target: stage, clientX: to })],
        }),
      );
      await nextTick();
    };
    await swipe(200, 100);
    expect(q('whats-new-counter')?.textContent).toBe('2 / 10');
    await swipe(100, 130);
    expect(q('whats-new-counter')?.textContent).toBe('2 / 10');
    await swipe(100, 200);
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
  });

  it('ignores a touchend with no matching touchstart', async () => {
    await openModal();
    const stage = q('whats-new-stage')!;
    stage.dispatchEvent(
      new TouchEvent('touchend', {
        changedTouches: [new Touch({ identifier: 1, target: stage, clientX: 0 })],
      }),
    );
    await nextTick();
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
  });

  it('ignores touch events with no touch points', async () => {
    await openModal();
    const stage = q('whats-new-stage')!;
    stage.dispatchEvent(new TouchEvent('touchstart', { changedTouches: [] }));
    stage.dispatchEvent(new TouchEvent('touchend', { changedTouches: [] }));
    await nextTick();
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
  });

  it('resets to slide 1 on reopen and returns focus to the opener on close', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    await openModal();
    await click('intro-feature-4');
    isOpen.value = false;
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(opener);
    await openModal();
    expect(q('whats-new-counter')?.textContent).toBe('1 / 10');
    opener.remove();
  });

  it('traps Tab inside the dialog', async () => {
    await openModal();
    const modal = q('whats-new-modal')!;
    const focusable = Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled])'));
    const last = focusable[focusable.length - 1];
    // JSDOM has no layout, so offsetParent is always null; fake it so the trap sees visible nodes.
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get: () => document.body,
    });
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    modal.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(focusable[0]);
    Reflect.deleteProperty(HTMLElement.prototype, 'offsetParent');
  });
});
