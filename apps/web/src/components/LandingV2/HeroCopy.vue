<script setup lang="ts">
import { scrollToSection } from '@/composables/useLenis';

import { usePrimaryCta } from '@/components/LandingV2/composables/usePrimaryCta';
import HeroPrompt from '@/components/LandingV2/HeroPrompt.vue';
import { FREE_CREDITS_COPY } from '@/utils/landing';
import { createLogger } from '@/utils/logger';
import LandingButton from '@/components/Landing/LandingButton.vue';

defineProps<{
  prompt: string;
  typed: number;
  /** Every prompt the hero can show; the prompt box reserves room for the tallest. */
  promptSizes: readonly string[];
  /** The prompt rotates on its own; its box shows a pause control. */
  promptRotating: boolean;
  promptPaused: boolean;
}>();

const emit = defineEmits<{
  togglePromptPause: [];
  promptReading: [reading: boolean];
}>();

const log = createLogger('LandingV2:HeroCopy');
const TOOLS_ANCHOR = '#tools';
/** Takes focus after the scroll, so keyboard users continue from the tools, not the faded hero. */
const TOOLS_HEADING = '#tools-title';
const { label: ctaLabel, to: ctaTo } = usePrimaryCta();

function focusToolsHeading(): void {
  const heading = document.querySelector<HTMLElement>(TOOLS_HEADING);
  if (!heading) {
    log.warn(`See the tools: ${TOOLS_HEADING} is not mounted; focus stays on the button`);
    return;
  }
  // preventScroll: the scroll has already landed; focusing must not nudge it.
  heading.focus({ preventScroll: true });
}

function seeTheTools(): void {
  scrollToSection(TOOLS_ANCHOR, { onComplete: focusToolsHeading });
}
</script>

<template>
  <div class="copy">
    <p class="lv2-eyebrow copy__eyebrow">Image studio</p>

    <h1 id="hero-title" class="copy__title">
      <span class="copy__line">A sentence in.</span>
      <span class="copy__line copy__line--gold">An image out.</span>
    </h1>

    <p class="lv2-lede copy__sub">
      Generate from a prompt with models from several labs, then upscale, colorize, restore old
      photos or remove the background without switching apps. {{ FREE_CREDITS_COPY }}
    </p>

    <HeroPrompt
      class="copy__prompt"
      :prompt="prompt"
      :typed="typed"
      :sizes="promptSizes"
      :rotating="promptRotating"
      :paused="promptPaused"
      @toggle-pause="emit('togglePromptPause')"
      @reading="emit('promptReading', $event)"
    />

    <div class="copy__ctas">
      <LandingButton :to="ctaTo" size="lg">{{ ctaLabel }}</LandingButton>
      <LandingButton variant="ghost" size="lg" :href="TOOLS_ANCHOR" @click.prevent="seeTheTools">
        See the tools
      </LandingButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.copy__title {
  margin: var(--lv2-space-lg) 0 0;
  font-family: var(--lv2-font-display);
  font-weight: 400;
  font-size: var(--lv2-text-hero);
  line-height: var(--lv2-leading-display);
  letter-spacing: var(--lv2-tracking-display);
  color: rgb(var(--tw-ink-primary));
}

.copy__line {
  display: block;
}

/* The page's one gold moment above the fold besides the primary button. Solid, not gradient. */
.copy__line--gold {
  color: var(--lv2-gold);
}

.copy__sub {
  margin-top: var(--lv2-space-lg);
  max-width: 34rem;
}

.copy__prompt {
  margin-top: var(--lv2-space-xl);
}

.copy__ctas {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lv2-space-md);
  margin-top: var(--lv2-space-xl);
}
</style>
