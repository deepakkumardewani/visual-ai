<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';

import LandingButton from '@/components/Landing/LandingButton.vue';

const userStore = useUserStore();
const dialogStore = useDialogStore();
const { credits, dailyCredits } = storeToRefs(userStore);

const totalCredits = computed(() => (dailyCredits.value || 0) + (credits.value || 0));
</script>

<template>
  <section class="profile-credits" aria-label="Credits">
    <p class="profile-credits__total">
      {{ totalCredits }}
      <span class="profile-credits__unit">credits</span>
    </p>
    <p class="profile-credits__meta">
      {{ dailyCredits || 0 }} daily · {{ credits || 0 }} persistent
    </p>
    <LandingButton
      variant="primary"
      size="md"
      class="profile-credits__buy"
      @click="dialogStore.showBuyCredits()"
    >
      Buy credits
    </LandingButton>
  </section>
</template>

<style scoped lang="scss">
.profile-credits {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.profile-credits__total {
  margin: 0;
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 400;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--tw-ink-primary));
}

.profile-credits__unit {
  margin-left: 0.35rem;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-muted));
}

.profile-credits__meta {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: rgb(var(--tw-ink-muted));
}

.profile-credits__buy {
  margin-top: 0.5rem;
}
</style>
