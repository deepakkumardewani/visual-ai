<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
}>();
</script>

<!-- Stand-in for a scene still being built; keeps anchors and scroll length real. -->
<template>
  <section :id="id" class="placeholder lv2-section" :aria-label="label">
    <p class="lv2-eyebrow placeholder__label">{{ label }} (placeholder)</p>
  </section>
</template>

<style scoped lang="scss">
.placeholder {
  display: grid;
  place-items: center;
  min-height: 100svh;
  border-top: 1px solid rgb(var(--tw-hairline));
}

.placeholder__label {
  color: rgb(var(--tw-ink-faint));
}
</style>
