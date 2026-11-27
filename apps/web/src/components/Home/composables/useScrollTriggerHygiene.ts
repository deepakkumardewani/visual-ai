import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onBeforeUnmount, onMounted } from 'vue';

/**
 * Page-level ScrollTrigger housekeeping. Call once from the page component:
 * children (the scenes) mount first, so by now every trigger exists.
 */
export function useScrollTriggerHygiene(): void {
  let active = true;

  onMounted(() => {
    // Mobile URL-bar show/hide would otherwise refresh every pin mid-scroll.
    ScrollTrigger.config({ ignoreMobileResize: true });
    ScrollTrigger.sort();
    // Web fonts change text height, which moves every trigger below the hero.
    document.fonts.ready
      .then(() => {
        if (active) ScrollTrigger.refresh();
      })
      .catch((error: Error) => console.error('[Home] font load before refresh failed', error));
  });

  onBeforeUnmount(() => {
    active = false;
  });
}
