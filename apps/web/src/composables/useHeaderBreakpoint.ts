import { useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';

import { BREAKPOINT } from '@/utils/layout';

/** Header viewport tier: mobile < 768, tablet 768-1023, desktop >= 1024. */
export function useHeaderBreakpoint() {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINT.MOBILE_MAX - 1}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINT.DESKTOP_MIN}px)`);
  const isTablet = computed(() => !isMobile.value && !isDesktop.value);

  return { isMobile, isTablet, isDesktop };
}
