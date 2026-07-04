<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

import { scrollToSection } from '@/composables/useLenis';

import LandingButton from '@/components/Landing/LandingButton.vue';
import ThemeButton from '@/components/Header/ThemeButton.vue';

import { NAV_LINKS } from '@/utils/landing';

const { y } = useWindowScroll();
const scrolled = computed(() => y.value > 24);
const menuOpen = ref(false);
const auth = useAuthStore();
const showScrollTop = computed(() => y.value > 400);

function go(href: string) {
  menuOpen.value = false;
  scrollToSection(href);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <ThemeButton class="nav__theme-btn" />
        <LandingButton :to="auth.isSignedIn ? '/dashboard' : '/signup'">
          {{ auth.isSignedIn ? 'Open Dashboard' : 'Start free' }}
        </LandingButton>
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
          <ThemeButton class="nav__sheet-theme-btn" />
          <LandingButton
            :to="auth.isSignedIn ? '/dashboard' : '/signup'"
            size="lg"
            class="nav__sheet-cta"
          >
            {{ auth.isSignedIn ? 'Open Dashboard' : 'Start free' }}
          </LandingButton>
        </div>
      </div>
    </transition>

    <Teleport to="body">
      <Transition name="scroll-top-fade">
        <button
          v-if="showScrollTop"
          class="scroll-top-btn"
          aria-label="Scroll to top"
          @click="scrollToTop"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10 17V3" />
            <path d="M3 10l7-7 7 7" />
          </svg>
        </button>
      </Transition>
    </Teleport>
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
    backdrop-filter 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.35), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &--solid {
    background: rgb(var(--tw-canvas) / 0.72);
    backdrop-filter: blur(14px);

    &::after {
      opacity: 1;
    }

    .nav__inner {
      padding-top: 0.7rem;
      padding-bottom: 0.7rem;
    }
  }
}

.nav__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: padding 0.3s ease;
}

.nav__brand {
  font-family: 'Young Serif', Georgia, serif;
  font-size: 1.4rem;
  color: rgb(var(--tw-ink-primary));
  text-decoration: none;
  letter-spacing: -0.01em;
  margin-right: auto;
  transition: color 0.2s ease;

  &:hover {
    color: rgb(var(--tw-ink-primary));
  }
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
  color: rgb(var(--tw-ink-muted));
  text-decoration: none;
  position: relative;
  transition: color 0.2s ease;

  &::after {
    content: '';
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
    color: rgb(var(--tw-ink-primary));
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
    content: '';
    display: block;
    width: 22px;
    height: 2px;
    background: rgb(var(--tw-ink-primary));
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
  background: rgb(var(--tw-canvas) / 0.96);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgb(var(--tw-hairline));
}

.nav__sheet-link {
  padding: 0.85rem 0;
  font-size: 1.1rem;
  color: rgb(var(--tw-ink-primary));
  text-decoration: none;
  border-bottom: 1px solid rgb(var(--tw-hairline));
}

.nav__sheet-actions {
  display: flex;
  margin-top: 1rem;
}

.nav__sheet-cta {
  width: 100%;
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

.nav__theme-btn {
  border-color: rgba(201, 168, 76, 0.25);
  color: rgb(var(--tw-ink-muted));
  background: transparent;
  flex-shrink: 0;
}

.nav__theme-btn:hover {
  border-color: rgba(201, 168, 76, 0.5);
  color: rgb(var(--tw-ink-primary));
}

.nav__sheet-theme-btn {
  border-color: rgba(201, 168, 76, 0.25);
  color: rgb(var(--tw-ink-muted));
  background: transparent;
  flex-shrink: 0;
}

.nav__sheet-theme-btn:hover {
  border-color: rgba(201, 168, 76, 0.5);
  color: rgb(var(--tw-ink-primary));
}

.scroll-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 60;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(201, 168, 76, 0.35);
  background: rgb(var(--tw-canvas) / 0.8);
  color: #c9a84c;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.scroll-top-btn:hover {
  background: rgb(var(--tw-canvas) / 0.95);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(201, 168, 76, 0.15);
}

.scroll-top-fade-enter-active,
.scroll-top-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.scroll-top-fade-enter-from,
.scroll-top-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
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
