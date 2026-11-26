import type { MediaAssetDto } from '@visual-ai/shared';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CaptionResult from '@/components/Tools/CaptionResult.vue';

const ASSET = {
  id: 'c1',
  type: 'video',
  title: 'Captioned',
  url: 'https://cdn.test/c.mp4',
  transcriptUrl: 'https://cdn.test/t.txt',
} as MediaAssetDto;

let wrapper: VueWrapper | undefined;

function mountResult(asset: MediaAssetDto = ASSET) {
  wrapper = mount(CaptionResult, {
    props: { asset },
    global: { stubs: { ResultCard: { template: '<div data-testid="result-card-stub" />' } } },
  });
  return wrapper;
}

function stubTranscript(text: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(text) }),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CaptionResult', () => {
  it('shows the transcript as escaped plain text', async () => {
    stubTranscript('<img src=x onerror=alert(1)> hello');
    const w = mountResult();
    await flushPromises();
    const pre = w.get('[data-testid="transcript-text"]');
    expect(pre.text()).toBe('<img src=x onerror=alert(1)> hello');
    expect(pre.find('img').exists()).toBe(false);
  });

  it('omits the transcript section when the asset has none', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const w = mountResult({ ...ASSET, transcriptUrl: undefined });
    expect(w.find('#transcript-heading').exists()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('disables Copy and Download until the transcript has loaded', async () => {
    stubTranscript('hi');
    const w = mountResult();
    expect(w.get('[data-testid="transcript-copy"]').attributes('disabled')).toBeDefined();
    await flushPromises();
    expect(w.get('[data-testid="transcript-copy"]').attributes('disabled')).toBeUndefined();
    expect(w.get('[data-testid="transcript-download"]').attributes('disabled')).toBeUndefined();
  });

  it('shows fallback copy when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const w = mountResult();
    await flushPromises();
    expect(w.get('[role="status"]').text()).toBe(
      'The transcript could not be loaded. Download it instead.',
    );
    expect(w.find('[data-testid="transcript-text"]').exists()).toBe(false);
    const link = w.get('[data-testid="transcript-download-link"]');
    expect(link.attributes('href')).toBe(ASSET.transcriptUrl);
    expect(link.attributes('download')).toBe('transcript.txt');
    expect(w.find('[data-testid="transcript-download"]').exists()).toBe(false);
  });

  it('shows fallback copy when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const w = mountResult();
    await flushPromises();
    expect(w.find('[role="status"]').exists()).toBe(true);
  });

  it('reloads when the transcript url changes', async () => {
    stubTranscript('first');
    const w = mountResult();
    await flushPromises();
    stubTranscript('second');
    await w.setProps({ asset: { ...ASSET, transcriptUrl: 'https://cdn.test/t2.txt' } });
    await flushPromises();
    expect(w.get('[data-testid="transcript-text"]').text()).toBe('second');
  });

  it('copies the transcript and flashes Copied, then resets', async () => {
    stubTranscript('hello');
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const w = mountResult();
    await flushPromises();
    await w.get('[data-testid="transcript-copy"]').trigger('click');
    await flushPromises();
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(w.get('[data-testid="transcript-copy"]').text()).toBe('Copied');
    vi.advanceTimersByTime(2000);
    await flushPromises();
    expect(w.get('[data-testid="transcript-copy"]').text()).toBe('Copy');
  });

  it('keeps the Copy label when the clipboard rejects', async () => {
    stubTranscript('hello');
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const w = mountResult();
    await flushPromises();
    await w.get('[data-testid="transcript-copy"]').trigger('click');
    await flushPromises();
    expect(w.get('[data-testid="transcript-copy"]').text()).toBe('Copy');
  });

  it('downloads the transcript as transcript.txt', async () => {
    stubTranscript('hello');
    const createObjectURL = vi.fn(() => 'blob:t');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const w = mountResult();
    await flushPromises();
    await w.get('[data-testid="transcript-download"]').trigger('click');
    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
    expect(await blob.text()).toBe('hello');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:t');
  });
});
