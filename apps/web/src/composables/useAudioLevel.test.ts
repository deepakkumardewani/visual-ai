import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockStream, installAudioContext, installGetUserMedia } from '@/test/voiceMediaMocks';

import { useAudioLevel } from '@/composables/useAudioLevel';

function mountAudioLevel(onFallback?: () => void) {
  let handle: ReturnType<typeof useAudioLevel>;
  const wrapper = mount({
    setup() {
      handle = useAudioLevel({ onFallback });
      return {};
    },
    template: '<div />',
  });
  return { handle: handle!, wrapper };
}

describe('useAudioLevel', () => {
  beforeEach(() => {
    installAudioContext();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts from a provided stream and updates level from analyser data', async () => {
    const stream = createMockStream();
    const { handle } = mountAudioLevel();

    await handle.start(stream);

    expect(handle.reactiveWaveform.value).toBe(true);
    expect(handle.level.value).toBeGreaterThan(0);
  });

  it('requests getUserMedia when no stream override is passed', async () => {
    const getUserMedia = installGetUserMedia();
    const { handle } = mountAudioLevel();

    await handle.start();
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(handle.level.value).toBeGreaterThan(0);
  });

  it('invokes onFallback and disables reactive waveform when setup fails', async () => {
    const onFallback = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    const { handle } = mountAudioLevel(onFallback);
    await handle.start();

    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(handle.reactiveWaveform.value).toBe(false);
    expect(handle.level.value).toBe(0);
  });

  it('stop resets level, closes audio context, and stops tracks', async () => {
    const stream = createMockStream();
    const { audioContext } = installAudioContext();
    const { handle } = mountAudioLevel();

    await handle.start(stream);
    handle.stop();

    expect(handle.level.value).toBe(0);
    expect(audioContext.close).toHaveBeenCalled();
    expect(stream.getTracks()[0]?.stop).toHaveBeenCalled();
  });

  it('ignores animation ticks after teardown', async () => {
    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });

    const stream = createMockStream();
    const { handle } = mountAudioLevel();
    await handle.start(stream);
    handle.stop();
    (rafCallback as FrameRequestCallback | null)?.(0);

    expect(handle.level.value).toBe(0);
  });

  it('cleans up on component unmount', async () => {
    const stream = createMockStream();
    const { handle, wrapper } = mountAudioLevel();
    await handle.start(stream);

    wrapper.unmount();
    expect(handle.level.value).toBe(0);
    expect(stream.getTracks()[0]?.stop).toHaveBeenCalled();
  });
});
