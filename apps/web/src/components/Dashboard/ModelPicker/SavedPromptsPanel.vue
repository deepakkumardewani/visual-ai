<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

import { useDashboardMotion } from '@/composables/useDashboardMotion';
import { useAppStore } from '@/stores/app';
import { useSavedPromptsStore } from '@/stores/savedPrompts';

const props = withDefaults(
  defineProps<{
    currentPrompt: string;
    modelId?: string;
    disabled?: boolean;
    initialView?: 'save' | 'list';
  }>(),
  { initialView: 'list' },
);

const emit = defineEmits<{
  'apply-prompt': [text: string];
  back: [];
}>();

const appStore = useAppStore();
const { snackbar, snackbarText } = storeToRefs(appStore);
const savedStore = useSavedPromptsStore();
const { prompts, isLoading, isSaving, isDeletingId } = storeToRefs(savedStore);
const { interactiveTransition, pressable } = useDashboardMotion();

const isNaming = ref(props.initialView === 'save' && props.currentPrompt.trim().length > 0);
const nameInput = ref('');
const nameInputRef = ref<HTMLInputElement | null>(null);

const canSaveCurrent = computed(() => props.currentPrompt.trim().length > 0);
const skipList = computed(() => props.initialView === 'save' && isNaming.value);

onMounted(() => {
  void loadPrompts();
  if (props.initialView === 'save') {
    startSave();
  }
});

async function loadPrompts() {
  try {
    await savedStore.fetchPrompts();
  } catch (error) {
    snackbarText.value = error instanceof Error ? error.message : 'Could not load saved prompts.';
    snackbar.value = true;
  }
}

function startSave() {
  if (props.disabled || !canSaveCurrent.value || isSaving.value) return;
  isNaming.value = true;
  nameInput.value = '';
  requestAnimationFrame(() => nameInputRef.value?.focus());
}

function cancelSave() {
  isNaming.value = false;
  nameInput.value = '';
}

async function confirmSave() {
  if (props.disabled || isSaving.value) return;
  const name = nameInput.value.trim();
  if (!name) {
    snackbarText.value = 'Enter a name for this prompt.';
    snackbar.value = true;
    return;
  }

  try {
    await savedStore.createPrompt({
      name,
      prompt: props.currentPrompt,
      modelId: props.modelId,
    });
    isNaming.value = false;
    nameInput.value = '';
    snackbarText.value = 'Prompt saved.';
    snackbar.value = true;
  } catch (error) {
    snackbarText.value = error instanceof Error ? error.message : 'Could not save prompt.';
    snackbar.value = true;
  }
}

function applyPrompt(text: string) {
  if (props.disabled) return;
  emit('apply-prompt', text);
}

async function removePrompt(id: string) {
  if (props.disabled || isDeletingId.value) return;
  try {
    await savedStore.deletePrompt(id);
  } catch (error) {
    snackbarText.value = error instanceof Error ? error.message : 'Could not delete prompt.';
    snackbar.value = true;
  }
}
</script>

<template>
  <div
    class="tw-flex tw-w-72 tw-flex-col tw-gap-1.5"
    data-testid="saved-prompts-panel"
    role="menu"
    aria-label="Saved prompts"
  >
    <div class="tw-flex tw-items-center tw-gap-1 tw-px-1">
      <button
        type="button"
        class="tw-inline-flex tw-min-h-8 tw-items-center tw-gap-1 tw-rounded-md tw-px-1.5 tw-text-caption tw-text-ink-muted hover:tw-text-ink focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        :class="[interactiveTransition, pressable]"
        data-testid="saved-prompts-back"
        @click="emit('back')"
      >
        <font-awesome-icon icon="chevron-left" class="tw-h-3 tw-w-3" aria-hidden="true" />
        Back
      </button>
      <span class="tw-flex-1 tw-text-center tw-text-caption tw-font-medium tw-text-ink">
        Saved
      </span>
      <span class="tw-w-10" aria-hidden="true" />
    </div>

    <div v-if="isNaming" class="tw-flex tw-flex-col tw-gap-1.5 tw-px-1.5 tw-pb-1">
      <label class="tw-sr-only" for="saved-prompt-name">Prompt name</label>
      <input
        id="saved-prompt-name"
        ref="nameInputRef"
        v-model="nameInput"
        type="text"
        maxlength="80"
        placeholder="Name this prompt"
        data-testid="saved-prompt-name-input"
        class="tw-min-h-9 tw-w-full tw-rounded-md tw-border tw-border-hairline tw-bg-surface-2 tw-px-2.5 tw-text-body-sm tw-text-ink placeholder:tw-text-ink-muted/70 focus:tw-border-accent/50 focus:tw-outline-none"
        :disabled="disabled || isSaving"
        @keydown.enter.prevent="confirmSave"
        @keydown.escape.prevent="cancelSave"
      />
      <div class="tw-flex tw-items-center tw-justify-end tw-gap-1">
        <button
          type="button"
          class="tw-min-h-8 tw-rounded-md tw-px-2 tw-text-caption tw-text-ink-muted hover:tw-text-ink"
          :class="[interactiveTransition, pressable]"
          :disabled="isSaving"
          @click="cancelSave"
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="saved-prompt-confirm-save"
          class="tw-inline-flex tw-min-h-8 tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-accent/40 tw-bg-accent/10 tw-px-2.5 tw-text-caption tw-font-medium tw-text-accent disabled:tw-opacity-40"
          :class="[interactiveTransition, pressable]"
          :disabled="disabled || isSaving || !nameInput.trim()"
          @click="confirmSave"
        >
          <span
            v-if="isSaving"
            class="tw-inline-block tw-h-3 tw-w-3 tw-animate-spin tw-rounded-full tw-border-2 tw-border-accent/25 tw-border-t-accent motion-reduce:tw-animate-none"
            aria-hidden="true"
          />
          Save
        </button>
      </div>
    </div>

    <button
      v-else
      type="button"
      role="menuitem"
      data-testid="saved-prompt-save-current"
      class="tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-px-2.5 tw-py-1.5 tw-text-left hover:tw-bg-surface-2 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      :class="[interactiveTransition, pressable]"
      :disabled="disabled || !canSaveCurrent"
      @click="startSave"
    >
      <span
        class="tw-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-bg-surface-3/60"
        aria-hidden="true"
      >
        <font-awesome-icon icon="plus" class="tw-h-3.5 tw-w-3.5 tw-text-ink-muted" />
      </span>
      <span class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
        <span class="tw-text-body-sm tw-font-medium tw-text-ink">Save current prompt</span>
        <span class="tw-text-xs tw-text-ink-muted">
          {{ canSaveCurrent ? 'Name and keep for later' : 'Write a prompt first' }}
        </span>
      </span>
    </button>

    <div
      v-if="!skipList"
      class="tw-max-h-56 tw-overflow-y-auto tw-overscroll-contain"
      data-testid="saved-prompts-list"
    >
      <div
        v-if="isLoading && prompts.length === 0"
        class="tw-px-2.5 tw-py-3 tw-text-center tw-text-caption tw-text-ink-muted"
      >
        Loading…
      </div>
      <div
        v-else-if="prompts.length === 0"
        class="tw-px-2.5 tw-py-3 tw-text-center tw-text-caption tw-text-ink-muted"
      >
        No saved prompts yet
      </div>
      <ul v-else class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-px tw-p-0">
        <li v-for="item in prompts" :key="item.id" class="tw-group tw-flex tw-items-stretch">
          <button
            type="button"
            role="menuitem"
            class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-0.5 tw-rounded-md tw-px-2.5 tw-py-1.5 tw-text-left hover:tw-bg-surface-2 disabled:tw-opacity-50"
            :class="[interactiveTransition, pressable]"
            :disabled="disabled"
            :data-testid="`saved-prompt-item-${item.id}`"
            @click="applyPrompt(item.prompt)"
          >
            <span class="tw-truncate tw-text-body-sm tw-font-medium tw-text-ink">
              {{ item.name }}
            </span>
            <span class="tw-line-clamp-2 tw-text-xs tw-leading-snug tw-text-ink-muted">
              {{ item.prompt }}
            </span>
          </button>
          <button
            type="button"
            class="tw-inline-flex tw-min-h-8 tw-min-w-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-text-ink-muted opacity-70 hover:tw-bg-surface-2 hover:tw-text-ink focus-visible:tw-opacity-100 group-hover:tw-opacity-100 disabled:tw-opacity-40"
            :class="[interactiveTransition, pressable]"
            :disabled="disabled || isDeletingId === item.id"
            :aria-label="`Delete ${item.name}`"
            :data-testid="`saved-prompt-delete-${item.id}`"
            @click.stop="removePrompt(item.id)"
          >
            <span
              v-if="isDeletingId === item.id"
              class="tw-inline-block tw-h-3 tw-w-3 tw-animate-spin tw-rounded-full tw-border-2 tw-border-accent/25 tw-border-t-accent motion-reduce:tw-animate-none"
              aria-hidden="true"
            />
            <font-awesome-icon v-else icon="trash-alt" class="tw-h-3 tw-w-3" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
