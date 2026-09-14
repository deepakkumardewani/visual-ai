import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isSignedIn = ref(false);

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    get isSignedIn() {
      return isSignedIn.value;
    },
  }),
}));

import FinalCta from '@/components/Landing/FinalCta.vue';

describe('FinalCta', () => {
  it('shows Start free when signed out', () => {
    isSignedIn.value = false;
    const wrapper = mount(FinalCta, {
      global: {
        stubs: {
          LandingButton: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
      },
    });
    expect(wrapper.text()).toContain('Your next image is one prompt away.');
    expect(wrapper.text()).toContain('Start free');
    expect(wrapper.text()).toContain('See pricing');
  });

  it('shows Open studio when signed in', () => {
    isSignedIn.value = true;
    const wrapper = mount(FinalCta, {
      global: {
        stubs: {
          LandingButton: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
      },
    });
    expect(wrapper.text()).toContain('Open studio');
  });
});
