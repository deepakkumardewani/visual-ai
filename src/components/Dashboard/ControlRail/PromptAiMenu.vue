<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";

import { useDashboardMotion } from "@/composables/useDashboardMotion";
import { useAsideStore } from "@/stores/aside";

import Popover from "@/components/primitives/Popover.vue";

import { describeImage, improvePrompt, pickRandomPrompt } from "@/utils/promptAi";

const props = defineProps<{
  currentPrompt: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "apply-prompt": [text: string];
  loading: [value: boolean];
}>();

const asideStore = useAsideStore();
const { mode } = storeToRefs(asideStore);
const { interactiveTransition, pressable } = useDashboardMotion();

const isOpen = ref(false);
const activeAction = ref<"improve" | "random" | "describe" | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const isLoading = () => activeAction.value !== null;

async function runAction(action: "improve" | "random" | "describe", runner: () => Promise<string>) {
  if (props.disabled || isLoading()) return;

  activeAction.value = action;
  emit("loading", true);

  try {
    const text = await runner();
    emit("apply-prompt", text);
    isOpen.value = false;
  } finally {
    activeAction.value = null;
    emit("loading", false);
  }
}

async function handleImprove() {
  await runAction("improve", async () => {
    const result = await improvePrompt(props.currentPrompt);
    return result.text;
  });
}

async function handleRandom() {
  await runAction("random", async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return pickRandomPrompt(mode.value.id);
  });
}

function handleDescribeClick() {
  if (props.disabled || isLoading()) return;
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (!file) return;

  await runAction("describe", async () => {
    const result = await describeImage(file);
    return result.text;
  });
}
</script>

<template>
  <div data-testid="prompt-ai-menu" class="tw-relative">
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="tw-sr-only"
      tabindex="-1"
      aria-hidden="true"
      @change="handleFileChange"
    />

    <Popover v-model:open="isOpen" placement="bottom-end">
      <template #trigger="{ open }">
        <span
          data-testid="prompt-ai-trigger"
          :class="[
            'tw-inline-flex tw-min-h-[44px] tw-min-w-[44px] tw-items-center tw-justify-center tw-rounded-chip tw-border tw-border-hairline tw-bg-surface-1 tw-text-ink-muted hover:tw-border-accent/40 hover:tw-text-accent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]',
            interactiveTransition,
            open ? 'tw-border-accent/50 tw-text-accent' : '',
            isLoading() ? 'tw-opacity-60' : '',
          ]"
          :aria-busy="isLoading()"
        >
          <font-awesome-icon icon="wand-magic-sparkles" class="tw-h-4 tw-w-4" aria-hidden="true" />
          <span class="tw-sr-only">AI prompt actions</span>
        </span>
      </template>

      <div
        role="menu"
        aria-label="AI prompt actions"
        class="tw-min-w-[12rem]"
        data-testid="prompt-ai-panel"
      >
        <button
          type="button"
          role="menuitem"
          data-testid="prompt-ai-improve"
          class="tw-flex tw-w-full tw-min-h-[44px] tw-items-center tw-gap-2 tw-rounded-sm tw-px-3 tw-py-2 tw-text-left tw-text-body-sm tw-text-ink hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[-2px] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          :class="[interactiveTransition, pressable]"
          :disabled="disabled || isLoading()"
          @click="handleImprove"
        >
          <span>Improve Prompt</span>
          <span
            v-if="activeAction === 'improve'"
            data-testid="prompt-ai-loading-improve"
            class="tw-ml-auto tw-text-eyebrow tw-text-ink-muted"
            aria-hidden="true"
          >
            …
          </span>
        </button>

        <button
          type="button"
          role="menuitem"
          data-testid="prompt-ai-random"
          class="tw-flex tw-w-full tw-min-h-[44px] tw-items-center tw-gap-2 tw-rounded-sm tw-px-3 tw-py-2 tw-text-left tw-text-body-sm tw-text-ink hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[-2px] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          :class="[interactiveTransition, pressable]"
          :disabled="disabled || isLoading()"
          @click="handleRandom"
        >
          <span>New Random Prompt</span>
          <span
            v-if="activeAction === 'random'"
            data-testid="prompt-ai-loading-random"
            class="tw-ml-auto tw-text-eyebrow tw-text-ink-muted"
            aria-hidden="true"
          >
            …
          </span>
        </button>

        <button
          type="button"
          role="menuitem"
          data-testid="prompt-ai-describe"
          class="tw-flex tw-w-full tw-min-h-[44px] tw-items-center tw-gap-2 tw-rounded-sm tw-px-3 tw-py-2 tw-text-left tw-text-body-sm tw-text-ink hover:tw-bg-surface-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[-2px] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          :class="[interactiveTransition, pressable]"
          :disabled="disabled || isLoading()"
          @click="handleDescribeClick"
        >
          <span>Describe with image</span>
          <span
            v-if="activeAction === 'describe'"
            data-testid="prompt-ai-loading-describe"
            class="tw-ml-auto tw-text-eyebrow tw-text-ink-muted"
            aria-hidden="true"
          >
            …
          </span>
        </button>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
:deep(.tw-relative.tw-inline-block) {
  display: inline-block;
}

:deep(.tw-relative.tw-inline-block > button) {
  min-height: 44px;
  min-width: 44px;
  padding: 0;
  border: none;
  background: transparent;
}
</style>
