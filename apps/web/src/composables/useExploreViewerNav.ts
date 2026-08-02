import { onMounted, onUnmounted, type Ref } from 'vue';

const WHEEL_DEBOUNCE_MS = 320;
const WHEEL_THRESHOLD = 8;

export type ExploreViewerNavHandlers = {
  onPrev: () => void;
  onNext: () => void;
  onEscape: () => void;
  onCopyPrompt?: () => void;
  onRemix?: () => void;
};

/**
 * Keyboard + wheel navigation for the Explore image viewer.
 * Wheel is ignored while the pointer is over `ignoreWheelTarget`.
 * Always prevents default wheel outside that target so the page cannot scroll/wiggle.
 */
export function useExploreViewerNav(
  handlers: ExploreViewerNavHandlers,
  options: {
    enabled?: Ref<boolean>;
    ignoreWheelTarget?: Ref<HTMLElement | null>;
  } = {},
) {
  let lastWheelAt = 0;
  let previousOverflow = '';

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  function onKeydown(event: KeyboardEvent) {
    if (options.enabled && !options.enabled.value) return;
    if (isTypingTarget(event.target)) return;

    const key = event.key;
    if (key === 'ArrowLeft' || key === 'j' || key === 'J') {
      event.preventDefault();
      handlers.onPrev();
      return;
    }
    if (key === 'ArrowRight' || key === 'k' || key === 'K') {
      event.preventDefault();
      handlers.onNext();
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      handlers.onEscape();
      return;
    }
    if ((key === 'c' || key === 'C') && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      handlers.onCopyPrompt?.();
      return;
    }
    if ((key === 'r' || key === 'R') && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      handlers.onRemix?.();
    }
  }

  function onWheel(event: WheelEvent) {
    if (options.enabled && !options.enabled.value) return;
    const ignoreEl = options.ignoreWheelTarget?.value;
    if (ignoreEl && event.target instanceof Node && ignoreEl.contains(event.target)) {
      return;
    }

    // Stop document scroll / rubber-band even for tiny deltas.
    event.preventDefault();

    const delta = event.deltaY;
    if (Math.abs(delta) < WHEEL_THRESHOLD) return;

    const now = Date.now();
    if (now - lastWheelAt < WHEEL_DEBOUNCE_MS) return;
    lastWheelAt = now;

    if (delta > 0) handlers.onNext();
    else handlers.onPrev();
  }

  onMounted(() => {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKeydown);
    window.addEventListener('wheel', onWheel, { passive: false });
  });

  onUnmounted(() => {
    document.documentElement.style.overflow = previousOverflow;
    document.body.style.overflow = '';

    window.removeEventListener('keydown', onKeydown);
    window.removeEventListener('wheel', onWheel);
  });
}

export function prefetchImageUrls(urls: Array<string | undefined | null>) {
  for (const url of urls) {
    if (!url) continue;
    const img = new Image();
    img.src = url;
  }
}
