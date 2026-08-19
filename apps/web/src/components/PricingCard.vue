<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

import { type Plan } from '@/stores/app';
import { useAppStore } from '@/stores/app';
import { useUserStore } from '@/stores/user';

import Tooltip from '@/components/primitives/Tooltip.vue';

import { RAZORPAY_PRODUCTS } from '@/utils/constants';
import { initiatePayment } from '@/utils/payment';

const props = defineProps<{
  plan: Plan;
}>();

const appStore = useAppStore();
const { isDark } = storeToRefs(appStore);
const userStore = useUserStore();
const { isPro } = storeToRefs(userStore);
const isLoading = ref(false);
const cardBackground = computed(() => {
  if (!props.plan.isFree) {
    return isDark.value ? 'tw-bg-[#2A2119]' : 'tw-bg-[#F5E6D3]';
  }
  return 'tw-bg-surface-1';
});

const priceColor = computed(() => {
  return isDark.value ? 'tw-text-[#D4B577]' : 'tw-text-[#9E7D35]';
});

const isCtaDisabled = computed(() => props.plan.isFree || isPro.value || isLoading.value);

const ctaLabel = computed(() => {
  if (props.plan.isFree) return 'Current Plan';
  if (isPro.value) return 'Subscribed';
  return 'Upgrade Now';
});

const ctaClass = computed(() => {
  if (props.plan.isFree) {
    return 'tw-border tw-border-ink-faint tw-bg-transparent tw-text-ink-muted';
  }
  return 'tw-bg-gold tw-text-[#18120e] tw-shadow-card';
});

async function handleUpgrade() {
  if (!props.plan.isFree) {
    try {
      isLoading.value = true;
      const product = RAZORPAY_PRODUCTS[4];
      await initiatePayment(product, true);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      isLoading.value = false;
    }
  }
}
</script>

<template>
  <article
    :class="[
      'tw-mx-auto tw-my-4 tw-min-h-[450px] tw-max-w-[360px] tw-rounded-[8px] tw-shadow-card tw-transition-shadow hover:tw-shadow-elevated',
      cardBackground,
    ]"
  >
    <div class="tw-px-4 tw-pt-6 tw-text-center">
      <h2 class="tw-font-display tw-text-[2.125rem] tw-font-bold tw-leading-tight tw-text-ink">
        {{ plan.title }}
      </h2>

      <div>
        <div class="tw-my-2 tw-flex tw-items-center tw-justify-center">
          <span
            :class="['tw-font-display tw-text-[3rem] tw-font-bold tw-leading-tight', priceColor]"
            >₹{{ plan.price }}</span
          >
          <span class="tw-ml-1 tw-mt-4 tw-font-body tw-text-body-base tw-text-ink-muted"
            >/month</span
          >
        </div>
        <p class="tw-font-body tw-text-body-base tw-text-ink">{{ plan.description }}</p>
      </div>
    </div>

    <div class="tw-px-4 tw-pb-4">
      <div class="tw-my-2">
        <button
          type="button"
          class="tw-flex tw-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded tw-px-6 tw-font-body tw-text-body-base tw-font-medium tw-transition-transform hover:tw-scale-[1.02] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          :class="ctaClass"
          :disabled="isCtaDisabled"
          :aria-busy="isLoading"
          @click="handleUpgrade"
        >
          <span
            v-if="isLoading"
            class="tw-mr-2 tw-inline-block tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-[#18120e]/25 tw-border-t-[#18120e] motion-reduce:tw-animate-none"
            aria-hidden="true"
          />
          {{ ctaLabel }}
        </button>
      </div>

      <hr class="tw-my-4 tw-border-0 tw-border-t tw-border-hairline" />

      <div class="tw-my-4">
        <div class="tw-mb-4 tw-font-display tw-text-[1.25rem] tw-font-medium tw-text-ink">
          Features:
        </div>
        <div
          v-for="(feature, index) in plan.features"
          :key="index"
          class="tw-my-3 tw-flex tw-items-center"
        >
          <font-awesome-icon
            :icon="feature.available ? ['fas', 'check'] : ['fas', 'times']"
            :class="feature.available ? 'tw-text-[#4CAF50]' : 'tw-text-[#FF5252]'"
            class="tw-mr-2"
          />
          <p class="tw-font-body tw-text-body-base tw-text-ink">{{ feature.title }}</p>
          <Tooltip v-if="feature.tooltip" :text="feature.tooltip" placement="top">
            <font-awesome-icon
              :icon="['fas', 'circle-question']"
              class="tw-ml-2 tw-text-sm tw-text-ink-muted"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  </article>
</template>
