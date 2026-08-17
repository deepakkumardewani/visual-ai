<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

defineProps<{
  title: string;
}>();
</script>

<template>
  <button
    type="button"
    class="dash-btn"
    data-testid="header-dashboard-btn"
    @click="router.push('/create')"
  >
    <span class="dash-btn__label">{{ title }}</span>
  </button>
</template>

<style scoped>
.dash-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.4rem 1.1rem;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  box-shadow:
    0 0 16px rgba(201, 168, 76, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  transition:
    opacity 150ms ease,
    transform 150ms ease,
    box-shadow 150ms ease;
}

.dash-btn:hover {
  opacity: 0.94;
  box-shadow:
    0 0 20px rgba(201, 168, 76, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.32);
}

.dash-btn:active {
  transform: scale(0.98);
}

.dash-btn:focus-visible {
  outline: 2px solid #c9a84c;
  outline-offset: 3px;
}

.dash-btn__label {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .dash-btn {
    transition: none;
  }

  .dash-btn:active {
    transform: none;
  }
}
</style>
