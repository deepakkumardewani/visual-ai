<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, shallowRef } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';

import PromptAiMenuItem from '@/components/Dashboard/ModelPicker/PromptAiMenuItem.vue';
import SavedPromptsPanel from '@/components/Dashboard/ModelPicker/SavedPromptsPanel.vue';
import Popover from '@/components/primitives/Popover.vue';

import { describeImage, generateRandomPrompt, improvePrompt } from '@/utils/promptAi';

const props = defineProps<{
  currentPrompt: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'apply-prompt': [text: string];
  loading: [value: boolean];
}>();

const asideStore = useAsideStore();
const { mode } = storeToRefs(asideStore);
const appStore = useAppStore();
const { snackbar, snackbarText } = storeToRefs(appStore);
const { interactiveTransition, pressable } = useDashboardMotion();

const isOpen = ref(false);
const menuView = ref<'actions' | 'saved'>('actions');
const savedInitialView = shallowRef<'save' | 'list'>('list');
const activeAction = ref<'improve' | 'random' | 'describe' | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const canSaveCurrent = computed(() => props.currentPrompt.trim().length > 0);

const isLoading = () => activeAction.value !== null;

function onOpenUpdate(value: boolean) {
  // Keep the panel visible while an AI action is in flight (especially describe,
  // where the OS file dialog often dismisses the popover).
  if (!value && activeAction.value !== null) return;
  isOpen.value = value;
  if (!value) {
    menuView.value = 'actions';
    savedInitialView.value = 'list';
  }
}

function openSaveCurrentPrompt() {
  if (props.disabled || isLoading() || !canSaveCurrent.value) return;
  savedInitialView.value = 'save';
  menuView.value = 'saved';
}

function openSavedPrompts() {
  if (props.disabled || isLoading()) return;
  savedInitialView.value = 'list';
  menuView.value = 'saved';
}

function closeSavedView() {
  menuView.value = 'actions';
  savedInitialView.value = 'list';
}

function handleApplySavedPrompt(text: string) {
  emit('apply-prompt', text);
  isOpen.value = false;
  menuView.value = 'actions';
  savedInitialView.value = 'list';
}

async function runAction(action: 'improve' | 'random' | 'describe', runner: () => Promise<string>) {
  if (props.disabled || isLoading()) return;

  activeAction.value = action;
  emit('loading', true);

  try {
    const text = await runner();
    emit('apply-prompt', text);
    isOpen.value = false;
  } catch (error) {
    snackbarText.value =
      error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    snackbar.value = true;
  } finally {
    activeAction.value = null;
    emit('loading', false);
  }
}

async function handleImprove() {
  await runAction('improve', async () => {
    const result = await improvePrompt(props.currentPrompt);
    return result.text;
  });
}

async function handleRandom() {
  await runAction('random', async () => {
    return generateRandomPrompt(mode.value.id);
  });
}

function handleDescribeClick() {
  if (props.disabled || isLoading()) return;
  // Keep the menu open while the OS file picker is up so loading can
  // show on the describe row as soon as a file is chosen.
  isOpen.value = true;
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  if (!file) return;

  // File dialog often dismisses the popover — reopen so the describe
  // row spinner is visible for the full request.
  isOpen.value = true;

  await runAction('describe', async () => {
    const result = await describeImage(file);
    return result.text;
  });
}
</script>

<template>
  <div data-testid="prompt-ai-menu" class="tw-relative tw-flex tw-items-center tw-gap-1">
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="tw-sr-only"
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileChange"
    />

    <Popover :open="isOpen" placement="bottom-end" @update:open="onOpenUpdate">
      <template #trigger="{ open }">
        <span
          data-testid="prompt-ai-trigger"
          :class="[
            'tw-inline-flex tw-min-h-9 tw-min-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2 tw-text-ink-muted hover:tw-border-accent/40 hover:tw-text-accent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]',
            interactiveTransition,
            open || activeAction === 'describe' ? 'tw-border-accent/50 tw-text-accent' : '',
          ]"
          :aria-busy="activeAction === 'describe'"
        >
          <span
            v-if="activeAction === 'describe'"
            data-testid="prompt-ai-trigger-loading"
            class="tw-inline-block tw-h-3.5 tw-w-3.5 tw-animate-spin tw-rounded-full tw-border-2 tw-border-accent/25 tw-border-t-accent motion-reduce:tw-animate-none"
            aria-hidden="true"
          />
          <font-awesome-icon
            v-else
            icon="wand-magic-sparkles"
            class="tw-h-3.5 tw-w-3.5"
            aria-hidden="true"
          />
          <span class="tw-sr-only">
            {{ activeAction === 'describe' ? 'Describing image' : 'More AI prompt actions' }}
          </span>
        </span>
      </template>

      <div
        role="menu"
        :aria-label="menuView === 'saved' ? 'Saved prompts' : 'AI prompt actions'"
        :class="['tw-flex tw-flex-col tw-gap-px', menuView === 'saved' ? 'tw-w-72' : 'tw-w-64']"
        data-testid="prompt-ai-panel"
      >
        <template v-if="menuView === 'actions'">
          <PromptAiMenuItem
            icon="wand-magic-sparkles"
            title="Improve"
            description="Rewrite your prompt for stronger results."
            test-id="prompt-ai-improve"
            loading-test-id="prompt-ai-loading-improve"
            :loading="activeAction === 'improve'"
            :disabled="disabled || isLoading()"
            :class="[interactiveTransition, pressable]"
            @click="handleImprove"
          />
          <PromptAiMenuItem
            icon="dice"
            title="Random"
            description="Fill in a new prompt idea."
            test-id="prompt-ai-random"
            loading-test-id="prompt-ai-loading-random"
            :loading="activeAction === 'random'"
            :disabled="disabled || isLoading()"
            :class="[interactiveTransition, pressable]"
            @click="handleRandom"
          />
          <PromptAiMenuItem
            icon="images"
            title="Describe With AI"
            description="Upload an image and generate its description."
            test-id="prompt-ai-describe"
            loading-test-id="prompt-ai-loading-describe"
            :loading="activeAction === 'describe'"
            :disabled="disabled || isLoading()"
            :class="[interactiveTransition, pressable]"
            @click="handleDescribeClick"
          />
          <PromptAiMenuItem
            icon="plus"
            title="Save current prompt"
            description="Name and keep this prompt for later."
            test-id="prompt-ai-save-current"
            :disabled="disabled || isLoading() || !canSaveCurrent"
            :class="[interactiveTransition, pressable]"
            @click="openSaveCurrentPrompt"
          />
          <PromptAiMenuItem
            icon="tag"
            title="Saved prompts"
            description="Reuse prompts you've named and kept."
            test-id="prompt-ai-saved"
            :disabled="disabled || isLoading()"
            :class="[interactiveTransition, pressable]"
            @click="openSavedPrompts"
          />
        </template>
        <SavedPromptsPanel
          v-else
          :key="savedInitialView"
          :current-prompt="currentPrompt"
          :model-id="mode.id"
          :disabled="disabled"
          :initial-view="savedInitialView"
          @apply-prompt="handleApplySavedPrompt"
          @back="closeSavedView"
        />
      </div>
    </Popover>
  </div>
</template>

<style scoped>
:deep(.tw-relative.tw-inline-block) {
  display: inline-block;
}

:deep(.tw-relative.tw-inline-block > button) {
  min-height: 36px;
  min-width: 36px;
  padding: 0;
  border: none;
  background: transparent;
}
</style>
