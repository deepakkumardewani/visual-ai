<script setup lang="ts">
import CapabilitiesFeaturedRow from '@/components/Landing/CapabilitiesFeaturedRow.vue';
import CapabilitiesFinishTools from '@/components/Landing/CapabilitiesFinishTools.vue';
import type { FinishToolTile } from '@/components/Landing/CapabilitiesFinishTools.vue';
import CapabilitiesStudioLabs from '@/components/Landing/CapabilitiesStudioLabs.vue';
import type { StudioLabChip } from '@/components/Landing/CapabilitiesStudioLabs.vue';
import { getTransformCreditCost } from '@/utils/generationCredits';
import { getFeaturedModels, MODELS, UPSCALER_MODELS } from '@/utils/models';

/** Compact studio chips — generation catalog labs, preferred order. */
const STUDIO_LAB_ORDER = [
  'Black Forest Labs',
  'Google',
  'OpenAI',
  'xAI',
  'ByteDance',
  'Z-Image',
] as const;

const featuredModels = getFeaturedModels(MODELS);

const studioLabs: StudioLabChip[] = (() => {
  const counts = new Map<string, number>();
  for (const model of MODELS) {
    const name = model.companyName;
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return STUDIO_LAB_ORDER.filter((name) => counts.has(name)).map((name) => ({
    name,
    count: counts.get(name) ?? 0,
  }));
})();

function upscalerCredit(title: string): number {
  return (
    UPSCALER_MODELS.find((model) => model.title === title)?.creditCost ?? getTransformCreditCost()
  );
}

const finishTools: FinishToolTile[] = (() => {
  const utilityCost = getTransformCreditCost();
  const clarityCost = upscalerCredit('Clarity Upscaler');
  const topazCost = upscalerCredit('Topaz');
  const upscaleCosts = [...new Set([clarityCost, topazCost])];

  return [
    {
      title: 'Upscale',
      description: 'Clarity through Topaz — everyday sharpening to studio recovery.',
      to: '/image-upscaler',
      costs: upscaleCosts,
    },
    {
      title: 'Colorize / Restore',
      description: 'Bring faded stills back in color, or repair old photographs.',
      to: '/colorize-photo',
      costs: [utilityCost],
    },
    {
      title: 'Remove background',
      description: 'Cut the subject clean for composites, listings, and layouts.',
      to: '/remove-background',
      costs: [utilityCost],
    },
  ];
})();
</script>

<template>
  <section id="models" class="caps">
    <div class="caps__head">
      <p v-reveal class="eyebrow">Under the hood</p>
      <h2 v-reveal="{ delay: 0.05 }" class="caps__title">The models, not a single engine.</h2>
      <p v-reveal="{ delay: 0.1 }" class="caps__sub">
        Labs across the roster — pick speed for drafts, fidelity for finals.
      </p>
    </div>

    <CapabilitiesFeaturedRow :models="featuredModels" />
    <CapabilitiesStudioLabs :labs="studioLabs" />
    <CapabilitiesFinishTools :tools="finishTools" />
  </section>
</template>

<style scoped lang="scss">
.caps {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: clamp(3.5rem, 6vw, 5.5rem) 1.5rem;
}

.caps__head {
  max-width: 42rem;
  margin-bottom: clamp(2.5rem, 5vw, 3.5rem);
}

.caps__title {
  font-family: 'Young Serif', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: rgb(var(--tw-ink-primary));
  margin: 1rem 0 0;
}

.caps__sub {
  margin: 1rem 0 0;
  font-size: 1.1rem;
  line-height: 1.65;
  color: rgb(var(--tw-ink-muted));
}
</style>
