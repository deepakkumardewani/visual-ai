<script setup lang="ts">
import {
  faCopy,
  faDice,
  faDownload,
  faEllipsis,
  faExpand,
  faLink,
  faObjectUngroup,
  faUpload,
  farHeart,
  fasHeart,
  faTrashAlt,
} from '@/plugins/icons';
import { onClickOutside } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import type { IImageObject } from '@/types';

import { useGenerateStore } from '@/stores/generate';

import ConfirmDeleteImageDialog from '@/components/Dialogs/ConfirmDeleteImageDialog.vue';
import Tooltip from '@/components/primitives/Tooltip.vue';

import { useImageChainActions } from '@/composables/useImageChainActions';
import { useShareActions } from '@/composables/useShareActions';
import { deleteImage, downloadImage, favoriteImage, getDownloadImageUrl } from '@/utils/helpers';

const props = withDefaults(
  defineProps<{
    item: IImageObject;
    /** When set, download that specific image instead of the first. */
    imageIndex?: number;
  }>(),
  { imageIndex: 0 },
);

const generateStore = useGenerateStore();
const { deletingImageIds } = storeToRefs(generateStore);
const { shareLink, copyPrompt } = useShareActions();
const { useAsReference, sendToUpscale, sendToRemoveBg, moreLikeThis } = useImageChainActions();

const showDeleteConfirm = ref(false);
const chainMenuOpen = ref(false);
const menuTriggerRef = ref<HTMLElement | null>(null);
const menuPanelRef = ref<HTMLElement | null>(null);
const menuStyle = ref<Record<string, string>>({
  top: '-9999px',
  left: '-9999px',
});

onClickOutside(
  menuPanelRef,
  () => {
    chainMenuOpen.value = false;
  },
  { ignore: [menuTriggerRef] },
);

function updateMenuPosition() {
  const trigger = menuTriggerRef.value;
  const panel = menuPanelRef.value;
  if (!trigger || !panel || !chainMenuOpen.value) return;

  const triggerRect = trigger.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const gap = 8;
  const viewportPad = 16;
  const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPad;
  const openUp = spaceBelow < panelRect.height && triggerRect.top > panelRect.height + gap;
  const top = openUp ? triggerRect.top - panelRect.height - gap : triggerRect.bottom + gap;
  const left = Math.min(
    Math.max(viewportPad, triggerRect.right - panelRect.width),
    window.innerWidth - panelRect.width - viewportPad,
  );

  menuStyle.value = {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
  };
}

watch(chainMenuOpen, async (open) => {
  if (!open) return;
  await nextTick();
  updateMenuPosition();
});

window.addEventListener('scroll', updateMenuPosition, { capture: true, passive: true });
window.addEventListener('resize', updateMenuPosition);

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateMenuPosition, { capture: true });
  window.removeEventListener('resize', updateMenuPosition);
});

const isDeletingThis = computed(() =>
  props.item._id ? deletingImageIds.value.includes(props.item._id) : false,
);

const downloadTarget = computed(() => {
  const images = props.item.images ?? [];
  return images[props.imageIndex] ?? images[0];
});

const imageCount = computed(() => props.item.images?.length ?? 1);

const hasPrompt = computed(() => Boolean(props.item.prompt?.trim()));

const shareUrl = computed(() => {
  if (downloadTarget.value) return getDownloadImageUrl(downloadTarget.value);
  return typeof window !== 'undefined' ? window.location.href : '';
});

function openDeleteConfirm(event: Event) {
  event.stopPropagation();
  chainMenuOpen.value = false;
  showDeleteConfirm.value = true;
}

function closeDeleteConfirm() {
  showDeleteConfirm.value = false;
}

async function confirmDelete(event: Event) {
  showDeleteConfirm.value = false;
  await deleteImage(event, props.item);
}

async function handleShare(event: Event) {
  event.stopPropagation();
  await shareLink({ title: 'Visual AI creation', url: shareUrl.value });
}

async function handleCopyPrompt(event: Event) {
  event.stopPropagation();
  await copyPrompt(props.item.prompt);
}

function toggleChainMenu(event: Event) {
  event.stopPropagation();
  chainMenuOpen.value = !chainMenuOpen.value;
}

async function runChain(action: () => void | Promise<void>, event: Event) {
  event.stopPropagation();
  chainMenuOpen.value = false;
  await action();
}
</script>

<template>
  <Tooltip v-if="hasPrompt" text="Copy prompt">
    <button type="button" class="tile-action" aria-label="Copy prompt" @click="handleCopyPrompt">
      <font-awesome-icon :icon="faCopy" class="tw-h-3 tw-w-3" aria-hidden="true" />
    </button>
  </Tooltip>

  <Tooltip text="Download">
    <button
      type="button"
      class="tile-action"
      aria-label="Download image"
      :disabled="!downloadTarget"
      @click="downloadTarget && downloadImage($event, getDownloadImageUrl(downloadTarget))"
    >
      <font-awesome-icon :icon="faDownload" class="tw-h-3 tw-w-3" aria-hidden="true" />
    </button>
  </Tooltip>

  <Tooltip :text="props.item.isFavorite ? 'Remove from favorites' : 'Favorite'">
    <button
      type="button"
      class="tile-action"
      :aria-label="props.item.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
      @click="favoriteImage($event, props.item._id ?? '')"
    >
      <font-awesome-icon
        :icon="props.item.isFavorite ? fasHeart : farHeart"
        class="tw-h-3 tw-w-3"
        :class="{ 'tw-text-accent': props.item.isFavorite }"
        aria-hidden="true"
      />
    </button>
  </Tooltip>

  <div ref="menuTriggerRef" class="tile-menu">
    <Tooltip text="More">
      <button
        type="button"
        class="tile-action"
        aria-label="More actions"
        aria-haspopup="menu"
        :aria-expanded="chainMenuOpen"
        @click="toggleChainMenu"
      >
        <font-awesome-icon :icon="faEllipsis" class="tw-h-3 tw-w-3" aria-hidden="true" />
      </button>
    </Tooltip>

    <Teleport to="body">
      <div
        v-if="chainMenuOpen"
        ref="menuPanelRef"
        class="tile-menu__panel"
        role="menu"
        aria-label="More image actions"
        :style="menuStyle"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          class="tile-menu__item"
          :disabled="!downloadTarget"
          @click="runChain(() => useAsReference(downloadTarget), $event)"
        >
          <font-awesome-icon :icon="faUpload" class="tw-h-3 tw-w-3" aria-hidden="true" />
          Use as reference
        </button>
        <button
          type="button"
          role="menuitem"
          class="tile-menu__item"
          :disabled="!downloadTarget"
          @click="runChain(() => sendToUpscale(downloadTarget), $event)"
        >
          <font-awesome-icon :icon="faExpand" class="tw-h-3 tw-w-3" aria-hidden="true" />
          Upscale this
        </button>
        <button
          type="button"
          role="menuitem"
          class="tile-menu__item"
          :disabled="!downloadTarget"
          @click="runChain(() => sendToRemoveBg(downloadTarget), $event)"
        >
          <font-awesome-icon :icon="faObjectUngroup" class="tw-h-3 tw-w-3" aria-hidden="true" />
          Remove background
        </button>
        <button
          v-if="hasPrompt"
          type="button"
          role="menuitem"
          class="tile-menu__item"
          @click="runChain(() => moreLikeThis(item), $event)"
        >
          <font-awesome-icon :icon="faDice" class="tw-h-3 tw-w-3" aria-hidden="true" />
          More like this
        </button>

        <div class="tile-menu__separator" role="separator" />

        <button
          type="button"
          role="menuitem"
          class="tile-menu__item"
          :disabled="!shareUrl"
          @click="runChain(() => handleShare($event), $event)"
        >
          <font-awesome-icon :icon="faLink" class="tw-h-3 tw-w-3" aria-hidden="true" />
          Copy link
        </button>

        <div class="tile-menu__separator" role="separator" />

        <button
          type="button"
          role="menuitem"
          class="tile-menu__item tile-menu__item--danger"
          :class="{ 'tile-action--busy': isDeletingThis }"
          :disabled="isDeletingThis"
          @click="openDeleteConfirm"
        >
          <font-awesome-icon :icon="faTrashAlt" class="tw-h-3 tw-w-3" aria-hidden="true" />
          Delete
        </button>
      </div>
    </Teleport>
  </div>

  <ConfirmDeleteImageDialog
    :open="showDeleteConfirm"
    :image-count="imageCount"
    :loading="isDeletingThis"
    @close="closeDeleteConfirm"
    @confirm="confirmDelete"
  />
</template>

<style scoped lang="scss">
.tile-action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.75rem;
  width: 1.75rem;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.55);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.8);
  }

  &:disabled {
    cursor: not-allowed;
  }

  /* Touch / coarse pointers: ~40px hit targets without changing desktop chrome */
  @media (hover: none), (pointer: coarse) {
    height: 2.5rem;
    width: 2.5rem;
  }
}

.tile-action--busy {
  animation: tile-action-busy 1s ease-in-out infinite;
}

@keyframes tile-action-busy {
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile-action--busy {
    animation: none;
    opacity: 0.5;
  }
}

.tile-menu {
  position: relative;
}

.tile-menu__panel {
  position: fixed;
  z-index: 60;
  display: flex;
  min-width: 11.5rem;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.35rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(var(--tw-hairline) / 0.8);
  background: rgb(var(--tw-surface-1) / 0.96);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
}

.tile-menu__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  padding: 0.375rem 0.5rem;
  border-radius: 0.375rem;
  color: rgb(var(--tw-ink));
  font-size: 0.75rem;
  font-weight: 500;
  text-align: left;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgb(var(--tw-surface-2));
    color: #c98a5a;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 1px;
  }
}

.tile-menu__item--danger {
  color: rgb(248 113 113);

  &:hover:not(:disabled) {
    background: rgba(248, 113, 113, 0.12);
    color: rgb(252 165 165);
  }
}

.tile-menu__separator {
  height: 1px;
  margin: 0.25rem 0.15rem;
  background: rgb(var(--tw-hairline) / 0.9);
}
</style>
