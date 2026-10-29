import { STT_SILENCE_LEVEL_THRESHOLD } from '@visual-ai/shared';
import { onBeforeUnmount, ref, type Ref } from 'vue';

export type UseAudioLevelOptions = {
  onFallback?: () => void;
};

export function useAudioLevel(options: UseAudioLevelOptions = {}) {
  const level = ref(0);
  const reactiveWaveform = ref(true);

  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let stream: MediaStream | null = null;
  let rafId = 0;
  let peakLevel = 0;
  let dataArray: Uint8Array | null = null;

  function stopTracks() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  function closeAudioContext() {
    if (audioContext && audioContext.state !== 'closed') {
      void audioContext.close();
    }
    audioContext = null;
    analyser = null;
    dataArray = null;
  }

  function cancelAnimation() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function tick() {
    if (!analyser || !dataArray) {
      return;
    }
    analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i += 1) {
      sum += dataArray[i] ?? 0;
    }
    level.value = sum / (dataArray.length * 255);
    peakLevel = Math.max(peakLevel, level.value);
    rafId = requestAnimationFrame(tick);
  }

  async function start(streamOverride?: MediaStream): Promise<void> {
    stop();
    peakLevel = 0;
    try {
      stream = streamOverride ?? (await navigator.mediaDevices.getUserMedia({ audio: true }));
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      reactiveWaveform.value = true;
      tick();
    } catch {
      reactiveWaveform.value = false;
      options.onFallback?.();
      stop();
    }
  }

  function stop() {
    cancelAnimation();
    level.value = 0;
    stopTracks();
    closeAudioContext();
  }

  // Without a working analyser we cannot measure loudness, so never claim silence.
  function hasHeardSpeech(): boolean {
    return !reactiveWaveform.value || peakLevel >= STT_SILENCE_LEVEL_THRESHOLD;
  }

  onBeforeUnmount(stop);

  return {
    level,
    reactiveWaveform,
    start,
    stop,
    hasHeardSpeech,
  };
}

export type AudioLevelHandle = {
  level: Ref<number>;
  reactiveWaveform: Ref<boolean>;
  start: (stream?: MediaStream) => Promise<void>;
  stop: () => void;
  hasHeardSpeech: () => boolean;
};
