<script setup lang="ts">
import { useWindowScroll } from "@vueuse/core";
import { computed, ref } from "vue";

import { scrollToSection } from "@/composables/useLenis";

import LandingButton from "@/components/Landing/LandingButton.vue";

import { NAV_LINKS } from "@/utils/landing";

const { y } = useWindowScroll();
const scrolled = computed(() => y.value > 24);
const menuOpen = ref(false);

function go(href: string) {
  menuOpen.value = false;
  scrollToSection(href);
}
</script>

<template>
  <header class="nav" :class="{ 'nav--solid': scrolled }">
    <div class="nav__inner">
      <router-link to="/" class="nav__brand" aria-label="Visual AI home">
        Visual<span class="nav__brand-accent">AI</span>
      </router-link>

      <nav class="nav__links" aria-label="Primary">
        <a
          v-for="link in NAV_LINKS"
          :key="link.href"
          :href="link.href"
          class="nav__link"
          @click.prevent="go(link.href)"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="nav__actions">
        <router-link to="/signin" class="nav__signin">Sign in</router-link>
        <LandingButton to="/signup">Start free</LandingButton>
      </div>

      <button
        class="nav__burger"
        :aria-expanded="menuOpen"
        aria-label="Toggle menu"
        @click="menuOpen = !menuOpen"
      >
        <span :class="{ 'is-open': menuOpen }"></span>
      </button>
    </div>

    <transition name="sheet">
      <div v-if="menuOpen" class="nav__sheet">
        <a
          v-for="link in NAV_LINKS"
          :key="link.href"
          :href="link.href"
          class="nav__sheet-link"
          @click.prevent="go(link.href)"
        >
          {{ link.label }}
        </a>
        <div class="nav__sheet-actions">
          <router-link to="/signin" class="nav__signin">Sign in</router-link>
          <LandingButton to="/signup" size="lg">Start free</LandingButton>
        </div>
      </div>
    </transition>
  </header>
</template>

<style scoped lang="scss">
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    backdrop-filter 0.3s ease;
  border-bottom: 1px solid transparent;

  &--solid {
    background: rgba(24, 18, 14, 0.72);
    backdrop-filter: blur(14px);
    border-bottom-color: #3a2e22;
  }
}

.nav__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav__brand {
  font-family: "Young Serif", Georgia, serif;
  font-size: 1.4rem;
  color: #f0e8dc;
  text-decoration: none;
  letter-spacing: -0.01em;
  margin-right: auto;
}
.nav__brand-accent {
  color: #c98a5a;
  margin-left: 0.15em;
}

.nav__links {
  display: none;
  gap: 1.75rem;
}

.nav__link {
  font-size: 0.95rem;
  color: #a89888;
  text-decoration: none;
  position: relative;
  transition: color 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -4px;
    width: 100%;
    height: 1px;
    background: #c98a5a;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover {
    color: #f0e8dc;
  }
  &:hover::after {
    transform: scaleX(1);
  }
}

.nav__actions {
  display: none;
  align-items: center;
  gap: 1rem;
}

.nav__signin {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f0e8dc;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #c98a5a;
  }
}

.nav__burger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  cursor: pointer;

  span,
  span::before,
  span::after {
    content: "";
    display: block;
    width: 22px;
    height: 2px;
    background: #f0e8dc;
    transition:
      transform 0.3s ease,
      opacity 0.2s ease;
  }
  span {
    position: relative;
  }
  span::before {
    position: absolute;
    top: -7px;
  }
  span::after {
    position: absolute;
    top: 7px;
  }
  span.is-open {
    background: transparent;
  }
  span.is-open::before {
    transform: translateY(7px) rotate(45deg);
  }
  span.is-open::after {
    transform: translateY(-7px) rotate(-45deg);
  }
}

.nav__sheet {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.5rem 1.75rem;
  background: rgba(24, 18, 14, 0.96);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid #3a2e22;
}

.nav__sheet-link {
  padding: 0.85rem 0;
  font-size: 1.1rem;
  color: #f0e8dc;
  text-decoration: none;
  border-bottom: 1px solid #2d2319;
}

.nav__sheet-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
}

.sheet-enter-active,
.sheet-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (min-width: 900px) {
  .nav__links,
  .nav__actions {
    display: flex;
  }
  .nav__burger {
    display: none;
  }
}
</style>
