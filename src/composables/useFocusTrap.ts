import { onUnmounted, watch, type Ref } from "vue";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
  );
}

/**
 * Traps Tab focus within a container while active.
 */
export function useFocusTrap(containerRef: Ref<HTMLElement | null>, active: Ref<boolean>): void {
  let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  const cleanup = () => {
    if (keydownHandler && containerRef.value) {
      containerRef.value.removeEventListener("keydown", keydownHandler);
    }
    keydownHandler = null;
  };

  watch(
    [active, containerRef],
    ([isActive, container]) => {
      cleanup();
      if (!isActive || !container) return;

      const focusable = getFocusableElements(container);
      focusable[0]?.focus();

      keydownHandler = (event: KeyboardEvent) => {
        if (event.key !== "Tab") return;

        const elements = getFocusableElements(container);
        if (elements.length === 0) return;

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      container.addEventListener("keydown", keydownHandler);
    },
    { immediate: true },
  );

  onUnmounted(cleanup);
}
