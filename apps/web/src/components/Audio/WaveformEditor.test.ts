import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import WaveformEditor from '@/components/Audio/WaveformEditor.vue';
import waveformEditorSource from '@/components/Audio/WaveformEditor.vue?raw';
import {
  createEditState,
  cut,
  addFade,
  type EditState,
  type TimeRange,
} from '@/utils/audioEditMath';

interface FakeRegion {
  id: string;
  start: number;
  end: number;
  color?: string;
  drag?: boolean;
  resize?: boolean;
  element?: HTMLElement;
  remove: ReturnType<typeof vi.fn>;
  setOptions: ReturnType<typeof vi.fn>;
}

const h = vi.hoisted(() => {
  const state = {
    surfaceOptions: undefined as Record<string, unknown> | undefined,
    surface: undefined as
      | { on: unknown; zoom: unknown; destroy: unknown; handlers: Record<string, () => void> }
      | undefined,
    regionList: [] as unknown[],
    regionHandlers: {} as Record<string, (region: unknown) => void>,
    dragSelection: undefined as Record<string, unknown> | undefined,
    timelineOptions: undefined as Record<string, unknown> | undefined,
    omitElement: false,
  };
  return state;
});

const zoomSpy = vi.fn();
const destroySpy = vi.fn();
const addRegionSpy = vi.fn();

function makeRegion(options: Partial<FakeRegion> & { id: string }): FakeRegion {
  const region: FakeRegion = {
    start: 0,
    end: 0,
    ...options,
    element: h.omitElement ? undefined : document.createElement('div'),
    remove: vi.fn(() => {
      h.regionList = h.regionList.filter((item) => item !== region);
    }),
    setOptions: vi.fn((next: Partial<FakeRegion>) => Object.assign(region, next)),
  };
  return region;
}

const regionsPlugin = {
  getRegions: () => [...(h.regionList as FakeRegion[])],
  addRegion: (options: Partial<FakeRegion> & { id: string }) => {
    addRegionSpy(options);
    const region = makeRegion(options);
    h.regionList.push(region);
    return region;
  },
  enableDragSelection: (options: Record<string, unknown>) => {
    h.dragSelection = options;
  },
  on: (name: string, handler: (region: unknown) => void) => {
    h.regionHandlers[name] = handler;
  },
};

vi.mock('wavesurfer.js', () => ({
  default: {
    create: (options: Record<string, unknown>) => {
      h.surfaceOptions = options;
      const handlers: Record<string, () => void> = {};
      h.surface = {
        handlers,
        on: (name: string, handler: () => void) => {
          handlers[name] = handler;
        },
        zoom: zoomSpy,
        destroy: destroySpy,
      };
      return h.surface;
    },
  },
}));
vi.mock('wavesurfer.js/dist/plugins/regions.esm.js', () => ({
  default: { create: () => regionsPlugin },
}));
vi.mock('wavesurfer.js/dist/plugins/timeline.esm.js', () => ({
  default: {
    create: (options: Record<string, unknown>) => {
      h.timelineOptions = options;
      return { timeline: true };
    },
  },
}));

const SOURCE_SECONDS = 10;
const media = { fake: 'audio-element' } as unknown as HTMLAudioElement;

let wrapper: VueWrapper | undefined;

interface Props {
  edit: EditState;
  region: TimeRange | null;
  peaks: number[];
}

function mountEditor(overrides: Partial<Props> = {}) {
  wrapper = mount(WaveformEditor, {
    props: {
      media,
      peaks: [0.1, 0.5, 0.9],
      sourceDuration: SOURCE_SECONDS,
      edit: createEditState(SOURCE_SECONDS),
      region: null,
      title: 'Night Drive',
      ...overrides,
    },
  });
  return wrapper;
}

const fireReady = () => h.surface!.handlers.ready();
const staticRegions = () =>
  (h.regionList as FakeRegion[]).filter((region) => region.id.startsWith('static-'));
const selection = () => (h.regionList as FakeRegion[]).find((region) => region.id === 'selection');

describe('WaveformEditor', () => {
  beforeEach(() => {
    h.regionList = [];
    h.regionHandlers = {};
    h.omitElement = false;
    h.surface = undefined;
    zoomSpy.mockClear();
    destroySpy.mockClear();
    addRegionSpy.mockClear();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('setup', () => {
    it('binds the shared media element, passes peaks and never autoplays', () => {
      mountEditor();
      expect(h.surfaceOptions).toMatchObject({
        media,
        peaks: [[0.1, 0.5, 0.9]],
        duration: SOURCE_SECONDS,
        height: 96,
        autoplay: false,
        autoScroll: true,
      });
      expect(h.timelineOptions).toEqual({ height: 20 });
    });

    it('turns auto-scroll off under prefers-reduced-motion', () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
          matches: true,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
        })),
      );
      mountEditor();
      expect(h.surfaceOptions?.autoScroll).toBe(false);
    });

    it('enables drag selection with the minimum region length', () => {
      mountEditor();
      expect(h.dragSelection).toMatchObject({ id: 'selection', minLength: 0.1 });
    });

    it('destroys the waveform on unmount', () => {
      mountEditor();
      wrapper!.unmount();
      wrapper = undefined;
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('markup', () => {
    it('shows the edited length', () => {
      const edit = cut(createEditState(SOURCE_SECONDS), { start: 2, end: 6 });
      const view = mountEditor({ edit });
      expect(view.get('[data-testid="editor-duration"]').text()).toBe('0:06');
    });

    it('labels the waveform group with the track title and the bracket keys', () => {
      const view = mountEditor();
      expect(view.get('[role="group"]').attributes('aria-label')).toBe(
        'Waveform of Night Drive. Press [ and ] to set the selection start and end at the playhead.',
      );
    });

    it('has a labelled zoom slider', () => {
      const slider = mountEditor().get('input[type="range"]');
      expect(slider.attributes('aria-label')).toBe('Zoom waveform');
      expect(slider.attributes('min')).toBe('1');
      expect(slider.attributes('max')).toBe('20');
    });

    it('keeps region handles 44px wide and zoom targets 44px tall via CSS (AC5, AC7)', () => {
      expect(waveformEditorSource).toMatch(/part\(region-handle\)\s*{\s*width:\s*44px/);
      expect(waveformEditorSource).toContain('tw-h-11');
    });
  });

  describe('zoom', () => {
    it('zooms to the host width once the waveform is ready (fallback width in JSDOM)', () => {
      mountEditor();
      fireReady();
      expect(zoomSpy).toHaveBeenLastCalledWith(32);
    });

    it('uses the host width when it is measurable', () => {
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
      mountEditor();
      fireReady();
      expect(zoomSpy).toHaveBeenLastCalledWith(100);
    });

    it('re-zooms when the slider moves', async () => {
      const view = mountEditor();
      fireReady();
      await view.get('input[type="range"]').setValue('2');
      expect(zoomSpy).toHaveBeenLastCalledWith(64);
    });
  });

  describe('selection', () => {
    it('draws the selection region when the waveform is ready', () => {
      mountEditor({ region: { start: 2, end: 4 } });
      fireReady();
      expect(selection()).toMatchObject({ start: 2, end: 4 });
    });

    it('draws nothing without a region', () => {
      mountEditor();
      fireReady();
      expect(selection()).toBeUndefined();
    });

    it('adds, moves and removes the selection as the region prop changes', async () => {
      const view = mountEditor();
      fireReady();
      await view.setProps({ region: { start: 1, end: 3 } });
      const drawn = selection()!;
      expect(drawn).toMatchObject({ start: 1, end: 3 });

      await view.setProps({ region: { start: 2, end: 5 } });
      expect(drawn.setOptions).toHaveBeenCalledWith({ start: 2, end: 5 });

      await view.setProps({ region: null });
      expect(drawn.remove).toHaveBeenCalledTimes(1);
      expect(selection()).toBeUndefined();
    });

    it('does not touch a selection whose bounds already match', async () => {
      const view = mountEditor();
      fireReady();
      await view.setProps({ region: { start: 1, end: 3 } });
      const drawn = selection()!;
      await view.setProps({ region: { start: 1, end: 3 } });
      expect(drawn.setOptions).not.toHaveBeenCalled();
      // A same-start region with a different end still counts as a change.
      await view.setProps({ region: { start: 1, end: 4 } });
      expect(drawn.setOptions).toHaveBeenCalledTimes(1);
      await view.setProps({ region: { start: 0.5, end: 4 } });
      expect(drawn.setOptions).toHaveBeenCalledTimes(2);
    });

    it('emits the region the user drags out and replaces any earlier selection', () => {
      const view = mountEditor();
      const earlier = makeRegion({ id: 'selection', start: 0, end: 1 });
      const dragged = makeRegion({ id: 'selection', start: 3, end: 4 });
      h.regionList.push(earlier, dragged);
      h.regionHandlers['region-created'](dragged);
      expect(earlier.remove).toHaveBeenCalledTimes(1);
      expect(dragged.remove).not.toHaveBeenCalled();
      expect(view.emitted('update:region')).toEqual([[{ start: 3, end: 4 }]]);
    });

    it('ignores overlay regions it created itself', () => {
      const view = mountEditor();
      h.regionHandlers['region-created'](makeRegion({ id: 'static-0', start: 1, end: 2 }));
      expect(view.emitted('update:region')).toBeUndefined();
    });

    it('emits when the selection is resized or moved, but not for overlays', () => {
      const view = mountEditor();
      h.regionHandlers['region-updated'](makeRegion({ id: 'selection', start: 1, end: 6 }));
      h.regionHandlers['region-updated'](makeRegion({ id: 'static-0', start: 0, end: 1 }));
      expect(view.emitted('update:region')).toEqual([[{ start: 1, end: 6 }]]);
    });
  });

  describe('edit overlays', () => {
    it('draws removed ranges as passive overlays', () => {
      const edit = cut(createEditState(SOURCE_SECONDS), { start: 3, end: 5 });
      mountEditor({ edit });
      fireReady();
      const [overlay] = staticRegions();
      expect(staticRegions()).toHaveLength(1);
      expect(overlay).toMatchObject({
        id: 'static-0',
        start: 3,
        end: 5,
        drag: false,
        resize: false,
      });
      expect(overlay.element!.style.pointerEvents).toBe('none');
    });

    it('draws removed audio at the start and the end of the file', () => {
      const trimmed = { segments: [{ start: 2, end: 8 }], fades: [], normalize: false };
      mountEditor({ edit: trimmed });
      fireReady();
      expect(staticRegions().map(({ start, end }) => [start, end])).toEqual([
        [0, 2],
        [8, 10],
      ]);
    });

    it('marks the whole file removed when no segments are left', () => {
      mountEditor({ edit: { segments: [], fades: [], normalize: false } });
      fireReady();
      expect(staticRegions().map(({ start, end }) => [start, end])).toEqual([[0, 10]]);
    });

    it('draws fades after the removed ranges', () => {
      const edit = addFade(cut(createEditState(SOURCE_SECONDS), { start: 3, end: 5 }), 'in', {
        start: 0,
        end: 2,
      });
      mountEditor({ edit });
      fireReady();
      expect(staticRegions().map(({ id, start, end }) => [id, start, end])).toEqual([
        ['static-0', 3, 5],
        ['static-1', 0, 2],
      ]);
    });

    it('draws nothing for an untouched file', () => {
      mountEditor();
      fireReady();
      expect(staticRegions()).toHaveLength(0);
    });

    it('tolerates a region without a DOM element', () => {
      h.omitElement = true;
      mountEditor({ edit: cut(createEditState(SOURCE_SECONDS), { start: 3, end: 5 }) });
      expect(() => fireReady()).not.toThrow();
      expect(staticRegions()).toHaveLength(1);
    });

    it('redraws overlays when the edit changes, replacing the old ones', async () => {
      const view = mountEditor();
      fireReady();
      await view.setProps({ edit: cut(createEditState(SOURCE_SECONDS), { start: 1, end: 2 }) });
      expect(staticRegions().map(({ start, end }) => [start, end])).toEqual([[1, 2]]);
      await view.setProps({ edit: cut(createEditState(SOURCE_SECONDS), { start: 4, end: 6 }) });
      expect(staticRegions().map(({ start, end }) => [start, end])).toEqual([[4, 6]]);
    });
  });

  describe('after teardown', () => {
    it('late waveform events are harmless once the editor is gone', () => {
      const view = mountEditor({ region: { start: 1, end: 2 } });
      const { ready } = h.surface!.handlers;
      view.unmount();
      wrapper = undefined;
      addRegionSpy.mockClear();
      expect(() => ready()).not.toThrow();
      expect(() =>
        h.regionHandlers['region-created'](makeRegion({ id: 'selection', start: 1, end: 2 })),
      ).not.toThrow();
      expect(addRegionSpy).not.toHaveBeenCalled();
    });
  });
});
