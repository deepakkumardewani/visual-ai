import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const copyText = vi.hoisted(() => vi.fn());
const shareOrCopyLink = vi.hoisted(() => vi.fn());

vi.mock('@/utils/share', () => ({
  copyText,
  shareOrCopyLink,
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  const { ref } = await import('vue');
  return {
    ...actual,
    useEventSource: () => ({
      event: ref(null),
      data: ref(null),
      status: ref('CLOSED'),
      error: ref(null),
      open: vi.fn(),
      close: vi.fn(),
    }),
  };
});

import { useShareActions } from '@/composables/useShareActions';
import { useAppStore } from '@/stores/app';

function setupShare() {
  let result: ReturnType<typeof useShareActions>;
  mount({
    setup() {
      result = useShareActions();
      return {};
    },
    template: '<div />',
  });
  return result!;
}

describe('useShareActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('toasts when a link is copied or fails', async () => {
    const { shareLink } = setupShare();
    const app = useAppStore();

    shareOrCopyLink.mockResolvedValueOnce('copied');
    await expect(shareLink({ url: 'https://visual-ai.app/x' })).resolves.toBe('copied');
    expect(app.snackbarText).toBe('Link copied');
    expect(app.snackbar).toBe(true);

    shareOrCopyLink.mockResolvedValueOnce('failed');
    await expect(shareLink({ url: 'https://visual-ai.app/x' })).resolves.toBe('failed');
    expect(app.snackbarText).toBe('Could not share link');
  });

  it('does not toast when the native share sheet is used', async () => {
    const { shareLink } = setupShare();
    shareOrCopyLink.mockResolvedValueOnce('shared');
    await expect(shareLink({ url: 'https://visual-ai.app/x' })).resolves.toBe('shared');
    expect(useAppStore().snackbar).toBe(false);
  });

  it('copies a trimmed prompt and reports empty/failure cases', async () => {
    const { copyPrompt } = setupShare();
    const app = useAppStore();

    await expect(copyPrompt('   ')).resolves.toBe(false);
    expect(app.snackbarText).toBe('No prompt to copy');

    copyText.mockResolvedValueOnce(true);
    await expect(copyPrompt('  neon rain  ')).resolves.toBe(true);
    expect(copyText).toHaveBeenCalledWith('neon rain');
    expect(app.snackbarText).toBe('Prompt copied');

    copyText.mockResolvedValueOnce(false);
    await expect(copyPrompt('neon rain')).resolves.toBe(false);
    expect(app.snackbarText).toBe('Could not copy prompt');
  });
});
