import type { RowDriftControl } from '@/components/LandingV2/showcaseDrift';

/** Pointer travel before a press becomes a drag; below it, the press stays a click. */
export const DRAG_THRESHOLD_PX = 6;
/** A wheel event is sideways only when |deltaX| beats |deltaY| by this factor. */
const HORIZONTAL_WHEEL_RATIO = 1.5;
/** Quiet time after the last drag or wheel before the row drifts with the scroll again. */
const RESUME_IDLE_MS = 900;
/** Pixel size of one wheel "line" for mice that report DOM_DELTA_LINE. */
const WHEEL_LINE_PX = 16;
const DRAGGING_CLASS = 'is-dragging';

interface ScrubOptions {
  /** One clipping viewport per row, in the same order as the drift rows. */
  readonly viewports: readonly HTMLElement[];
  readonly control: RowDriftControl;
}

/** Converts a wheel delta to px whatever unit the device reports. */
function wheelPx(delta: number, mode: number, pageWidth: number): number {
  if (mode === WheelEvent.DOM_DELTA_LINE) return delta * WHEEL_LINE_PX;
  if (mode === WheelEvent.DOM_DELTA_PAGE) return delta * pageWidth;
  return delta;
}

/** Per-row timers that hand the row back to the scroll drift after a pause. */
function createIdleResume(control: RowDriftControl) {
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  const cancel = (index: number): void => clearTimeout(timers.get(index));
  const schedule = (index: number): void => {
    cancel(index);
    timers.set(
      index,
      setTimeout(() => control.release(index), RESUME_IDLE_MS),
    );
  };
  const clearAll = (): void => timers.forEach((timer) => clearTimeout(timer));
  return { cancel, schedule, clearAll };
}

/** What each row's input binding needs: the drift to move and the resume timers. */
interface InputDeps {
  readonly control: RowDriftControl;
  readonly idle: ReturnType<typeof createIdleResume>;
}

/**
 * Sideways wheel or trackpad input moves the row. A vertical or diagonal
 * gesture is left alone so the page (and Lenis) scrolls as usual.
 */
function bindWheel(viewport: HTMLElement, index: number, { control, idle }: InputDeps): () => void {
  const onWheel = (event: WheelEvent): void => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) * HORIZONTAL_WHEEL_RATIO) return;
    // Consume it here so Lenis on window never turns it into page scroll.
    event.preventDefault();
    event.stopPropagation();
    control.scrubBy(index, -wheelPx(event.deltaX, event.deltaMode, viewport.clientWidth));
    idle.schedule(index);
  };
  viewport.addEventListener('wheel', onWheel, { passive: false });
  return () => viewport.removeEventListener('wheel', onWheel);
}

/**
 * Wires drag and sideways-wheel input onto each drifting row. Returns cleanup.
 */
export function bindRowScrub({ viewports, control }: ScrubOptions): () => void {
  const idle = createIdleResume(control);
  const unbinders = viewports.flatMap((viewport, index) => [
    bindWheel(viewport, index, { control, idle }),
    bindDrag(viewport, index, { control, idle }),
  ]);
  return () => {
    idle.clearAll();
    unbinders.forEach((unbind) => unbind());
  };
}

interface DragGesture {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  lastX: number;
  dragging: boolean;
}

/**
 * Press-and-drag moves the row. Nothing happens until the pointer has moved
 * DRAG_THRESHOLD_PX mostly sideways, so a plain press still clicks a tile and
 * a vertical touch swipe still scrolls the page. A finished drag swallows the
 * click that follows it.
 */
function bindDrag(viewport: HTMLElement, index: number, { control, idle }: InputDeps): () => void {
  let gesture: DragGesture | null = null;
  let suppressClick = false;

  const begin = (active: DragGesture): void => {
    active.dragging = true;
    viewport.setPointerCapture(active.pointerId);
    viewport.classList.add(DRAGGING_CLASS);
    idle.cancel(index);
    // The press focused the tile under it; a drag is not a choice of that tile, so drop the lift.
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && viewport.contains(focused)) focused.blur();
  };
  const onDown = (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      dragging: false,
    };
  };
  const onMove = (event: PointerEvent): void => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (!gesture.dragging) {
      const intent = readIntent(gesture, event);
      if (intent === 'vertical') gesture = null;
      if (intent !== 'sideways' || !gesture) return;
      begin(gesture);
    }
    control.scrubBy(index, event.clientX - gesture.lastX);
    gesture.lastX = event.clientX;
  };
  const onEnd = (event: PointerEvent): void => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    if (gesture.dragging) {
      suppressClick = event.type === 'pointerup';
      viewport.classList.remove(DRAGGING_CLASS);
      idle.schedule(index);
      // The click (if any) fires right after pointerup; forget the flag after it.
      setTimeout(() => (suppressClick = false), 0);
    }
    gesture = null;
  };
  const onClick = (event: MouseEvent): void => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  };
  const onDragStart = (event: DragEvent): void => event.preventDefault();

  const listeners: [string, EventListener, AddEventListenerOptions?][] = [
    ['pointerdown', onDown as EventListener],
    ['pointermove', onMove as EventListener],
    ['pointerup', onEnd as EventListener],
    ['pointercancel', onEnd as EventListener],
    ['click', onClick as EventListener, { capture: true }],
    ['dragstart', onDragStart as EventListener],
  ];
  listeners.forEach(([type, fn, opts]) => viewport.addEventListener(type, fn, opts));
  return () => {
    listeners.forEach(([type, fn, opts]) => viewport.removeEventListener(type, fn, opts));
    viewport.classList.remove(DRAGGING_CLASS);
  };
}

type DragIntent = 'undecided' | 'sideways' | 'vertical';

/** Classifies a press once the pointer leaves the dead zone; vertical presses are never drags. */
function readIntent(gesture: DragGesture, event: PointerEvent): DragIntent {
  const dx = Math.abs(event.clientX - gesture.startX);
  const dy = Math.abs(event.clientY - gesture.startY);
  if (Math.max(dx, dy) < DRAG_THRESHOLD_PX) return 'undecided';
  return dx > dy ? 'sideways' : 'vertical';
}
