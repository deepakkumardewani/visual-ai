import { onBeforeUnmount, onMounted } from 'vue';

/** Styled in `landingV2.scss`. Separate from `tw-dark`, which the theme store owns. */
export const LV2_DOCUMENT_CLASS = 'lv2-doc';

/**
 * Darkens the whole document while a candidate landing page is mounted, so
 * overscroll, teleported UI and the global toast match the page. Leaves the
 * user's saved theme untouched.
 */
export function useDocumentDarkScope(): void {
  onMounted(() => document.documentElement.classList.add(LV2_DOCUMENT_CLASS));
  onBeforeUnmount(() => document.documentElement.classList.remove(LV2_DOCUMENT_CLASS));
}
