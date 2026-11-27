import { onBeforeUnmount, onMounted } from 'vue';

/** Styled in `home.scss`. Separate from `tw-dark`, which the theme store owns. */
export const HOME_DOCUMENT_CLASS = 'home-doc';

/**
 * Darkens the whole document while a candidate landing page is mounted, so
 * overscroll, teleported UI and the global toast match the page. Leaves the
 * user's saved theme untouched.
 */
export function useDocumentDarkScope(): void {
  onMounted(() => document.documentElement.classList.add(HOME_DOCUMENT_CLASS));
  onBeforeUnmount(() => document.documentElement.classList.remove(HOME_DOCUMENT_CLASS));
}
