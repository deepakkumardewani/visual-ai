import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BeforeAfter from '@/components/Landing/BeforeAfter.vue';

const sliderStub = {
  template: '<div class="slider"><slot /></div>',
};

describe('BeforeAfter', () => {
  it('renders before and after images', () => {
    const wrapper = mount(BeforeAfter, {
      props: {
        before: 'https://cdn.example.com/before.jpg',
        after: 'https://cdn.example.com/after.jpg',
      },
      global: {
        stubs: { ImgComparisonSlider: sliderStub },
      },
    });

    const srcs = wrapper.findAll('img').map((img) => img.attributes('src'));
    expect(srcs).toContain('https://cdn.example.com/before.jpg');
    expect(srcs).toContain('https://cdn.example.com/after.jpg');
  });

  it('uses custom labels and a fill frame', () => {
    const wrapper = mount(BeforeAfter, {
      props: {
        before: 'https://cdn.example.com/before.jpg',
        after: 'https://cdn.example.com/after.jpg',
        beforeLabel: 'Original',
        afterLabel: 'Restored',
        fill: true,
      },
      global: { stubs: { ImgComparisonSlider: sliderStub } },
    });

    expect(wrapper.get('figure').classes()).toContain('ba--fill');
    expect(wrapper.text()).toContain('Original');
    expect(wrapper.text()).toContain('Restored');
  });

  it('hides the skeleton after load or error', async () => {
    const wrapper = mount(BeforeAfter, {
      props: {
        before: 'https://cdn.example.com/before.jpg',
        after: 'https://cdn.example.com/after.jpg',
      },
      global: { stubs: { ImgComparisonSlider: sliderStub } },
    });

    expect(wrapper.find('.ba__skeleton').exists()).toBe(true);
    await wrapper.get('img[alt="Original image, before processing"]').trigger('load');
    await wrapper.get('img[alt="Result, after processing with Visual AI"]').trigger('error');
    expect(wrapper.find('.ba__skeleton').exists()).toBe(false);
  });

  it('skips fill styles without a shadow root and reapplies when fill turns on', async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    const wrapper = mount(BeforeAfter, {
      props: {
        before: 'https://cdn.example.com/before.jpg',
        after: 'https://cdn.example.com/after.jpg',
        fill: false,
      },
      global: { stubs: { ImgComparisonSlider: sliderStub } },
    });

    expect(wrapper.get('figure').classes()).not.toContain('ba--fill');
    await wrapper.setProps({ fill: true });
    expect(wrapper.get('figure').classes()).toContain('ba--fill');
    vi.unstubAllGlobals();
  });
});
