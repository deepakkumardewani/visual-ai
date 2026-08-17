<script setup lang="ts">
import { ImgComparisonSlider } from '@img-comparison-slider/vue';
import { nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Fill parent box and crop with object-fit: cover (for equal card frames). */
  fill?: boolean;
}>();

const firstLoaded = ref(false);
const secondLoaded = ref(false);
const firstImg = ref<HTMLImageElement | null>(null);
const secondImg = ref<HTMLImageElement | null>(null);
const sliderRef = ref<InstanceType<typeof ImgComparisonSlider> | null>(null);

const FILL_SHADOW_CSS = `
  :host {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    position: absolute !important;
    inset: 0 !important;
  }
  .first,
  .second,
  .first-overlay,
  .first-overlay-container {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-height: none !important;
  }
  .second {
    overflow: hidden !important;
  }
  ::slotted(img) {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    object-fit: cover !important;
    object-position: center !important;
  }
`;

function applyFillStyles() {
  if (!props.fill) return;
  const host = sliderRef.value?.$el as HTMLElement | undefined;
  const shadow = host?.shadowRoot;
  if (!shadow) return;

  let styleEl = shadow.getElementById('ba-fill-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ba-fill-styles';
    shadow.appendChild(styleEl);
  }
  styleEl.textContent = FILL_SHADOW_CSS;
}

onMounted(async () => {
  if (firstImg.value?.complete) firstLoaded.value = true;
  if (secondImg.value?.complete) secondLoaded.value = true;
  await nextTick();
  applyFillStyles();
  // Component may upgrade shadow after first paint
  requestAnimationFrame(applyFillStyles);
});

watch(
  () => props.fill,
  async () => {
    await nextTick();
    applyFillStyles();
  },
);
</script>

<template>
  <figure class="ba" :class="{ 'ba--fill': fill }">
    <ImgComparisonSlider ref="sliderRef" class="ba__slider" value="45" hover="hover">
      <img
        ref="firstImg"
        slot="first"
        class="ba__img"
        :src="before"
        alt="Original image, before processing"
        loading="lazy"
        decoding="async"
        @load="firstLoaded = true"
        @error="firstLoaded = true"
      />
      <img
        ref="secondImg"
        slot="second"
        class="ba__img"
        :src="after"
        alt="Result, after processing with Visual AI"
        loading="lazy"
        decoding="async"
        @load="secondLoaded = true"
        @error="secondLoaded = true"
      />
    </ImgComparisonSlider>

    <transition name="ba-fade">
      <div v-if="!(firstLoaded && secondLoaded)" class="ba__skeleton"></div>
    </transition>

    <figcaption class="ba__tag ba__tag--before">{{ beforeLabel ?? 'Before' }}</figcaption>
    <figcaption class="ba__tag ba__tag--after">{{ afterLabel ?? 'After' }}</figcaption>
  </figure>
</template>

<style scoped lang="scss">
.ba {
  position: relative;
  margin: 0;
  border-radius: 20px;
  overflow: hidden;
  background: #221a14;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.55);
  border: 1px solid #3a2e22;
}

.ba--fill {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  border: none;
  box-shadow: none;
}

.ba__slider {
  --divider-width: 2px;
  --divider-color: #c98a5a;
  --default-handle-color: #c98a5a;
  --default-handle-width: 48px;
  --default-handle-opacity: 1;
  display: block;
  width: 100%;
}

.ba--fill .ba__slider {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.ba__img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.ba--fill .ba__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.ba__skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, #221a14 30%, #2d2319 50%, #221a14 70%);
  background-size: 200% 100%;
  animation: ba-shimmer 1.4s ease-in-out infinite;
}

.ba__tag {
  position: absolute;
  top: 1rem;
  z-index: 2;
  padding: 0.3rem 0.7rem;
  font-family: 'Source Sans 3', system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--tw-ink-primary));
  background: rgba(24, 18, 14, 0.66);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(240, 232, 220, 0.14);
  border-radius: 9999px;
  pointer-events: none;

  &--before {
    left: 1rem;
  }
  &--after {
    right: 1rem;
    color: #18120e;
    background: rgba(201, 138, 90, 0.92);
    border-color: transparent;
  }
}

.ba-fade-leave-active {
  transition: opacity 0.4s ease;
}
.ba-fade-leave-to {
  opacity: 0;
}

@keyframes ba-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ba__skeleton {
    animation: none;
  }
}
</style>
