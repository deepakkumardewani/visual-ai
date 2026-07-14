<script setup lang="ts">
import { faBolt, faCreditCard, faCrown, faDownload, faImages } from '@/plugins/icons';
import { storeToRefs } from 'pinia';

import { useDialogStore } from '@/stores/dialog';

import AppModal from '@/components/AppModal.vue';

const dialogStore = useDialogStore();
const { showProUpgradeDialog } = storeToRefs(dialogStore);

const features = [
  {
    icon: faBolt,
    title: 'Priority Processing',
    description: 'Get faster image generation and processing',
  },
  {
    icon: faImages,
    title: 'Higher Quality',
    description: 'Access to premium image quality settings',
  },
  {
    icon: faDownload,
    title: 'Unlimited Downloads',
    description: 'Download as many images as you need',
  },
  {
    icon: faCreditCard,
    title: 'Reduced Credit Usage',
    description: 'Use fewer credits for special operations',
  },
];
</script>

<template>
  <AppModal
    :open="showProUpgradeDialog"
    max-width="36rem"
    labelled-by="pro-upgrade-title"
    @close="dialogStore.hideProUpgrade"
  >
    <template #title>
      <span id="pro-upgrade-title">Welcome to Pro</span>
    </template>

    <div class="pro">
      <div class="pro__hero">
        <span class="pro__badge" aria-hidden="true">
          <font-awesome-icon :icon="faCrown" />
        </span>
        <p class="pro__subtitle">Your experience just got a major upgrade.</p>
      </div>

      <ul class="pro__grid">
        <li v-for="feature in features" :key="feature.title" class="pro__item">
          <span class="pro__item-icon" aria-hidden="true">
            <font-awesome-icon :icon="feature.icon" />
          </span>
          <span>
            <span class="pro__item-title">{{ feature.title }}</span>
            <span class="pro__item-desc">{{ feature.description }}</span>
          </span>
        </li>
      </ul>
    </div>

    <template #actions>
      <button
        type="button"
        class="modal-btn modal-btn--primary"
        @click="dialogStore.hideProUpgrade"
      >
        Start creating
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.pro__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  text-align: center;
}

.pro__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;
  font-size: 1.4rem;
}

.pro__subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-muted));
}

.pro__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
}

.pro__item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.9rem;
  border-radius: 12px;
  background: rgb(var(--tw-surface-2) / 0.55);
  border: 1px solid rgb(var(--tw-border) / 0.55);
}

.pro__item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: rgba(201, 138, 90, 0.2);
  color: #c98a5a;
  font-size: 0.85rem;
}

.pro__item-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-primary));
}

.pro__item-desc {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.8rem;
  line-height: 1.4;
  color: rgb(var(--tw-ink-muted));
}

.modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.55rem 1.5rem;
  border: 0;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.modal-btn--primary {
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}
</style>
