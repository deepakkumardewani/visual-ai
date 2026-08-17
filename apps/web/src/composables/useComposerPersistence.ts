import { storeToRefs } from 'pinia';
import { watch } from 'vue';

import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';

import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants';
import { MODELS, UPSCALER_MODELS } from '@/utils/models';

const STORAGE_KEY = 'visual-ai-composer-state';

interface PersistedComposerState {
  prompt: string;
  modelId: string;
  aspectRatioTitle: string;
  formatTitle: string;
  outputQuality: number;
  noOfOutputs: number;
  upscaleModelId: string;
}

let initialized = false;

function readPersisted(): PersistedComposerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedComposerState>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
      modelId: typeof parsed.modelId === 'string' ? parsed.modelId : '',
      aspectRatioTitle: typeof parsed.aspectRatioTitle === 'string' ? parsed.aspectRatioTitle : '',
      formatTitle: typeof parsed.formatTitle === 'string' ? parsed.formatTitle : '',
      outputQuality: typeof parsed.outputQuality === 'number' ? parsed.outputQuality : 0,
      noOfOutputs: typeof parsed.noOfOutputs === 'number' ? parsed.noOfOutputs : 1,
      upscaleModelId: typeof parsed.upscaleModelId === 'string' ? parsed.upscaleModelId : '',
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writePersisted(state: PersistedComposerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Restore prompt/model/settings from localStorage; watch aside store to keep them synced. */
export function useComposerPersistence() {
  if (initialized) return;
  initialized = true;

  const asideStore = useAsideStore();
  const generateStore = useGenerateStore();
  const { typingPrompt, mode, aspectRatio, imageFormat, outputQuality, noOfOutputs, upscaleModel } =
    storeToRefs(asideStore);

  const saved = readPersisted();
  if (saved) {
    typingPrompt.value = saved.prompt;
    generateStore.promptText = saved.prompt;

    const restoredMode = MODELS.find((m) => m.id === saved.modelId);
    if (restoredMode) mode.value = restoredMode;

    const restoredRatio = ASPECT_RATIOS.find((r) => r.title === saved.aspectRatioTitle);
    if (restoredRatio) aspectRatio.value = restoredRatio;

    const restoredFormat = IMAGE_FORMATS.find((f) => f.title === saved.formatTitle);
    if (restoredFormat) imageFormat.value = restoredFormat;

    outputQuality.value = saved.outputQuality;
    noOfOutputs.value = Math.max(1, saved.noOfOutputs);

    const restoredUpscale = UPSCALER_MODELS.find((m) => m.id === saved.upscaleModelId);
    if (restoredUpscale) upscaleModel.value = restoredUpscale;
  }

  watch(
    [typingPrompt, mode, aspectRatio, imageFormat, outputQuality, noOfOutputs, upscaleModel],
    () => {
      writePersisted({
        prompt: typingPrompt.value,
        modelId: mode.value.id,
        aspectRatioTitle: aspectRatio.value.title,
        formatTitle: imageFormat.value.title,
        outputQuality: outputQuality.value,
        noOfOutputs: noOfOutputs.value,
        upscaleModelId: upscaleModel.value.id,
      });
    },
    { deep: true },
  );
}
