import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

const signedIn = vi.hoisted(() => ({ value: false }));
const reducedMotion = vi.hoisted(() => ({ value: true }));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ isSignedIn: signedIn.value }),
}));

import LandingHero from '@/components/Landing/LandingHero.vue';

import { scrollToSection } from '@/composables/useLenis';

vi.mock('@/composables/useLenis', () => ({
  scrollToSection: vi.fn(),
}));

vi.mock('@/composables/useReducedMotion', () => ({
  useReducedMotion: () => reducedMotion,
}));

vi.mock('gsap', () => ({
  gsap: { context: vi.fn(() => ({ revert: vi.fn() })), timeline: vi.fn(), to: vi.fn() },
}));

describe('LandingHero', () => {
  it('renders the studio headline', () => {
    const wrapper = mount(LandingHero, {
      global: {
        stubs: { LandingButton: { template: '<a><slot /></a>' } },
      },
    });

    expect(wrapper.text()).toContain('One');
    expect(wrapper.text()).toContain('studio');
    expect(wrapper.text()).toContain('Start free');
  });

  it('links signed-in visitors to the studio and scrolls to the showcase', async () => {
    signedIn.value = true;
    const wrapper = mount(LandingHero, {
      global: {
        stubs: {
          LandingButton: {
            props: ['to', 'href'],
            template:
              '<button type="button" @click="$event.preventDefault(); $emit(\'click\', $event)"><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Open studio');
    await wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('See the work'))!
      .trigger('click');
    expect(scrollToSection).toHaveBeenCalledWith('#showcase');
    signedIn.value = false;
  });

  it('plays the entrance timeline when motion is allowed', () => {
    reducedMotion.value = false;
    const wrapper = mount(LandingHero, {
      global: {
        stubs: { LandingButton: { template: '<a><slot /></a>' } },
      },
    });
    expect(wrapper.exists()).toBe(true);
    wrapper.unmount();
    reducedMotion.value = true;
  });
});
