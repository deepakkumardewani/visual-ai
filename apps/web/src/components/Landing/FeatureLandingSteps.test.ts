import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FeatureLandingSteps from '@/components/Landing/FeatureLandingSteps.vue';

describe('FeatureLandingSteps', () => {
  it('renders the heading and each step', () => {
    const wrapper = mount(FeatureLandingSteps, {
      props: {
        heading: 'How it works',
        headingId: 'how-image',
        steps: ['Write a prompt', 'Pick a model', 'Generate'],
      },
    });

    expect(wrapper.text()).toContain('How it works');
    expect(wrapper.text()).toContain('Write a prompt');
    expect(wrapper.text()).toContain('Generate');
  });
});
