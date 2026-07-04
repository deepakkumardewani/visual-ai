<script setup lang="ts">
import { ref } from "vue";

import { FAQS } from "@/utils/landing";

const open = ref<number | null>(0);

function toggle(i: number) {
  open.value = open.value === i ? null : i;
}
</script>

<template>
  <section id="faq" class="faq">
    <div class="faq__head">
      <p v-reveal class="eyebrow">Questions</p>
      <h2 v-reveal="{ delay: 0.05 }" class="faq__title">Good to know.</h2>
    </div>

    <ul class="faq__list">
      <li
        v-for="(item, i) in FAQS"
        :key="item.question"
        v-reveal="{ delay: i * 0.05 }"
        class="faq__item"
      >
        <button
          class="faq__q"
          :aria-expanded="open === i"
          :aria-controls="`faq-panel-${i}`"
          @click="toggle(i)"
        >
          <span>{{ item.question }}</span>
          <span class="faq__icon" :class="{ 'is-open': open === i }" aria-hidden="true"></span>
        </button>
        <div :id="`faq-panel-${i}`" class="faq__panel" :class="{ 'is-open': open === i }">
          <div class="faq__panel-inner">
            <p class="faq__a">{{ item.answer }}</p>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.faq {
  position: relative;
  z-index: 1;
  max-width: 52rem;
  margin: 0 auto;
  padding: clamp(4rem, 8vw, 7rem) 1.5rem;
}

.faq__head {
  margin-bottom: clamp(2rem, 4vw, 3rem);
}
.faq__title {
  font-family: "Young Serif", Georgia, serif;
  font-weight: 400;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: #f0e8dc;
  margin: 1rem 0 0;
}

.faq__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.faq__item {
  border-bottom: 1px solid #2d2319;
}

.faq__q {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 0;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: "Source Sans 3", system-ui, sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f0e8dc;
  transition: color 0.2s ease;

  &:hover {
    color: #c98a5a;
  }
  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 4px;
  }
}

.faq__icon {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 14px;
    height: 2px;
    background: #c98a5a;
    transform: translate(-50%, -50%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  &::after {
    transform: translate(-50%, -50%) rotate(90deg);
  }
  &.is-open::after {
    transform: translate(-50%, -50%) rotate(0deg);
  }
}

.faq__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  &.is-open {
    grid-template-rows: 1fr;
  }
}
.faq__panel-inner {
  overflow: hidden;
}
.faq__a {
  margin: 0;
  padding-bottom: 1.5rem;
  max-width: 46rem;
  font-size: 1rem;
  line-height: 1.7;
  color: #a89888;
}

@media (prefers-reduced-motion: reduce) {
  .faq__panel,
  .faq__icon::before,
  .faq__icon::after {
    transition: none;
  }
}
</style>
