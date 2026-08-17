export type ShareOutcome = 'shared' | 'copied' | 'aborted' | 'failed';

export type ShareLinkOptions = {
  url: string;
  title?: string;
  text?: string;
};

/**
 * Prefer Web Share API; fall back to copying the URL to the clipboard.
 * AbortError (user dismissed the sheet) is treated as a no-op success path.
 */
export async function shareOrCopyLink(options: ShareLinkOptions): Promise<ShareOutcome> {
  const { url, title = 'Visual AI creation', text } = options;
  if (!url) return 'failed';

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ title, text, url });
      return 'shared';
    }

    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return 'aborted';
    return 'failed';
  }
}

/** Copy arbitrary text (e.g. a prompt) to the clipboard. */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
