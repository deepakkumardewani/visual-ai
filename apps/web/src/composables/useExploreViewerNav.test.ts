import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { prefetchImageUrls, useExploreViewerNav } from '@/composables/useExploreViewerNav';

function mountNav(
  handlers: Parameters<typeof useExploreViewerNav>[0],
  options?: Parameters<typeof useExploreViewerNav>[1],
) {
  return mount({
    setup() {
      useExploreViewerNav(handlers, options);
      return {};
    },
    template: '<div />',
  });
}

describe('useExploreViewerNav', () => {
  afterEach(() => {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  });

  it('locks overflow on mount and restores it on unmount', () => {
    document.documentElement.style.overflow = 'auto';
    const wrapper = mountNav({
      onPrev: vi.fn(),
      onNext: vi.fn(),
      onEscape: vi.fn(),
    });

    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');

    wrapper.unmount();
    expect(document.documentElement.style.overflow).toBe('auto');
    expect(document.body.style.overflow).toBe('');
  });

  it('navigates with arrow keys and j/k', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const wrapper = mountNav({ onPrev, onNext, onEscape: vi.fn() });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'K' }));

    expect(onPrev).toHaveBeenCalledTimes(2);
    expect(onNext).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('handles escape, copy, and remix shortcuts', () => {
    const onEscape = vi.fn();
    const onCopyPrompt = vi.fn();
    const onRemix = vi.fn();
    const wrapper = mountNav({
      onPrev: vi.fn(),
      onNext: vi.fn(),
      onEscape,
      onCopyPrompt,
      onRemix,
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'R' }));

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(onCopyPrompt).toHaveBeenCalledTimes(1);
    expect(onRemix).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('ignores shortcuts while typing or when disabled', async () => {
    const onPrev = vi.fn();
    const enabled = ref(true);
    const wrapper = mountNav({ onPrev, onNext: vi.fn(), onEscape: vi.fn() }, { enabled });

    const input = document.createElement('input');
    document.body.appendChild(input);

    const typingEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    Object.defineProperty(typingEvent, 'target', { value: input });
    window.dispatchEvent(typingEvent);
    expect(onPrev).not.toHaveBeenCalled();

    enabled.value = false;
    await nextTick();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(onPrev).not.toHaveBeenCalled();

    input.remove();
    wrapper.unmount();
  });

  it('uses wheel delta to change images and ignores the ignore target', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const ignore = document.createElement('div');
    const child = document.createElement('span');
    ignore.appendChild(child);
    document.body.appendChild(ignore);

    const wrapper = mountNav(
      { onPrev, onNext, onEscape: vi.fn() },
      { ignoreWheelTarget: ref(ignore) },
    );

    const ignored = new WheelEvent('wheel', { deltaY: 40, cancelable: true });
    Object.defineProperty(ignored, 'target', { value: child });
    window.dispatchEvent(ignored);
    expect(onNext).not.toHaveBeenCalled();

    const next = new WheelEvent('wheel', { deltaY: 40, cancelable: true });
    window.dispatchEvent(next);
    expect(onNext).toHaveBeenCalledTimes(1);

    const tiny = new WheelEvent('wheel', { deltaY: 2, cancelable: true });
    window.dispatchEvent(tiny);
    expect(onNext).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    ignore.remove();
  });

  it('goes previous on upward wheel and ignores disabled or debounced wheels', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const enabled = ref(true);
    const wrapper = mountNav({ onPrev, onNext, onEscape: vi.fn() }, { enabled });

    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -40, cancelable: true }));
    expect(onPrev).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, cancelable: true }));
    expect(onNext).not.toHaveBeenCalled();

    enabled.value = false;
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 40, cancelable: true }));
    expect(onNext).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('ignores copy and remix when modifiers are held or handlers are omitted', () => {
    const onCopyPrompt = vi.fn();
    const wrapper = mountNav({
      onPrev: vi.fn(),
      onNext: vi.fn(),
      onEscape: vi.fn(),
      onCopyPrompt,
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', metaKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'C', ctrlKey: true }));
    expect(onCopyPrompt).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'J' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    wrapper.unmount();
  });

  it('treats textarea and contenteditable as typing targets and allows non-elements', () => {
    const onPrev = vi.fn();
    const wrapper = mountNav({ onPrev, onNext: vi.fn(), onEscape: vi.fn() });

    const textarea = document.createElement('textarea');
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    document.body.append(textarea, editable);

    for (const target of [textarea, editable]) {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      Object.defineProperty(event, 'target', { value: target });
      window.dispatchEvent(event);
    }
    expect(onPrev).not.toHaveBeenCalled();

    const fromWindow = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    Object.defineProperty(fromWindow, 'target', { value: window });
    window.dispatchEvent(fromWindow);
    expect(onPrev).toHaveBeenCalledTimes(1);

    textarea.remove();
    editable.remove();
    wrapper.unmount();
  });
});

describe('prefetchImageUrls', () => {
  it('assigns src on Image for each defined url', () => {
    const assigned: string[] = [];
    class FakeImage {
      set src(value: string) {
        assigned.push(value);
      }
    }
    vi.stubGlobal('Image', FakeImage);

    prefetchImageUrls(['https://cdn.example/a.jpg', null, undefined, 'https://cdn.example/b.jpg']);
    expect(assigned).toEqual(['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg']);

    vi.unstubAllGlobals();
  });
});
