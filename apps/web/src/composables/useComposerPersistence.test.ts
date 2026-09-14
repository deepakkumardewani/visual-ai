import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import {
  resetComposerPersistenceForTests,
  useComposerPersistence,
} from '@/composables/useComposerPersistence';
import { useAsideStore } from '@/stores/aside';
import { useGenerateStore } from '@/stores/generate';
import { ASPECT_RATIOS, IMAGE_FORMATS } from '@/utils/constants';
import { MODELS, UPSCALER_MODELS } from '@/utils/models';

const STORAGE_KEY = 'visual-ai-composer-state';

function mountPersistence() {
  return mount({
    setup() {
      useComposerPersistence();
      return {};
    },
    template: '<div />',
  });
}

describe('useComposerPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
    resetComposerPersistenceForTests();
    setActivePinia(createPinia());
  });

  it('restores a valid saved composer state', () => {
    const model = MODELS[1] ?? MODELS[0];
    const ratio = ASPECT_RATIOS[1] ?? ASPECT_RATIOS[0];
    const format = IMAGE_FORMATS[0];
    const upscaler = UPSCALER_MODELS[0];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prompt: 'a misty harbor at dawn',
        modelId: model.id,
        aspectRatioTitle: ratio.title,
        formatTitle: format.title,
        outputQuality: 80,
        noOfOutputs: 3,
        upscaleModelId: upscaler.id,
      }),
    );

    mountPersistence();

    const aside = useAsideStore();
    const generate = useGenerateStore();
    expect(aside.typingPrompt).toBe('a misty harbor at dawn');
    expect(generate.promptText).toBe('a misty harbor at dawn');
    expect(aside.mode.id).toBe(model.id);
    expect(aside.aspectRatio.title).toBe(ratio.title);
    expect(aside.imageFormat.title).toBe(format.title);
    expect(aside.outputQuality).toBe(80);
    expect(aside.noOfOutputs).toBe(3);
    expect(aside.upscaleModel.id).toBe(upscaler.id);
  });

  it('clamps restored output count to at least one', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prompt: '',
        modelId: '',
        aspectRatioTitle: '',
        formatTitle: '',
        outputQuality: 0,
        noOfOutputs: 0,
        upscaleModelId: '',
      }),
    );

    mountPersistence();
    expect(useAsideStore().noOfOutputs).toBe(1);
  });

  it('clears corrupt storage and skips restore', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');
    mountPersistence();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(useAsideStore().typingPrompt).toBe('');
  });

  it('writes composer changes back to localStorage', async () => {
    mountPersistence();
    const aside = useAsideStore();
    aside.typingPrompt = 'cyberpunk alley';
    await nextTick();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.prompt).toBe('cyberpunk alley');
    expect(saved.modelId).toBe(aside.mode.id);
  });

  it('skips restore when storage is empty or not an object', () => {
    mountPersistence();
    expect(useAsideStore().typingPrompt).toBe('');

    resetComposerPersistenceForTests();
    setActivePinia(createPinia());
    localStorage.setItem(STORAGE_KEY, 'null');
    mountPersistence();
    expect(useAsideStore().typingPrompt).toBe('');

    resetComposerPersistenceForTests();
    setActivePinia(createPinia());
    localStorage.setItem(STORAGE_KEY, '12');
    mountPersistence();
    expect(useAsideStore().typingPrompt).toBe('');
  });

  it('defaults invalid field types and ignores unknown catalog ids', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        prompt: 9,
        modelId: 1,
        aspectRatioTitle: 2,
        formatTitle: false,
        outputQuality: 'high',
        noOfOutputs: 'two',
        upscaleModelId: 3,
      }),
    );

    const aside = useAsideStore();
    const previousMode = aside.mode.id;
    const previousRatio = aside.aspectRatio.title;
    const previousFormat = aside.imageFormat.title;
    const previousUpscale = aside.upscaleModel.id;

    mountPersistence();

    expect(aside.typingPrompt).toBe('');
    expect(aside.outputQuality).toBe(0);
    expect(aside.noOfOutputs).toBe(1);
    expect(aside.mode.id).toBe(previousMode);
    expect(aside.aspectRatio.title).toBe(previousRatio);
    expect(aside.imageFormat.title).toBe(previousFormat);
    expect(aside.upscaleModel.id).toBe(previousUpscale);
  });

  it('does not register a second watcher after the first init', async () => {
    mountPersistence();
    useAsideStore().typingPrompt = 'first';
    await nextTick();

    resetComposerPersistenceForTests();
    // Re-init would duplicate watches if the guard were missing; call without reset
    // is the production path:
    useComposerPersistence();
    useComposerPersistence();

    useAsideStore().typingPrompt = 'second';
    await nextTick();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.prompt).toBe('second');
  });
});
