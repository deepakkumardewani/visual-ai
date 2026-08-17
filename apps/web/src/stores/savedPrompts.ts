import { defineStore } from 'pinia';
import { ref } from 'vue';

import type {
  SavedPrompt,
  SavedPromptCreateResponse,
  SavedPromptListResponse,
} from '@visual-ai/shared';

import { useFetch } from '@/composables/useFetch';
import { createLogger } from '@/utils/logger';

const log = createLogger('savedPrompts');

export const useSavedPromptsStore = defineStore('savedPrompts', () => {
  const prompts = ref<SavedPrompt[]>([]);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const isDeletingId = ref<string | null>(null);
  const hasFetched = ref(false);

  async function fetchPrompts() {
    if (isLoading.value) return;

    isLoading.value = true;
    try {
      const { data, error } = await useFetch('/saved-prompts').json<SavedPromptListResponse>();

      if (error.value) {
        log.error('fetchPrompts failed', { error: error.value });
        throw new Error('Could not load saved prompts. Please try again.');
      }

      prompts.value = data.value?.prompts ?? [];
      hasFetched.value = true;
    } catch (err) {
      log.error('fetchPrompts failed', { error: err });
      throw err instanceof Error
        ? err
        : new Error('Could not load saved prompts. Please try again.');
    } finally {
      isLoading.value = false;
    }
  }

  async function createPrompt(input: { name: string; prompt: string; modelId?: string }) {
    const name = input.name.trim();
    const prompt = input.prompt.trim();
    if (!name || !prompt) {
      throw new Error('Name and prompt are required.');
    }

    isSaving.value = true;
    try {
      const { data, error } = await useFetch('/saved-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          mode: 'cors',
        },
        body: JSON.stringify({
          name,
          prompt,
          ...(input.modelId ? { modelId: input.modelId } : {}),
        }),
      }).json<SavedPromptCreateResponse>();

      if (error.value || !data.value?.prompt) {
        log.error('createPrompt failed', { error: error.value });
        throw new Error('Could not save prompt. Please try again.');
      }

      prompts.value = [data.value.prompt, ...prompts.value];
      return data.value.prompt;
    } catch (err) {
      log.error('createPrompt failed', { error: err });
      throw err instanceof Error ? err : new Error('Could not save prompt. Please try again.');
    } finally {
      isSaving.value = false;
    }
  }

  async function deletePrompt(id: string) {
    if (!id || isDeletingId.value) return;

    isDeletingId.value = id;
    try {
      const { error } = await useFetch(`/saved-prompts/${id}`, {
        method: 'DELETE',
      }).json<{ success: boolean }>();

      if (error.value) {
        log.error('deletePrompt failed', { error: error.value, id });
        throw new Error('Could not delete prompt. Please try again.');
      }

      prompts.value = prompts.value.filter((item) => item.id !== id);
    } catch (err) {
      log.error('deletePrompt failed', { error: err, id });
      throw err instanceof Error ? err : new Error('Could not delete prompt. Please try again.');
    } finally {
      isDeletingId.value = null;
    }
  }

  return {
    prompts,
    isLoading,
    isSaving,
    isDeletingId,
    hasFetched,
    fetchPrompts,
    createPrompt,
    deletePrompt,
  };
});
