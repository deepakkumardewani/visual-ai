import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyText, shareOrCopyLink } from '@/utils/share';

describe('shareOrCopyLink', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns failed when url is empty', async () => {
    await expect(shareOrCopyLink({ url: '' })).resolves.toBe('failed');
  });

  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText: vi.fn() } });

    await expect(
      shareOrCopyLink({ url: 'https://visual-ai.app/x', title: 'A title', text: 'body' }),
    ).resolves.toBe('shared');

    expect(share).toHaveBeenCalledWith({
      title: 'A title',
      text: 'body',
      url: 'https://visual-ai.app/x',
    });
  });

  it('defaults the share title when omitted', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText: vi.fn() } });

    await shareOrCopyLink({ url: 'https://visual-ai.app/x' });

    expect(share).toHaveBeenCalledWith({
      title: 'Visual AI creation',
      text: undefined,
      url: 'https://visual-ai.app/x',
    });
  });

  it('copies the url when share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(shareOrCopyLink({ url: 'https://visual-ai.app/x' })).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('https://visual-ai.app/x');
  });

  it('treats AbortError as aborted', async () => {
    const err = new Error('user dismissed');
    err.name = 'AbortError';
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(err) });

    await expect(shareOrCopyLink({ url: 'https://visual-ai.app/x' })).resolves.toBe('aborted');
  });

  it('returns failed for unexpected share errors', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('denied')) });

    await expect(shareOrCopyLink({ url: 'https://visual-ai.app/x' })).resolves.toBe('failed');
  });
});

describe('copyText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns false for empty text without touching the clipboard', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyText('')).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('writes text and returns true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyText('a prompt')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('a prompt');
  });

  it('returns false when the clipboard rejects', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) },
    });

    await expect(copyText('a prompt')).resolves.toBe(false);
  });
});
