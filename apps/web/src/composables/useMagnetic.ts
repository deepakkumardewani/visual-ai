import { onBeforeUnmount, onMounted, type Ref } from 'vue';

import { useReducedMotion } from '@/composables/useReducedMotion';

/**
 * Adds a magnetic hover effect to an element — the element softly follows the
 * cursor within its bounding box. Strength 0 disables the effect (no-op).
 * All motion is gated by `prefers-reduced-motion`.
 */
export function useMagnetic(el: Ref<HTMLElement | null>, strength = 0.3) {
  const reduced = useReducedMotion();

  if (strength === 0) return;

  // When the component is a router-link, `ref` holds the component instance.
  // Unwrap to the actual DOM node via $el if necessary.
  function dom(): HTMLElement | null {
    const v = el.value as any;
    if (!v) return null;
    return v.$el instanceof HTMLElement ? v.$el : v instanceof HTMLElement ? v : null;
  }

  function onMouseMove(e: MouseEvent) {
    const node = dom();
    if (reduced.value || !node) return;
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    node.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function onMouseEnter() {
    const node = dom();
    if (!node) return;
    node.style.transition = 'transform 0.1s ease';
  }

  function onMouseLeave() {
    const node = dom();
    if (!node) return;
    node.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
    node.style.transform = '';
  }

  onMounted(() => {
    const node = dom();
    if (!node) return;
    node.addEventListener('mousemove', onMouseMove);
    node.addEventListener('mouseenter', onMouseEnter);
    node.addEventListener('mouseleave', onMouseLeave);
  });

  onBeforeUnmount(() => {
    const node = dom();
    if (!node) return;
    node.removeEventListener('mousemove', onMouseMove);
    node.removeEventListener('mouseenter', onMouseEnter);
    node.removeEventListener('mouseleave', onMouseLeave);
  });
}
