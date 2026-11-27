<script setup lang="ts">
import { gsap } from 'gsap';
import { ref } from 'vue';

import { useSceneMotion } from '@/components/LandingV2/composables/useSceneMotion';
import { GENERATION_MODEL_COUNT, ROSTER_ROWS } from '@/components/LandingV2/modelsRoster';
import { bindCursorLight } from '@/components/LandingV2/useCursorLight';

const REVEAL_START = 'top 70%';
const LINE_DURATION = 1.1;
const LINE_STAGGER = 0.09;

const root = ref<HTMLElement | null>(null);
const list = ref<HTMLElement | null>(null);
const light = ref<HTMLElement | null>(null);

useSceneMotion(root, ({ isDesktop, motionOk }, rootEl) => {
  if (!motionOk) return;

  // One-shot: the lab names rise out of their masks once, then stay.
  gsap.from(rootEl.querySelectorAll('.lab__name-text'), {
    yPercent: 110,
    duration: LINE_DURATION,
    ease: 'expo.out',
    stagger: LINE_STAGGER,
    scrollTrigger: { trigger: list.value, start: REVEAL_START, once: true },
  });
  gsap.from(rootEl.querySelectorAll('.lab__models'), {
    opacity: 0,
    duration: LINE_DURATION,
    ease: 'power2.out',
    stagger: LINE_STAGGER,
    scrollTrigger: { trigger: list.value, start: REVEAL_START, once: true },
  });

  if (isDesktop && list.value && light.value) return bindCursorLight(list.value, light.value);
});
</script>

<template>
  <section id="models" ref="root" class="models lv2-section" aria-labelledby="models-title">
    <div class="lv2-container models__inner">
      <header class="models__head">
        <p class="lv2-eyebrow models__eyebrow">Models</p>
        <h2 id="models-title" class="lv2-display models__title">
          <span class="models__count">{{ GENERATION_MODEL_COUNT }}</span>
          models from several labs.
        </h2>
        <p class="lv2-lede models__lede">
          Pick the one that fits the picture you have in mind. The credit cost sits beside each
          name.
        </p>
      </header>

      <div ref="list" class="models__list">
        <div ref="light" class="models__light" aria-hidden="true" />
        <ul class="labs">
          <li
            v-for="(row, index) in ROSTER_ROWS"
            :key="row.name"
            class="lab"
            :class="{ 'lab--finishing-start': row.finishing && !ROSTER_ROWS[index - 1]?.finishing }"
          >
            <p
              v-if="row.finishing && !ROSTER_ROWS[index - 1]?.finishing"
              class="lv2-eyebrow lab__group"
            >
              Finishing
            </p>
            <h3 class="lab__name">
              <span class="lab__mask"
                ><span class="lab__name-text">{{ row.name }}</span></span
              >
            </h3>
            <div class="lab__models">
              <ul class="lab__featured">
                <li v-for="model in row.models" :key="model.id" class="model">
                  <span class="model__title">{{ model.title }}</span>
                  <span class="model__cost">{{ model.creditLabel }}</span>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.models__inner {
  display: grid;
  gap: var(--lv2-space-3xl);
}

.models__head {
  display: grid;
  gap: var(--lv2-space-lg);
}

.models__title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: var(--lv2-space-md);
}

/* The live count, set large to anchor the header. */
.models__count {
  font-size: clamp(5rem, 3rem + 10vw, 11rem);
  line-height: 1;
}

.models__list {
  /* A notch below the section display size, so a two-line lab name stays a heading, not a wall. */
  --lab-name-size: clamp(2rem, 1.2rem + 2.4vw, 3.25rem);

  position: relative;
}

/* Sits behind the rows and is moved by transform only, so it never repaints the list. */
.models__light {
  position: absolute;
  top: 0;
  left: 0;
  width: 40rem;
  height: 40rem;
  border-radius: 50%;
  /* Strong enough at the core to read on the near-black canvas, still a glow and not a spot. */
  background: radial-gradient(
    circle,
    rgb(201 138 90 / 0.26),
    rgb(201 138 90 / 0.1) 35%,
    transparent 68%
  );
  opacity: 0;
  pointer-events: none;
}

.labs {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lab {
  display: grid;
  gap: var(--lv2-space-sm);
  padding-block: var(--lv2-space-xl);
  border-top: 1px solid rgb(var(--tw-hairline));
}

.lab__name {
  margin: 0;
  font-family: var(--lv2-font-display);
  font-weight: 400;
  font-size: var(--lab-name-size);
  line-height: var(--lv2-leading-display);
  letter-spacing: var(--lv2-tracking-display);
}

/* Padding and matching negative margin keep descenders inside the clip without moving layout. */
.lab__mask {
  display: block;
  overflow: hidden;
  padding-block: 0.12em;
  margin-block: -0.12em;
}

.lab__name-text {
  display: block;
}

.lab__featured {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: var(--lv2-space-sm) var(--lv2-space-xl);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The cost sits right after its name, so the pair reads as one item and not two columns. */
.model {
  display: flex;
  align-items: baseline;
  gap: var(--lv2-space-sm);
}

.model__title {
  color: rgb(var(--tw-ink-secondary));
  font-size: var(--lv2-text-lede);
}

.model__cost {
  margin: 0;
  color: var(--lv2-copper-text);
  font-size: var(--lv2-text-label);
  font-weight: 600;
  letter-spacing: var(--lv2-tracking-label);
  text-transform: uppercase;
}

.lab__group {
  margin-bottom: var(--lv2-space-sm);
}

.lab--finishing-start {
  margin-top: var(--lv2-space-3xl);
}

@media (min-width: 900px) {
  .models__head {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    align-items: end;
    column-gap: var(--lv2-space-2xl);
  }

  .models__eyebrow {
    grid-column: 1 / -1;
  }

  .models__lede {
    padding-bottom: var(--lv2-space-md);
  }

  .lab {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr);
    /* The lab name's first line and the first model share a baseline, row after row. */
    align-items: first baseline;
    gap: var(--lv2-space-2xl);
  }

  .lab__group {
    grid-column: 1 / -1;
  }
}
</style>
