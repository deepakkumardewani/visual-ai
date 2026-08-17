<script setup lang="ts">
import Copyright from '@/components/Copyright.vue';

import { FOOTER_LINKS } from '@/utils/constants';
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <Copyright />

      <nav class="app-footer__nav" aria-label="Footer">
        <router-link
          v-for="(link, index) in FOOTER_LINKS"
          :key="index"
          :to="link.path"
          class="app-footer__link"
        >
          <font-awesome-icon :icon="link.icon" size="sm" class="app-footer__icon" />
          {{ link.text }}
        </router-link>
      </nav>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  width: 100%;
  background: rgb(var(--tw-canvas));
  border-top: 1px solid rgb(var(--tw-hairline));
  color: rgb(var(--tw-ink-muted));
}

.app-footer__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.25rem 1rem 1.5rem;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    padding: 1.5rem 1.5rem 1.75rem;
  }
}

.app-footer__nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem 0.25rem;

  @media (min-width: 768px) {
    justify-content: flex-end;
    max-width: 70%;
  }
}

.app-footer__link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  color: rgb(var(--tw-ink-primary));
  font-size: 0.875rem;
  line-height: 1.25;
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: rgb(var(--tw-accent));
  }
}

.app-footer__icon {
  color: rgb(var(--tw-ink-muted));
}

.app-footer__link:hover .app-footer__icon {
  color: rgb(var(--tw-accent));
}
</style>
