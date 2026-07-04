<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    to?: string;
    href?: string;
    variant?: 'primary' | 'ghost';
    size?: 'md' | 'lg';
  }>(),
  { variant: 'primary', size: 'md' },
);

const tag = computed(() => (props.to ? 'router-link' : props.href ? 'a' : 'button'));
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`]"
  >
    <span class="btn__label"><slot /></span>
  </component>
</template>

<style scoped lang="scss">
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 9999px;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.3s ease;

  &:focus-visible {
    outline: 2px solid #c98a5a;
    outline-offset: 3px;
  }

  &:active {
    transform: scale(0.98);
  }
}

.btn__label {
  position: relative;
  z-index: 1;
}

.btn--md {
  padding: 0.7rem 1.4rem;
  font-size: 0.95rem;
  min-height: 44px;
}

.btn--lg {
  padding: 0.95rem 1.9rem;
  font-size: 1.05rem;
  min-height: 52px;
}

.btn--primary {
  /* Gold-as-material: gradient fill, not flat amber */
  background: linear-gradient(135deg, #e8c96b 0%, #c9a84c 45%, #9e7d35 100%);
  color: rgb(var(--tw-canvas));
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 0 32px rgba(201, 168, 76, 0.35),
    0 4px 16px rgba(201, 168, 76, 0.15);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -60%;
    width: 40%;
    height: 100%;
    background: linear-gradient(115deg, transparent, rgba(255, 255, 255, 0.35), transparent);
    transform: skewX(-20deg);
    pointer-events: none;
  }

  &:hover {
    background: linear-gradient(135deg, #f0d47e 0%, #d9b85a 45%, #b08a3f 100%);
    box-shadow:
      0 0 48px rgba(201, 168, 76, 0.5),
      0 8px 24px rgba(201, 168, 76, 0.25);

    &::before {
      transition: transform 0.6s ease-out;
      transform: translateX(260%) skewX(-20deg);
    }
  }
}

.btn--ghost {
  background-color: transparent;
  color: rgb(var(--tw-ink-primary));
  border-color: #2a2119;

  &:hover {
    background-color: rgb(var(--tw-surface-1));
    border-color: #6b5e51;
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn,
  .btn:hover,
  .btn:active {
    transform: none;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .btn--primary::before {
    display: none;
  }
}
</style>
