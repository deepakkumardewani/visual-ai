<script setup lang="ts">
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { computed, ref, type Component } from 'vue';

import { useSceneMotion } from '@/components/LandingV2/composables/useSceneMotion';
import ShowcaseMedia from '@/components/LandingV2/ShowcaseMedia.vue';
import type { ShowcaseMediaProps } from '@/components/LandingV2/showcaseLayout';
import { SHOWCASE } from '@/utils/landing';

const props = defineProps<{
  /** Replaces the DOM rows; receives `ShowcaseMediaProps`. The `#media` slot wins over this. */
  media?: Component;
}>();

defineSlots<{
  /** Media layer override. Defaults to `media`, else the DOM rows and rail. */
  media?: (props: ShowcaseMediaProps) => unknown;
}>();

const root = ref<HTMLElement | null>(null);
const mediaComponent = computed(() => props.media ?? ShowcaseMedia);

// Plain object, not a ref: media layers read it every frame through getProgress.
const progress = { value: 0 };
const getProgress = (): number => progress.value;

/** Unpinned: progress runs from the scene's top entering the viewport to its bottom leaving. */
useSceneMotion(root, ({ motionOk }, section) => {
  if (!motionOk) return;
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      progress.value = self.progress;
    },
  });
  progress.value = trigger.progress;
  return () => {
    progress.value = 0;
  };
});
</script>

<template>
  <section id="showcase" ref="root" class="showcase" aria-labelledby="showcase-title">
    <header class="showcase__head">
      <div class="showcase__intro">
        <p class="lv2-eyebrow">Showcase</p>
        <h2 id="showcase-title" class="lv2-display showcase__title">
          Every image here began as a sentence.
        </h2>
        <p class="lv2-lede">
          A small slice of what creators have generated, each with the exact prompt that made it.
          Real prompts, untouched output.
        </p>
      </div>
      <RouterLink to="/gallery" class="showcase__link">
        Browse the gallery
        <span class="showcase__arrow" aria-hidden="true">&rarr;</span>
      </RouterLink>
    </header>

    <slot name="media" :items="SHOWCASE" :get-progress="getProgress">
      <component :is="mediaComponent" :items="SHOWCASE" :get-progress="getProgress" />
    </slot>
  </section>
</template>

<style scoped lang="scss">
.showcase {
  position: relative;
  /* Not a `.lv2-section`: the rows run full bleed, so only the block rhythm is shared. */
  padding-block: var(--lv2-section-y);
}

.showcase__head {
  display: grid;
  gap: var(--lv2-space-lg);
  /* Same left edge as the other scenes' `.lv2-section` + `.lv2-container`; the rows stay full bleed. */
  width: min(100% - 2 * var(--lv2-gutter), var(--lv2-max-width));
  margin: 0 auto var(--lv2-space-2xl);
}

.showcase__intro {
  display: grid;
  gap: var(--lv2-space-md);
}

.showcase__title {
  max-width: 14ch;
}

.showcase__link {
  display: inline-flex;
  gap: var(--lv2-space-xs);
  align-items: center;
  justify-self: start;
  min-height: 44px;
  font-weight: 600;
  color: var(--lv2-copper-text);
  text-decoration: underline;
  text-decoration-color: rgb(var(--tw-border));
  text-underline-offset: 0.3em;
  transition: text-decoration-color 200ms var(--lv2-ease-out);

  &:hover {
    text-decoration-color: currentColor;
  }

  &:hover .showcase__arrow {
    transform: translateX(4px);
  }
}

.showcase__arrow {
  transition: transform 240ms var(--lv2-ease-out);
}

@media (min-width: 900px) {
  .showcase__head {
    grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
    align-items: end;
    margin-bottom: var(--lv2-space-3xl);
  }

  .showcase__link {
    justify-self: end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .showcase__link:hover .showcase__arrow {
    transform: none;
  }
}
</style>
