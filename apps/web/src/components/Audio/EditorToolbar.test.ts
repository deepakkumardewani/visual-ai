import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import EditorToolbar from '@/components/Audio/EditorToolbar.vue';

type Props = InstanceType<typeof EditorToolbar>['$props'];

const ENABLED: Props = {
  blockedReason: null,
  hasRegion: true,
  canUndo: true,
  canRedo: true,
  isEdited: true,
  normalized: false,
};

const LABELS = ['Trim', 'Cut', 'Fade in', 'Fade out', 'Normalize', 'Undo', 'Redo', 'Reset'];
const IDS = ['trim', 'cut', 'fade-in', 'fade-out', 'normalize', 'undo', 'redo', 'reset'];

function render(props: Partial<Props> = {}) {
  return mount(EditorToolbar, {
    props: { ...ENABLED, ...props },
    global: { stubs: { 'font-awesome-icon': true } },
    attachTo: document.body,
  });
}

const tool = (wrapper: ReturnType<typeof render>, id: string) =>
  wrapper.get(`[data-testid="editor-${id}"]`);

describe('EditorToolbar', () => {
  describe('structure', () => {
    it('is a labelled toolbar with the eight tools in order, each with a visible label', () => {
      const wrapper = render();
      expect(wrapper.get('[role="toolbar"]').attributes('aria-label')).toBe('Audio edit tools');
      const buttons = wrapper.findAll('button');
      expect(buttons.map((button) => button.text())).toEqual(LABELS);
      expect(buttons.map((button) => button.attributes('data-testid'))).toEqual(
        IDS.map((id) => `editor-${id}`),
      );
      wrapper.unmount();
    });

    it('gives every button a 44px minimum height and a focus ring (AC5, AC6)', () => {
      const wrapper = render();
      for (const button of wrapper.findAll('button')) {
        expect(button.classes()).toContain('tw-min-h-11');
        expect(button.classes()).toContain('focus-visible:tw-outline-accent');
        expect(button.classes()).toContain('motion-reduce:tw-transition-none');
      }
      wrapper.unmount();
    });

    it('lets the toolbar wrap instead of scrolling sideways (AC5)', () => {
      const wrapper = render();
      expect(wrapper.get('[role="toolbar"]').classes()).toContain('tw-flex-wrap');
      wrapper.unmount();
    });
  });

  describe('hint', () => {
    it('shows the exact empty-selection copy before any selection', () => {
      const wrapper = render({ hasRegion: false, blockedReason: 'no-region' });
      expect(wrapper.get('[data-testid="editor-hint"]').text()).toBe(
        'Drag on the waveform to select a part.',
      );
      wrapper.unmount();
    });

    it('hides the hint once a region exists', () => {
      const wrapper = render();
      expect(wrapper.find('[data-testid="editor-hint"]').exists()).toBe(false);
      wrapper.unmount();
    });
  });

  describe('disabled reasons', () => {
    it('disables the four region tools with a reason until a region exists (AC1)', () => {
      const wrapper = render({ hasRegion: false, blockedReason: 'no-region' });
      for (const id of ['trim', 'cut', 'fade-in', 'fade-out']) {
        const button = tool(wrapper, id);
        expect(button.attributes('aria-disabled')).toBe('true');
        expect(button.attributes('title')).toBe('Select a part of the waveform first.');
        expect(button.get('.tw-sr-only').text()).toContain('Select a part of the waveform first.');
      }
      wrapper.unmount();
    });

    it('explains a selection that sits on removed audio', () => {
      const wrapper = render({ blockedReason: 'removed' });
      expect(tool(wrapper, 'cut').attributes('title')).toBe(
        'This selection is on audio you already removed.',
      );
      wrapper.unmount();
    });

    it('never gates normalize on the selection', () => {
      const wrapper = render({ hasRegion: false, blockedReason: 'no-region' });
      const normalize = tool(wrapper, 'normalize');
      expect(normalize.attributes('aria-disabled')).toBe('false');
      expect(normalize.attributes('title')).toBeUndefined();
      expect(normalize.find('.tw-sr-only').exists()).toBe(false);
      wrapper.unmount();
    });

    it('explains why undo, redo and reset are unavailable', () => {
      const wrapper = render({ canUndo: false, canRedo: false, isEdited: false });
      expect(tool(wrapper, 'undo').attributes('title')).toBe('Nothing to undo.');
      expect(tool(wrapper, 'redo').attributes('title')).toBe('Nothing to redo.');
      expect(tool(wrapper, 'reset').attributes('title')).toBe('There are no edits to reset.');
      wrapper.unmount();
    });

    it('enables everything when a region and history exist', () => {
      const wrapper = render();
      for (const button of wrapper.findAll('button')) {
        expect(button.attributes('aria-disabled')).toBe('false');
        expect(button.attributes('title')).toBeUndefined();
      }
      wrapper.unmount();
    });

    it('keeps disabled buttons focusable (aria-disabled, not disabled)', () => {
      const wrapper = render({ hasRegion: false, blockedReason: 'no-region' });
      expect(tool(wrapper, 'trim').attributes('disabled')).toBeUndefined();
      wrapper.unmount();
    });
  });

  describe('actions', () => {
    it.each(IDS)('emits %s when its button is clicked', async (id) => {
      const wrapper = render();
      await tool(wrapper, id).trigger('click');
      expect(wrapper.emitted('action')).toEqual([[id]]);
      wrapper.unmount();
    });

    it('does not emit for a disabled tool', async () => {
      const wrapper = render({ hasRegion: false, blockedReason: 'no-region', canUndo: false });
      await tool(wrapper, 'trim').trigger('click');
      await tool(wrapper, 'undo').trigger('click');
      expect(wrapper.emitted('action')).toBeUndefined();
      wrapper.unmount();
    });

    it('reflects the normalized state with aria-pressed on normalize only', () => {
      const off = render({ normalized: false });
      expect(tool(off, 'normalize').attributes('aria-pressed')).toBe('false');
      expect(tool(off, 'trim').attributes('aria-pressed')).toBeUndefined();
      off.unmount();
      const on = render({ normalized: true });
      expect(tool(on, 'normalize').attributes('aria-pressed')).toBe('true');
      on.unmount();
    });
  });

  describe('roving focus', () => {
    const tabindexes = (wrapper: ReturnType<typeof render>) =>
      wrapper.findAll('button').map((button) => button.attributes('tabindex'));

    it('puts only the first tool in the tab order initially', () => {
      const wrapper = render();
      expect(tabindexes(wrapper)).toEqual(['0', ...Array(7).fill('-1')]);
      wrapper.unmount();
    });

    it.each([
      ['ArrowRight', 0, 1],
      ['ArrowDown', 0, 1],
      ['ArrowLeft', 3, 2],
      ['ArrowUp', 3, 2],
      ['Home', 5, 0],
      ['End', 2, 7],
    ])('%s from tool %i focuses tool %i', async (key, from, to) => {
      const wrapper = render();
      const buttons = wrapper.findAll('button');
      await buttons[from].trigger('focus');
      await buttons[from].trigger('keydown', { key });
      expect(document.activeElement).toBe(buttons[to].element);
      expect(tabindexes(wrapper)[to]).toBe('0');
      expect(tabindexes(wrapper).filter((value) => value === '0')).toHaveLength(1);
      wrapper.unmount();
    });

    it('wraps around at both ends', async () => {
      const wrapper = render();
      const buttons = wrapper.findAll('button');
      await buttons[0].trigger('keydown', { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(buttons[7].element);
      await buttons[7].trigger('keydown', { key: 'ArrowRight' });
      expect(document.activeElement).toBe(buttons[0].element);
      wrapper.unmount();
    });

    it('prevents default for navigation keys but leaves other keys alone', async () => {
      const wrapper = render();
      const button = wrapper.findAll('button')[0];
      const arrow = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
      button.element.dispatchEvent(arrow);
      expect(arrow.defaultPrevented).toBe(true);
      const other = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      button.element.dispatchEvent(other);
      expect(other.defaultPrevented).toBe(false);
      wrapper.unmount();
    });

    it('moves the tab stop to a tool that receives focus by click or Tab', async () => {
      const wrapper = render();
      await wrapper.findAll('button')[4].trigger('focus');
      expect(tabindexes(wrapper)[4]).toBe('0');
      expect(tabindexes(wrapper)[0]).toBe('-1');
      wrapper.unmount();
    });
  });
});
