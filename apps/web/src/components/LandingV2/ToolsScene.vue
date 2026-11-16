<script setup lang="ts">
import { gsap } from 'gsap';
import { ref } from 'vue';

import { TOOLS } from '@/utils/landing';

import { useSceneMotion } from '@/components/LandingV2/composables/useSceneMotion';
import ToolChapterCopy from '@/components/LandingV2/ToolChapterCopy.vue';
import ToolChapterStacked from '@/components/LandingV2/ToolChapterStacked.vue';
import ToolRail from '@/components/LandingV2/ToolRail.vue';
import ToolStage from '@/components/LandingV2/ToolStage.vue';

import { buildToolsTimeline, clearTail, queryStage } from '@/components/LandingV2/toolsTimeline';
import { STAGE_RATIO_HEIGHT, STAGE_RATIO_WIDTH } from '@/components/LandingV2/toolsMedia';

const REVEAL_SHIFT = 28;
const REVEAL_DURATION = 0.8;
const REVEAL_STAGGER = 0.12;
const REVEAL_START = 'top 85%';

const STAGE_RATIO_STYLE = { '--tools-stage-ratio': String(STAGE_RATIO_WIDTH / STAGE_RATIO_HEIGHT) };

const root = ref<HTMLElement | null>(null);
const pin = ref<HTMLElement | null>(null);
const activeChapter = ref(0);

function setActiveChapter(index: number): void {
  // Only on change: onUpdate fires every scrubbed frame.
  if (index !== activeChapter.value) activeChapter.value = index;
}

/** Mobile: each stacked chapter rises in once as it enters. */
function revealStacked(section: HTMLElement): void {
  section.querySelectorAll<HTMLElement>('[data-stacked-chapter]').forEach((chapter) => {
    gsap.from(chapter.querySelectorAll('[data-stacked-part]'), {
      autoAlpha: 0,
      y: REVEAL_SHIFT,
      duration: REVEAL_DURATION,
      stagger: REVEAL_STAGGER,
      ease: 'power3.out',
      scrollTrigger: { trigger: chapter, start: REVEAL_START, once: true },
    });
  });
}

// Which tree is visible is decided by CSS on the same media queries, so the DOM
// is already right when matchMedia runs this, including on a live resize.
useSceneMotion(root, ({ isDesktop, motionOk }, section) => {
  if (!motionOk) return;
  if (!isDesktop) {
    revealStacked(section);
    return;
  }
  const pinEl = pin.value;
  if (!pinEl) throw new Error('ToolsScene: pinned stage is not mounted');
  buildToolsTimeline({ tools: TOOLS, elements: queryStage(pinEl), onChapter: setActiveChapter });
  return () => {
    clearTail(pinEl);
    activeChapter.value = 0;
  };
});
</script>

<template>
  <section id="tools" ref="root" class="tools lv2-section" aria-labelledby="tools-title">
    <header class="lv2-container tools__header">
      <p class="lv2-eyebrow">{{ TOOLS.length }} tools, one studio</p>
      <h2 id="tools-title" class="lv2-display tools__title">See what each one does.</h2>
    </header>

    <!-- Desktop with motion: one pinned stage scrubbed through every chapter. -->
    <div ref="pin" class="tools__pin" :style="STAGE_RATIO_STYLE">
      <div class="lv2-container tools__frame">
        <div class="tools__copy-column">
          <ToolRail :tools="TOOLS" :active="activeChapter" />
          <div class="tools__copies">
            <ToolChapterCopy
              v-for="(tool, index) in TOOLS"
              :key="tool.id"
              class="tools__copy"
              :tool="tool"
              :index="index"
              data-stage-copy
            />
          </div>
        </div>
        <ToolStage class="tools__stage" :tools="TOOLS" />
      </div>
    </div>

    <!-- Mobile and reduced motion: every chapter laid out in turn. -->
    <div class="lv2-container tools__list">
      <ToolChapterStacked
        v-for="(tool, index) in TOOLS"
        :key="tool.id"
        :tool="tool"
        :index="index"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
/* Must match DESKTOP_QUERY and MOTION_OK_QUERY in useSceneMotion. */
$pinned-query: '(min-width: 900px) and (prefers-reduced-motion: no-preference)';

.tools {
  /* Pulls the next scene over the pin's empty lower half; set by the stage timeline. */
  margin-bottom: calc(var(--tools-tail, 0px) * -1);
}

.tools__header {
  display: flex;
  flex-direction: column;
  gap: var(--lv2-space-md);
}

.tools__title {
  max-width: 14ch;
}

.tools__pin {
  display: none;
}

.tools__list {
  display: flex;
  flex-direction: column;
  gap: var(--lv2-space-4xl);
  margin-top: var(--lv2-space-3xl);
}

@media #{$pinned-query} {
  .tools__list {
    display: none;
  }

  .tools__pin {
    display: flex;
    align-items: center;
    height: 100svh;
    padding-top: var(--lv2-nav-height);
  }

  .tools__frame {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: center;
    gap: var(--lv2-space-3xl);
  }

  .tools__copy-column {
    display: flex;
    flex-direction: column;
    gap: var(--lv2-space-2xl);
  }

  /* All five blocks share one cell, so the column is as tall as the longest and never jumps. */
  .tools__copies {
    display: grid;
  }

  .tools__copy {
    grid-area: 1 / 1;
  }

  /* Width follows the viewport height too, so the 16:10 frame always fits under the nav. */
  .tools__stage {
    justify-self: end;
    width: min(
      100%,
      calc((100svh - var(--lv2-nav-height) - var(--lv2-space-3xl)) * var(--tools-stage-ratio))
    );
  }
}
</style>
