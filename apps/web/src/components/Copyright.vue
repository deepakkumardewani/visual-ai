<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="copyright">
    <p>
      &copy; {{ currentYear }}
      <button type="button" class="copyright__brand" @click="router.push('/')">Visual AI</button>
      <span class="copyright__sep" aria-hidden="true">·</span>
      <span>All rights reserved</span>
    </p>
  </div>
</template>

<style scoped lang="scss">
.copyright {
  color: rgb(var(--tw-ink-muted));
  font-size: 0.875rem;
  text-align: center;

  @media (min-width: 768px) {
    text-align: left;
  }

  p {
    margin: 0;
  }
}

.copyright__brand {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: rgb(var(--tw-accent));
  cursor: pointer;
  font: inherit;
}

.copyright__sep {
  display: inline-block;
  margin: 0 0.45rem;
  color: rgb(var(--tw-ink-faint));
}
</style>
