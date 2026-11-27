<script setup lang="ts">
import { gsap } from 'gsap';
import { ref } from 'vue';

import { TOOLS } from '@/utils/landing';

import { useSceneMotion } from '@/components/Home/composables/useSceneMotion';
import ToolChapterCopy from '@/components/Home/ToolChapterCopy.vue';
import ToolChapterStacked from '@/components/Home/ToolChapterStacked.vue';
import ToolRail from '@/components/Home/ToolRail.vue';
import ToolStage from '@/components/Home/ToolStage.vue';

import { buildToolsTimeline, clearTail, queryStage } from '@/components/Home/toolsTimeline';
import { STAGE_RATIO_HEIGHT, STAGE_RATIO_WIDTH } from '@/components/Home/toolsMedia';

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
  <section id="tools" ref="root" class="tools home-section" aria-labelledby="tools-title">
    <!--
      Desktop with motion: one pinned screen scrubbed through every chapter, the
      section heading as its top block. Elsewhere only the heading shows here.
    -->
    <div ref="pin" class="tools__pin" :style="STAGE_RATIO_STYLE">
      <div class="home-container tools__frame">
        <div class="tools__copy-column" data-stage-copy-column>
          <header class="tools__header">
            <p class="home-eyebrow">{{ TOOLS.length }} tools, one studio</p>
            <h2 id="tools-title" class="home-display tools__title" tabindex="-1">
              See what each one does.
            </h2>
          </header>
          <ToolRail class="tools__rail" :tools="TOOLS" :active="activeChapter" />
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
        <div class="tools__stage-cell">
          <ToolStage class="tools__stage" :tools="TOOLS" data-stage-media />
        </div>
      </div>
    </div>

    <!-- Mobile and reduced motion: every chapter laid out in turn. -->
    <div class="home-container tools__list">
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
  /* Pulls the next scene over the pin's empty lower edge; set by the stage timeline. */
  margin-bottom: calc(var(--tools-tail, 0px) * -1);
}

.tools__header {
  display: flex;
  flex-direction: column;
  gap: var(--home-space-md);
}

.tools__title {
  max-width: 14ch;
}

/* Outside the pinned layout only the heading is shown, above the stacked list. */
/* Prefixed so it outranks the rail component's own root display. */
.tools .tools__rail,
.tools__copies,
.tools__stage-cell {
  display: none;
}

.tools__list {
  display: flex;
  flex-direction: column;
  gap: var(--home-space-4xl);
  margin-top: var(--home-space-3xl);
}

@media #{$pinned-query} {
  /* The pin is the section's first screen: the nav inset is its only top spacing. */
  .tools {
    padding-top: 0;
  }

  .tools__list {
    display: none;
  }

  .tools__pin {
    display: flex;
    height: 100svh;
    padding: var(--home-nav-height) 0 var(--home-space-xl);
  }

  /* Copy column and stage are both centred in the screen; the stage spans its full height. */
  .tools__frame {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: center;
    gap: var(--home-space-3xl);
  }

  .tools__copy-column {
    display: flex;
    flex-direction: column;
  }

  /* Heading and rail read as one masthead; the chapter copy starts a clear step below. */
  .tools__header {
    gap: var(--home-space-xs);
  }

  .tools__title {
    max-width: none;
    font-size: var(--home-text-title);
  }

  .tools .tools__rail {
    display: flex;
    margin-top: var(--home-space-lg);
  }

  /* All five blocks share one cell, so the column is as tall as the longest and never jumps. */
  .tools__copies {
    display: grid;
    margin-top: var(--home-space-2xl);
  }

  .tools__copy {
    grid-area: 1 / 1;
  }

  /* A size container, so the 16:10 stage fits whichever of the cell's sides is tighter. */
  .tools__stage-cell {
    display: grid;
    align-self: stretch;
    place-items: center end;
    container-type: size;
  }

  .tools__stage {
    width: min(100cqw, 100cqh * var(--tools-stage-ratio));
  }
}
</style>
