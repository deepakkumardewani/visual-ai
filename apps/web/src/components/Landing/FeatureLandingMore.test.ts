import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FeatureLandingMore from '@/components/Landing/FeatureLandingMore.vue';
import { FeatureType } from '@/types';
import type { FeatureLandingCopy } from '@/utils/featureLandings';

const page = (path: string, navLabel: string): FeatureLandingCopy => ({
  path,
  feature: FeatureType.IMAGE,
  createPath: path,
  keyword: navLabel,
  navLabel,
  title: navLabel,
  description: navLabel,
  h1: navLabel,
  definition: navLabel,
  howHeading: 'How',
  steps: [],
  ctaLabel: 'Open',
  faqs: [],
});

describe('FeatureLandingMore', () => {
  it('lists related studio tools', () => {
    const wrapper = mount(FeatureLandingMore, {
      props: {
        pages: [page('/image-upscaler', 'Upscale'), page('/colorize-photo', 'Colorize')],
      },
      global: {
        stubs: {
          RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Also in the studio');
    expect(wrapper.text()).toContain('Upscale');
    expect(wrapper.text()).toContain('Colorize');
  });
});
