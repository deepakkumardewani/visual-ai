<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { useDialogStore } from '@/stores/dialog';

import AppModal from '@/components/AppModal.vue';

import { ImgComparisonSlider } from '@img-comparison-slider/vue';

const router = useRouter();
const dialogStore = useDialogStore();
const { signupDialog } = storeToRefs(dialogStore);

const aiImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/ai-image.jpg`;
const upscaleImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/upscale.jpg`;
const upscaleImage1 = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/upscale-1.png`;
const colorizeImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/bw.webp`;
const colorizeImage1 = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/bw-1.png`;
const reviveImage = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/revive.png`;
const reviveImage1 = `${import.meta.env.VITE_CLOUDINARY_ASSETS_URL}/revive-1.png`;

function handleSignup() {
  signupDialog.value = false;
  router.push('/signup');
}

function handleLogin() {
  signupDialog.value = false;
  router.push('/signin');
}
</script>

<template>
  <AppModal
    :open="signupDialog"
    max-width="72rem"
    labelled-by="signup-dialog-title"
    @close="dialogStore.hideSignup"
  >
    <div class="signup">
      <div class="signup__copy">
        <p class="signup__eyebrow">Ready to create?</p>
        <h2 id="signup-dialog-title" class="signup__title">Sign up for free</h2>
        <p class="signup__lead">
          AI tools that do the hard work for you — generate images, upscale, colorize, and more.
        </p>

        <div class="signup__actions">
          <button type="button" class="signup__btn signup__btn--primary" @click="handleSignup">
            Sign up for free
          </button>
          <button type="button" class="signup__btn signup__btn--ghost" @click="handleLogin">
            Login
          </button>
        </div>
      </div>

      <div class="signup__grid">
        <div class="feature-card">
          <img :src="aiImage" alt="" class="feature-card__img" />
          <div class="feature-card__veil" aria-hidden="true" />
          <div class="feature-card__label">
            <span class="feature-card__tag">Image generator</span>
            <h3 class="feature-card__title">Create stunning images</h3>
          </div>
        </div>

        <div class="feature-card">
          <ImgComparisonSlider class="feature-card__slider" hover="hover" value="25">
            <figure slot="first" class="before">
              <img :src="upscaleImage" alt="" />
            </figure>
            <figure slot="second" class="after">
              <img :src="upscaleImage1" alt="" />
            </figure>
          </ImgComparisonSlider>
          <div class="feature-card__label">
            <span class="feature-card__tag">Upscale</span>
            <h3 class="feature-card__title">Enhance resolution</h3>
          </div>
        </div>

        <div class="feature-card">
          <ImgComparisonSlider class="feature-card__slider" hover="hover" value="25">
            <figure slot="first" class="before">
              <img :src="colorizeImage" alt="" />
            </figure>
            <figure slot="second" class="after">
              <img :src="colorizeImage1" alt="" />
            </figure>
          </ImgComparisonSlider>
          <div class="feature-card__label">
            <span class="feature-card__tag">Colorize</span>
            <h3 class="feature-card__title">Colorize photos</h3>
          </div>
        </div>

        <div class="feature-card">
          <ImgComparisonSlider class="feature-card__slider" hover="hover" value="25">
            <figure slot="first" class="before">
              <img :src="reviveImage" alt="" />
            </figure>
            <figure slot="second" class="after">
              <img :src="reviveImage1" alt="" />
            </figure>
          </ImgComparisonSlider>
          <div class="feature-card__label">
            <span class="feature-card__tag">Revive</span>
            <h3 class="feature-card__title">Revive old photos</h3>
          </div>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.signup {
  display: grid;
  gap: 1.5rem;

  @media (min-width: 960px) {
    grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
    gap: 2rem;
    align-items: center;
  }
}

.signup__eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #d29467;
}

.signup__title {
  margin: 0 0 0.75rem;
  font-family: 'Young Serif', Georgia, serif;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: rgb(var(--tw-ink-primary));
}

.signup__lead {
  margin: 0 0 1.25rem;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgb(var(--tw-ink-muted));
}

.signup__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.signup__btn {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #c9a84c;
    outline-offset: 2px;
  }
}

.signup__btn--primary {
  border: 0;
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;
}

.signup__btn--ghost {
  border: 1px solid rgb(var(--tw-border));
  background: transparent;
  color: rgb(var(--tw-ink-primary));

  &:hover {
    background: rgb(var(--tw-surface-2));
  }
}

.signup__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
}

.feature-card {
  position: relative;
  overflow: hidden;
  height: 9.5rem;
  border-radius: 14px;
  border: 1px solid rgb(var(--tw-border) / 0.55);
  background: rgb(var(--tw-surface-2));
}

.feature-card__img,
.feature-card__slider,
.feature-card :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.feature-card__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 20%, rgba(9, 7, 5, 0.85) 100%);
  pointer-events: none;
}

.feature-card__label {
  position: absolute;
  left: 0.9rem;
  bottom: 0.9rem;
  z-index: 2;
  pointer-events: none;
}

.feature-card__tag {
  display: inline-block;
  margin-bottom: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: rgba(201, 138, 90, 0.25);
  color: #f0e8dc;
  font-size: 0.7rem;
  font-weight: 600;
}

.feature-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
}
</style>
