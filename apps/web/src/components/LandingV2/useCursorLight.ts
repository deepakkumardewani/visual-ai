import { gsap } from 'gsap';

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const FOLLOW_DURATION = 0.7;
const FADE_DURATION = 0.4;

/**
 * Moves a pre-positioned element to the cursor inside `area` (transform only).
 * Call from a `useSceneMotion` setup on desktop with motion allowed; returns
 * the cleanup. A no-op without a fine pointer.
 */
export function bindCursorLight(area: HTMLElement, light: HTMLElement): () => void {
  if (!window.matchMedia(FINE_POINTER_QUERY).matches) return () => undefined;

  const moveX = gsap.quickTo(light, 'x', { duration: FOLLOW_DURATION, ease: 'power3.out' });
  const moveY = gsap.quickTo(light, 'y', { duration: FOLLOW_DURATION, ease: 'power3.out' });
  const halfWidth = light.offsetWidth / 2;
  const halfHeight = light.offsetHeight / 2;

  const onMove = (event: PointerEvent): void => {
    const box = area.getBoundingClientRect();
    moveX(event.clientX - box.left - halfWidth);
    moveY(event.clientY - box.top - halfHeight);
  };
  const onEnter = (): void => void gsap.to(light, { opacity: 1, duration: FADE_DURATION });
  const onLeave = (): void => void gsap.to(light, { opacity: 0, duration: FADE_DURATION });

  area.addEventListener('pointermove', onMove);
  area.addEventListener('pointerenter', onEnter);
  area.addEventListener('pointerleave', onLeave);
  return () => {
    area.removeEventListener('pointermove', onMove);
    area.removeEventListener('pointerenter', onEnter);
    area.removeEventListener('pointerleave', onLeave);
  };
}
