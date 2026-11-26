import type { MediaAssetDto } from '@visual-ai/shared';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import HandoffMenu from '@/components/Studio/HandoffMenu.vue';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: mocks.push, replace: vi.fn() }),
}));

const VIDEO = { id: 'v1', type: 'video' } as MediaAssetDto;
const AUDIO = { id: 'a1', type: 'audio' } as MediaAssetDto;

let wrapper: VueWrapper | undefined;

function mountMenu(asset: MediaAssetDto) {
  wrapper = mount(HandoffMenu, { props: { asset }, attachTo: document.body });
  return wrapper;
}

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  vi.clearAllMocks();
});

async function openWithClick(w: VueWrapper) {
  await w.get('[data-testid="handoff-trigger"]').trigger('click');
  await nextTick();
}

describe('HandoffMenu', () => {
  it('renders nothing for an asset with no targets', () => {
    expect(mountMenu(AUDIO).find('[data-testid="handoff-menu"]').exists()).toBe(false);
  });

  it('is closed at first and exposes menu semantics', () => {
    const w = mountMenu(VIDEO);
    const trigger = w.get('[data-testid="handoff-trigger"]');
    expect(trigger.attributes('aria-haspopup')).toBe('menu');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(w.find('[role="menu"]').exists()).toBe(false);
  });

  it('opens on click, focuses the first item and lists the targets', async () => {
    const w = mountMenu(VIDEO);
    await openWithClick(w);
    const items = w.findAll('[role="menuitem"]');
    expect(items.map((i) => i.text())).toEqual(['Video watermark', 'Autocaption']);
    expect(document.activeElement).toBe(items[0]!.element);
    expect(w.get('[data-testid="handoff-trigger"]').attributes('aria-expanded')).toBe('true');
  });

  it('closes and returns focus to the trigger when clicked again', async () => {
    const w = mountMenu(VIDEO);
    await openWithClick(w);
    await w.get('[data-testid="handoff-trigger"]').trigger('click');
    expect(w.find('[role="menu"]').exists()).toBe(false);
    expect(document.activeElement).toBe(w.get('[data-testid="handoff-trigger"]').element);
  });

  it('opens on ArrowDown at the first item and on ArrowUp at the last', async () => {
    const w = mountMenu(VIDEO);
    const trigger = w.get('[data-testid="handoff-trigger"]');
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    let items = w.findAll('[role="menuitem"]');
    expect(document.activeElement).toBe(items[0]!.element);
    await w.get('[role="menu"]').trigger('keydown', { key: 'Escape' });
    await trigger.trigger('keydown', { key: 'ArrowUp' });
    await nextTick();
    items = w.findAll('[role="menuitem"]');
    expect(document.activeElement).toBe(items[1]!.element);
  });

  it('ignores other keys on the trigger', async () => {
    const w = mountMenu(VIDEO);
    await w.get('[data-testid="handoff-trigger"]').trigger('keydown', { key: 'a' });
    expect(w.find('[role="menu"]').exists()).toBe(false);
  });

  it('moves focus with arrows, Home and End, wrapping around', async () => {
    const w = mountMenu(VIDEO);
    await openWithClick(w);
    const menu = w.get('[role="menu"]');
    const items = w.findAll('[role="menuitem"]');
    await menu.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]!.element);
    await menu.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[0]!.element);
    await menu.trigger('keydown', { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[1]!.element);
    await menu.trigger('keydown', { key: 'Home' });
    expect(document.activeElement).toBe(items[0]!.element);
    await menu.trigger('keydown', { key: 'End' });
    expect(document.activeElement).toBe(items[1]!.element);
  });

  it('ignores unrelated keys inside the menu', async () => {
    const w = mountMenu(VIDEO);
    await openWithClick(w);
    await w.get('[role="menu"]').trigger('keydown', { key: 'x' });
    expect(w.find('[role="menu"]').exists()).toBe(true);
  });

  it('closes on Escape and on Tab, returning focus to the trigger', async () => {
    const w = mountMenu(VIDEO);
    for (const key of ['Escape', 'Tab']) {
      await openWithClick(w);
      await w.get('[role="menu"]').trigger('keydown', { key });
      expect(w.find('[role="menu"]').exists()).toBe(false);
      expect(document.activeElement).toBe(w.get('[data-testid="handoff-trigger"]').element);
    }
  });

  it('closes on an outside click without stealing focus', async () => {
    const w = mountMenu(VIDEO);
    await openWithClick(w);
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(w.find('[role="menu"]').exists()).toBe(false);
  });

  it('opens the chosen studio with the asset id and closes the menu', async () => {
    const w = mountMenu(VIDEO);
    await openWithClick(w);
    await w.get('[data-testid="handoff-tools-autocaption"]').trigger('click');
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'tools-autocaption',
      query: { asset: 'v1' },
    });
    expect(w.find('[role="menu"]').exists()).toBe(false);
  });
});
