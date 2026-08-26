<script setup lang="ts">
import type { FeatureLandingCopy } from '@/utils/featureLandings';

defineProps<{
  pages: FeatureLandingCopy[];
}>();
</script>

<template>
  <nav v-if="pages.length" class="more" aria-labelledby="more-title">
    <header class="more__head">
      <p id="more-title" class="more__eyebrow">Also in the studio</p>
      <p class="more__sub">Four other tools. Same credits. Same browser.</p>
    </header>

    <ul class="more__list">
      <li v-for="(page, i) in pages" :key="page.path" class="more__item">
        <router-link :to="page.path" class="more__link">
          <span class="more__n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="more__label">{{ page.navLabel }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
.more {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem clamp(4rem, 8vw, 6rem);
  display: grid;
  gap: 1.75rem;

  @media (min-width: 720px) {
    grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
    gap: 2.5rem 3.5rem;
    align-items: end;
  }
}

.more__head {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.more__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d29467;
}

.more__sub {
  margin: 0;
  max-width: 16rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgb(var(--tw-ink-muted));
}

.more__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid rgb(var(--tw-hairline));

  @media (min-width: 900px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.more__item {
  border-bottom: 1px solid rgb(var(--tw-hairline));
  padding-inline: 0.85rem;

  &:first-child {
    padding-inline-start: 0;
  }

  @media (min-width: 900px) {
    border-right: 1px solid rgb(var(--tw-hairline));
    padding-inline: 1.25rem;

    &:first-child {
      padding-inline-start: 0;
    }

    &:nth-child(4n) {
      border-right: none;
      padding-inline-end: 0;
    }
  }

  @media (max-width: 899px) {
    &:nth-child(odd) {
      border-right: 1px solid rgb(var(--tw-hairline));
      padding-inline-start: 0;
    }

    &:nth-child(even) {
      padding-inline-end: 0;
    }
  }
}

.more__link {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 0;
  text-decoration: none;
  color: rgb(var(--tw-ink-primary));
  min-height: 5.5rem;

  &:hover .more__label,
  &:focus-visible .more__label {
    color: #c98a5a;
  }

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 4px;
  }
}

.more__n {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 0.95rem;
  color: rgb(var(--tw-ink-muted));
}

.more__label {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.2rem;
  line-height: 1.25;
  transition: color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
