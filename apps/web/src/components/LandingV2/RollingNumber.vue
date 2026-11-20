<script setup lang="ts">
import { gsap } from 'gsap';
import { computed, ref } from 'vue';

import { useSceneMotion } from '@/components/LandingV2/composables/useSceneMotion';

const props = defineProps<{
  /** The true value. Assistive tech always reads this, never the rolling digits. */
  value: number;
}>();

const DIGITS_IN_BASE = 10;
const ROLL_START = 'top 92%';
/** Settled well before the number reaches mid-viewport, so it never lands late. */
const ROLL_END = 'top 58%';

interface DigitColumn {
  /** Stacked top to bottom; item 0 is the final digit, so the unanimated layout is the answer. */
  stack: number[];
}

/**
 * Each column holds a full turn plus the final digit. Reading upward from the
 * bottom of the stack it counts from 0 to the final digit, so every column
 * rolls (a "0" does not sit still) and all of them end exactly on the value.
 */
const columns = computed<DigitColumn[]>(() =>
  Array.from(String(props.value), (char) => {
    const digit = Number(char);
    const steps = DIGITS_IN_BASE + digit;
    return {
      stack: Array.from(
        { length: steps + 1 },
        (_, i) => (digit - i + DIGITS_IN_BASE * 2) % DIGITS_IN_BASE,
      ),
    };
  }),
);

const root = ref<HTMLElement | null>(null);

useSceneMotion(root, ({ motionOk }, rootEl) => {
  if (!motionOk) return;
  const strips = rootEl.querySelectorAll<HTMLElement>('.rn__strip');
  strips.forEach((strip) => {
    const length = strip.children.length;
    gsap.fromTo(
      strip,
      { yPercent: (-(length - 1) / length) * 100 },
      {
        yPercent: 0,
        ease: 'power2.out',
        scrollTrigger: { trigger: rootEl, start: ROLL_START, end: ROLL_END, scrub: 0.6 },
      },
    );
  });
});
</script>

<template>
  <span ref="root" class="rn">
    <span class="rn__sr">{{ value }}</span>
    <span class="rn__digits" aria-hidden="true">
      <span v-for="(column, index) in columns" :key="index" class="rn__col">
        <span class="rn__strip">
          <span v-for="(digit, i) in column.stack" :key="i" class="rn__digit">{{ digit }}</span>
        </span>
      </span>
    </span>
  </span>
</template>

<style scoped lang="scss">
.rn {
  position: relative;
  display: inline-flex;
  font-family: var(--lv2-font-display);
  font-size: inherit;
  line-height: 1;
}

.rn__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.rn__digits {
  display: inline-flex;
  /* Clip the strips to one digit tall; the small padding keeps descenders and the overshoot of round digits. */
  overflow: hidden;
  padding-block: 0.06em;
}

.rn__col {
  display: block;
  /* Fixed column width so every digit position is the same size however the roll lands. */
  width: 0.68em;
  height: 1em;
  overflow: visible;
}

.rn__strip {
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.rn__digit {
  display: block;
  height: 1em;
  text-align: center;
  font-variant-numeric: lining-nums tabular-nums;
}
</style>
