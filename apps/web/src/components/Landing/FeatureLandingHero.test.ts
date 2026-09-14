import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FeatureLandingHero from '@/components/Landing/FeatureLandingHero.vue';
import type { FeatureLandingCopy } from '@/utils/featureLandings';
import { FeatureType } from '@/types';

const landing: FeatureLandingCopy = {
  path: '/text-to-image',
  feature: FeatureType.IMAGE,
  createPath: '/create/image',
  keyword: 'Text to image',
  navLabel: 'Generate',
  title: 'Text to image',
  description: 'Generate images from a prompt.',
  h1: 'Turn words into images',
  definition: 'Describe a scene and Visual AI generates a still.',
  howHeading: 'How it works',
  steps: ['Write a prompt', 'Pick a model', 'Generate'],
  ctaLabel: 'Open generator',
  faqs: [],
};

describe('FeatureLandingHero', () => {
  it('renders the h1 and CTAs', () => {
    const wrapper = mount(FeatureLandingHero, {
      props: { landing, tool: undefined },
      global: {
        stubs: {
          LandingButton: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          LandingToolMedia: true,
          RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Turn words into images');
    expect(wrapper.text()).toContain('Open generator');
    expect(wrapper.text()).toContain('See credit packs');
  });
});
