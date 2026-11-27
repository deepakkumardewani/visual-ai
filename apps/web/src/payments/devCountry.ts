/** Page query param that previews another country's pack prices during local development. */
export const DEV_COUNTRY_PARAM = 'country';

/**
 * Appends the page's `?country=` to a payments API path, in dev builds only, so INR pricing and
 * checkout can be tried locally. The API honours it only in development and test, so production
 * builds never send it and a production API would ignore it anyway.
 */
export function withDevCountry(
  path: string,
  search: string = globalThis.location?.search ?? '',
): string {
  if (!import.meta.env.DEV) return path;
  const country = new URLSearchParams(search).get(DEV_COUNTRY_PARAM)?.trim();
  if (!country) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${DEV_COUNTRY_PARAM}=${encodeURIComponent(country)}`;
}
