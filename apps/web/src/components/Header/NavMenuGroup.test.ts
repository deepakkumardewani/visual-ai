import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const routeName = ref<string>('create');
const push = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => ({ name: routeName.value, query: {}, params: {} }),
  useRouter: () => ({ push }),
}));

import NavMenuGroup from '@/components/Header/NavMenuGroup.vue';
import { APP_SURFACE, AUDIO_MENU_ITEMS, NAV_MENU_GROUPS } from '@/utils/dashboardRoutes';

const audioGroup = NAV_MENU_GROUPS.find((group) => group.id === 'audio')!;
const toolsGroup = NAV_MENU_GROUPS.find((group) => group.id === 'tools')!;

let wrapper: VueWrapper | undefined;

function mountGroup(props: Record<string, unknown> = {}) {
  wrapper = mount(NavMenuGroup, {
    props: { group: audioGroup, active: false, ...props },
    attachTo: document.body,
  });
  return wrapper;
}

const trigger = () => document.querySelector<HTMLButtonElement>('[data-testid="nav-menu-audio"]')!;
const panel = () => document.querySelector('[data-testid="nav-menu-panel-audio"]');
const item = (name: string) =>
  document.querySelector<HTMLButtonElement>(`[data-testid="nav-menu-item-${name}"]`)!;

async function openWithEnter() {
  trigger().focus();
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  // Popover focuses the first item after its own awaited nextTick, so wait for that focus
  // instead of guessing a number of ticks.
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(item(audioGroup.items[0]!.routeName));
  });
}

function press(target: Element, key: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('NavMenuGroup', () => {
  beforeEach(() => {
    routeName.value = 'create';
    push.mockReset();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.innerHTML = '';
  });

  it('renders a labelled trigger with the group label and a closed menu', () => {
    mountGroup();

    expect(trigger().textContent).toContain('Audio');
    expect(trigger().getAttribute('aria-label')).toBe('Audio menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(panel()).toBeNull();
  });

  it('opens on click and lists every item with its description', async () => {
    mountGroup();

    trigger().click();
    await wrapper!.vm.$nextTick();

    expect(panel()).not.toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    for (const entry of AUDIO_MENU_ITEMS) {
      expect(item(entry.routeName).textContent).toContain(entry.label);
      expect(
        document.querySelector(`[data-testid="nav-menu-item-desc-${entry.routeName}"]`)
          ?.textContent,
      ).toContain(entry.description);
    }
  });

  it('opens with Enter, Space and ArrowDown on the trigger', async () => {
    for (const key of ['Enter', ' ', 'ArrowDown']) {
      mountGroup();
      trigger().focus();
      press(trigger(), key);
      await wrapper!.vm.$nextTick();

      expect(panel(), `key "${key}"`).not.toBeNull();
      wrapper!.unmount();
      wrapper = undefined;
      document.body.innerHTML = '';
    }
  });

  it('never opens on hover', async () => {
    mountGroup();

    trigger().dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    trigger().dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await wrapper!.vm.$nextTick();

    expect(panel()).toBeNull();
  });

  it('moves focus with ArrowDown and ArrowUp, wrapping at both ends', async () => {
    mountGroup();
    await openWithEnter();
    const [first, second, third] = AUDIO_MENU_ITEMS.map((entry) => item(entry.routeName));
    first!.focus();

    press(first!, 'ArrowDown');
    expect(document.activeElement).toBe(second);
    press(second!, 'ArrowDown');
    expect(document.activeElement).toBe(third);
    press(third!, 'ArrowDown');
    expect(document.activeElement).toBe(first);
    press(first!, 'ArrowUp');
    expect(document.activeElement).toBe(third);
    press(third!, 'ArrowUp');
    expect(document.activeElement).toBe(second);
  });

  it('jumps to the first and last items with Home and End', async () => {
    mountGroup();
    await openWithEnter();
    const items = AUDIO_MENU_ITEMS.map((entry) => item(entry.routeName));
    items[1]!.focus();

    press(items[1]!, 'End');
    expect(document.activeElement).toBe(items[items.length - 1]);
    press(items[items.length - 1]!, 'Home');
    expect(document.activeElement).toBe(items[0]);
  });

  it('navigates and closes when an item is activated', async () => {
    mountGroup();
    await openWithEnter();

    item(APP_SURFACE.AUDIO_MUSIC).click();
    await wrapper!.vm.$nextTick();

    expect(push).toHaveBeenCalledWith({ name: APP_SURFACE.AUDIO_MUSIC });
    expect(panel()).toBeNull();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    mountGroup();
    await openWithEnter();
    item(APP_SURFACE.AUDIO_SONG).focus();

    press(item(APP_SURFACE.AUDIO_SONG), 'Escape');
    await wrapper!.vm.$nextTick();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on Tab and hands focus back to the trigger', async () => {
    mountGroup();
    await openWithEnter();
    item(APP_SURFACE.AUDIO_SONG).focus();

    press(item(APP_SURFACE.AUDIO_SONG), 'Tab');
    await wrapper!.vm.$nextTick();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('marks only the current route item with aria-current', async () => {
    routeName.value = APP_SURFACE.AUDIO_SPEECH;
    mountGroup();
    await openWithEnter();

    expect(item(APP_SURFACE.AUDIO_SPEECH).getAttribute('aria-current')).toBe('page');
    expect(item(APP_SURFACE.AUDIO_SONG).hasAttribute('aria-current')).toBe(false);
  });

  it('styles the trigger as active only when the group is active', () => {
    mountGroup({ active: true });
    expect(trigger().className).toContain('tw-font-semibold');
    wrapper!.unmount();
    document.body.innerHTML = '';

    mountGroup({ active: false });
    expect(trigger().className).not.toContain('tw-font-semibold');
  });

  it('removes the trigger from the tab order when not tabbable and keeps it by default', () => {
    mountGroup({ tabbable: false });
    expect(trigger().getAttribute('tabindex')).toBe('-1');
    wrapper!.unmount();
    document.body.innerHTML = '';

    mountGroup();
    expect(trigger().getAttribute('tabindex')).toBe('0');
  });

  it('keeps a one-line truncating description class and 16px icon', async () => {
    mountGroup();
    await openWithEnter();
    const entry = AUDIO_MENU_ITEMS[0]!;

    expect(
      document.querySelector(`[data-testid="nav-menu-item-desc-${entry.routeName}"]`)?.className,
    ).toContain('tw-truncate');
    expect(item(entry.routeName).querySelector('svg')?.getAttribute('width')).toBe('16');
  });

  it('renders the tools group items under their own ids', async () => {
    mountGroup({ group: toolsGroup });
    document.querySelector<HTMLButtonElement>('[data-testid="nav-menu-tools"]')!.click();
    await wrapper!.vm.$nextTick();

    expect(document.querySelectorAll('[data-testid^="nav-menu-item-tools-"]')).toHaveLength(4);
  });
});
