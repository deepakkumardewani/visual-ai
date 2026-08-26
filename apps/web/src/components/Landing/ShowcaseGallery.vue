<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';
import { onUnmounted, shallowRef, watch } from 'vue';

import LandingButton from '@/components/Landing/LandingButton.vue';
import { useShareActions } from '@/composables/useShareActions';
import { SHOWCASE, type GalleryItem } from '@/utils/landing';

const selected = shallowRef<GalleryItem | null>(null);
const { copyPrompt } = useShareActions();

function openTile(item: GalleryItem) {
  selected.value = item;
}

function closeLightbox() {
  selected.value = null;
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) closeLightbox();
}

async function onCopyPrompt() {
  const prompt = selected.value?.prompt;
  if (!prompt) return;
  await copyPrompt(prompt);
}

onKeyStroke('Escape', (event) => {
  if (!selected.value) return;
  event.preventDefault();
  closeLightbox();
});

watch(selected, (item) => {
  document.body.style.overflow = item ? 'hidden' : '';
});

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<template>
  <section id="showcase" class="showcase">
    <div class="showcase__head">
      <p v-reveal class="eyebrow">Showcase</p>
      <h2 v-reveal="{ delay: 0.05 }" class="showcase__title">Made with Visual AI.</h2>
      <p v-reveal="{ delay: 0.1 }" class="showcase__sub">
        A small slice of what creators have generated.
      </p>
      <p v-reveal="{ delay: 0.14 }" class="showcase__kicker">Real prompts, untouched output.</p>
    </div>

    <div class="wall">
      <figure v-for="item in SHOWCASE" :key="item.url" class="tile">
        <button type="button" class="tile__btn" @click="openTile(item)">
          <img
            :src="item.url"
            :alt="item.prompt"
            class="tile__img"
            loading="lazy"
            decoding="async"
          />
          <span class="tile__overlay">
            <span class="tile__prompt">{{ item.prompt }}</span>
          </span>
        </button>
      </figure>
    </div>

    <div v-reveal class="showcase__foot">
      <LandingButton to="/gallery" variant="ghost">Explore the full gallery →</LandingButton>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="selected" class="lightbox" role="presentation" @click="onBackdropClick">
      <div
        class="lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="showcase-lightbox-prompt"
        @click.stop
      >
        <button type="button" class="lightbox__close" aria-label="Close" @click="closeLightbox">
          ×
        </button>
        <img :src="selected.url" :alt="selected.prompt" class="lightbox__img" />
        <p id="showcase-lightbox-prompt" class="lightbox__prompt">{{ selected.prompt }}</p>
        <div class="lightbox__actions">
          <LandingButton variant="ghost" @click="onCopyPrompt">Copy prompt</LandingButton>
          <LandingButton to="/gallery" variant="primary">Open gallery</LandingButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.showcase {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: clamp(3.5rem, 6vw, 5.5rem) 1.5rem;
}

.showcase__head {
  max-width: 40rem;
  margin-bottom: clamp(2.5rem, 5vw, 4rem);
}
.showcase__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 1rem 0 0;
}
.showcase__sub {
  margin: 1rem 0 0;
  font-size: 1.1rem;
  color: rgb(var(--tw-ink-muted));
}
.showcase__kicker {
  margin: 0.45rem 0 0;
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-muted));
}

.wall {
  column-count: 2;
  column-gap: 1rem;

  @media (min-width: 700px) {
    column-count: 3;
  }
  @media (min-width: 1100px) {
    column-count: 4;
  }
}

.tile {
  position: relative;
  margin: 0 0 1rem;
  break-inside: avoid;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #2d2319;
}
.tile__btn {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font: inherit;

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 3px;
  }
}
.tile__img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.tile:hover .tile__img {
  transform: scale(1.05);
}

.tile__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 1rem;
  background: linear-gradient(to top, rgba(24, 18, 14, 0.92) 0%, rgba(24, 18, 14, 0) 60%);
  opacity: 1;
  transition: opacity 0.35s ease;
  pointer-events: none;
}
.tile__prompt {
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-primary));
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 700px) {
  .tile__overlay {
    opacity: 0;
  }
  .tile:hover .tile__overlay {
    opacity: 1;
  }
  .tile__prompt {
    -webkit-line-clamp: 3;
  }
}

.showcase__foot {
  margin-top: 2.5rem;
  display: flex;
  justify-content: center;
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(8, 6, 4, 0.72);
  backdrop-filter: blur(8px);
}
.lightbox__panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(40rem, 100%);
  max-height: 92dvh;
  overflow: auto;
  padding: 1.25rem;
  border-radius: 16px;
  border: 1px solid #2d2319;
  background: rgb(var(--tw-canvas));
}
.lightbox__close {
  position: absolute;
  top: 0.65rem;
  right: 0.75rem;
  z-index: 1;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 9999px;
  background: rgba(8, 6, 4, 0.55);
  color: rgb(var(--tw-ink-primary));
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 2px;
  }
}
.lightbox__img {
  display: block;
  width: 100%;
  max-height: min(55dvh, 28rem);
  height: auto;
  object-fit: contain;
  border-radius: 10px;
}
.lightbox__prompt {
  margin: 1rem 0 0;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.55;
  color: rgb(var(--tw-ink-primary));
}
.lightbox__actions {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  gap: 0.75rem;
  margin-top: 1.15rem;
}

@media (prefers-reduced-motion: reduce) {
  .tile__img,
  .tile:hover .tile__img {
    transition: none;
    transform: none;
  }
}
</style>
