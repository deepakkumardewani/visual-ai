<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMediaQuery } from '@vueuse/core';
import { useRouter } from 'vue-router';

import { useDialogStore } from '@/stores/dialog';

import AppModal from '@/components/AppModal.vue';

const isMobile = useMediaQuery('(max-width: 768px)');
const router = useRouter();
const dialogStore = useDialogStore();
const { showPremiumDialog } = storeToRefs(dialogStore);

const aboutImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/about.jpg`;
const features = [
  {
    title: 'AI Image Generator',
    description: 'Create high quality images using text',
  },
  {
    title: 'Upscale Images',
    description: 'Upscale images in high resolution',
  },
  {
    title: 'Colorize Images',
    description: 'Put color back into your images',
  },
  {
    title: 'Deoldify Images',
    description: 'Bring your old photos back to life',
  },
];

function goPremium() {
  dialogStore.hidePremium();
  router.push('/pricing');
}
</script>

<template>
  <AppModal
    :open="showPremiumDialog"
    :fullscreen="isMobile"
    max-width="56rem"
    labelled-by="premium-title"
    @close="dialogStore.hidePremium"
  >
    <div class="premium">
      <div class="premium__copy">
        <h2 id="premium-title" class="premium__title">Unlock the full potential of Visual AI</h2>
        <p class="premium__lead">Get full access to all AI features and more generations.</p>

        <ul class="premium__list">
          <li v-for="feature in features" :key="feature.title" class="premium__item">
            <span class="premium__dot" aria-hidden="true" />
            <span>
              <span class="premium__item-title">{{ feature.title }}</span>
              <span class="premium__item-desc">{{ feature.description }}</span>
            </span>
          </li>
        </ul>

        <button type="button" class="premium__cta" @click="goPremium">Get Premium</button>
        <button type="button" class="premium__later" @click="dialogStore.hidePremium()">
          Maybe later
        </button>
      </div>

      <div class="premium__media" aria-hidden="true">
        <img :src="aboutImage" alt="" class="premium__img" />
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.premium {
  display: grid;
  gap: 1.5rem;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 2rem;
  }
}

.premium__title {
  margin: 0 0 0.75rem;
  font-family: 'Young Serif', Georgia, serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: rgb(var(--tw-ink-primary));
}

.premium__lead {
  margin: 0 0 1.25rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: rgb(var(--tw-ink-muted));
}

.premium__list {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.premium__item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.premium__dot {
  width: 0.45rem;
  height: 0.45rem;
  margin-top: 0.55rem;
  border-radius: 999px;
  background: #c9a84c;
  flex-shrink: 0;
}

.premium__item-title {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  color: rgb(var(--tw-ink-primary));
}

.premium__item-desc {
  display: block;
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-muted));
}

.premium__cta {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.premium__later {
  display: block;
  width: 100%;
  margin-top: 0.75rem;
  border: 0;
  background: transparent;
  color: rgb(var(--tw-ink-muted));
  font-size: 0.9rem;
  cursor: pointer;
  min-height: 40px;

  &:hover {
    color: rgb(var(--tw-ink-primary));
  }
}

.premium__media {
  display: none;

  @media (min-width: 900px) {
    display: block;
  }
}

.premium__img {
  width: 100%;
  height: 28rem;
  object-fit: cover;
  border-radius: 999px 999px 12px 12px;
}
</style>
