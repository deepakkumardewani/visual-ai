const MAX_LOGGED_VALUE_LENGTH = 64;
// Tab, newline, other control chars: the URL parser silently strips some of them,
// so `/\t/evil.com` would otherwise normalize into `//evil.com`.
const CONTROL_CHARS = /\p{Cc}/u;

/**
 * Returns `value` as a same-origin path (path + search + hash) when it is safe
 * to send a visitor there after sign-in, else undefined.
 *
 * The raw input is only pre-screened; the real check runs on the normalized
 * result, because `/.//evil.com` or `/a/..//evil.com` normalize to `//evil.com`,
 * which browsers read as a protocol-relative URL to another host.
 */
export function toSafeInternalPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || CONTROL_CHARS.test(value)) return undefined;
  if (typeof window === 'undefined') return undefined;

  try {
    const url = new URL(value, window.location.origin);
    const path = `${url.pathname}${url.search}${url.hash}`;
    const isSameOrigin = url.origin === window.location.origin;
    const isProtocolRelative = path.startsWith('//') || path.startsWith('/\\');
    return isSameOrigin && !isProtocolRelative ? path : undefined;
  } catch (error) {
    console.warn('[safeRedirect] Ignoring unparsable redirect', {
      value: value.slice(0, MAX_LOGGED_VALUE_LENGTH),
      error,
    });
    return undefined;
  }
}
