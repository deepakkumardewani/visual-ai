<script setup lang="ts">
import { ref } from "vue";

import Popover from "@/components/primitives/Popover.vue";
import ProviderIcon from "@/components/primitives/ProviderIcon.vue";
import SegmentedControl from "@/components/primitives/SegmentedControl.vue";
import Stepper from "@/components/primitives/Stepper.vue";
import TierBadge from "@/components/primitives/TierBadge.vue";
import TokenScratch from "@/components/primitives/TokenScratch.vue";
import type { ModelTier } from "@/types/primitives";
import { KNOWN_PROVIDERS } from "@/utils/providerLogos";

const aspect = ref("1:1");
const quality = ref("standard");
const variations = ref(2);

const aspectOptions = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
];

const qualityOptions = [
  { label: "Fast", value: "fast" },
  { label: "Standard", value: "standard" },
  { label: "Ultra", value: "ultra" },
];

const tiers: ModelTier[] = ["budget", "standard", "premium"];
</script>

<template>
  <div class="tw-min-h-screen tw-bg-canvas tw-p-8 tw-text-ink">
    <h1 class="tw-font-display tw-text-display-md tw-mb-8">Phase 0 Primitives</h1>

    <section class="tw-mb-10">
      <h2 class="tw-mb-4 tw-text-body-lg tw-font-semibold tw-text-ink-muted">Token Scratch</h2>
      <TokenScratch />
    </section>

    <section class="tw-mb-10">
      <h2 class="tw-mb-4 tw-text-body-lg tw-font-semibold tw-text-ink-muted">Popover</h2>
      <Popover>
        <template #trigger>
          <span>Open popover</span>
        </template>
        <p class="tw-text-body-sm tw-text-ink-muted">Floating panel content</p>
        <button
          type="button"
          class="tw-mt-2 tw-text-body-sm tw-text-accent focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-accent focus-visible:tw-outline-offset-[3px]"
        >
          Focusable item
        </button>
      </Popover>
    </section>

    <section class="tw-mb-10 tw-flex tw-flex-wrap tw-gap-8">
      <SegmentedControl v-model="aspect" label="Aspect ratio" :options="aspectOptions" />
      <SegmentedControl v-model="quality" label="Quality" :options="qualityOptions" />
      <Stepper v-model="variations" label="Variations" :min="1" :max="4" />
    </section>

    <section class="tw-mb-10">
      <h2 class="tw-mb-4 tw-text-body-lg tw-font-semibold tw-text-ink-muted">Tier Badges</h2>
      <div class="tw-flex tw-gap-3">
        <TierBadge v-for="tier in tiers" :key="tier" :tier="tier" />
      </div>
    </section>

    <section>
      <h2 class="tw-mb-4 tw-text-body-lg tw-font-semibold tw-text-ink-muted">Provider Icons</h2>
      <div class="tw-flex tw-flex-wrap tw-gap-3">
        <ProviderIcon v-for="provider in KNOWN_PROVIDERS" :key="provider" :provider="provider" />
        <ProviderIcon provider="unknown-co" />
      </div>
    </section>
  </div>
</template>
