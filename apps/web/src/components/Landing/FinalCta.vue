<script setup lang="ts">
import LandingButton from "@/components/Landing/LandingButton.vue";
</script>

<template>
  <section class="cta">
    <div class="cta__inner">
      <h2 v-reveal class="cta__title">Your next image is one prompt away.</h2>
      <p v-reveal="{ delay: 0.08 }" class="cta__sub">
        Generate, upscale, colorize, and revive — start with 20 free credits today.
      </p>
      <div v-reveal="{ delay: 0.16 }" class="cta__actions">
        <LandingButton to="/signup" size="lg">Start free</LandingButton>
        <LandingButton to="/pricing" variant="ghost" size="lg">See pricing</LandingButton>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.cta {
  position: relative;
  z-index: 1;
  padding: clamp(4rem, 9vw, 8rem) 1.5rem;
}
.cta__inner {
  max-width: 46rem;
  margin: 0 auto;
  text-align: center;
  padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.5rem, 5vw, 3.5rem);
  border: 1px solid #3a2e22;
  border-radius: 28px;
  background:
    radial-gradient(120% 140% at 50% 0%, rgba(201, 138, 90, 0.14) 0%, rgba(201, 138, 90, 0) 55%),
    #1d1610;
}
.cta__title {
  font-family: "Young Serif", Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4.5vw, 3.25rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: #f0e8dc;
  margin: 0;
}
.cta__sub {
  margin: 1.25rem auto 0;
  max-width: 32rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #a89888;
}
.cta__actions {
  margin-top: 2.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}
</style>
