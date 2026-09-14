import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FeatureIcon from '@/components/History/FeatureIcon.vue';
import { FeatureType } from '@/types';
import type { IImageObject } from '@/types';

describe('FeatureIcon', () => {
  it('renders the feature type label', () => {
    const wrapper = mount(FeatureIcon, {
      props: {
        item: { featureType: FeatureType.UPSCALE } as IImageObject,
      },
    });

    expect(wrapper.text()).toContain('upscale');
  });
});
