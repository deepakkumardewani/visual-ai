import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SideBySide from '@/components/SideBySide.vue';

const sliderStub = {
  template: '<div class="slider-stub"><slot /></div>',
};

async function fireLoads(wrapper: ReturnType<typeof mount>, width = 800, height = 400) {
  const before = wrapper.get('img[alt="Before"]');
  Object.defineProperty(before.element, 'naturalWidth', { value: width });
  Object.defineProperty(before.element, 'naturalHeight', { value: height });
  await before.trigger('load');
  await wrapper.get('img[alt="After"]').trigger('load');
}

describe('SideBySide', () => {
  it('renders original and enhanced image sources', () => {
    const wrapper = mount(SideBySide, {
      props: {
        originalImage: 'https://cdn.example.com/before.jpg',
        enhancedImage: 'https://cdn.example.com/after.jpg',
      },
      global: {
        stubs: { ImgComparisonSlider: sliderStub },
      },
    });

    const imgs = wrapper.findAll('img');
    expect(imgs.some((img) => img.attributes('src')?.includes('before.jpg'))).toBe(true);
    expect(imgs.some((img) => img.attributes('src')?.includes('after.jpg'))).toBe(true);
  });

  it('marks the compare frame ready after both images load', async () => {
    const wrapper = mount(SideBySide, {
      props: {
        originalImage: 'https://cdn.example.com/before.jpg',
        enhancedImage: 'https://cdn.example.com/after.jpg',
        transparent: true,
      },
      global: { stubs: { ImgComparisonSlider: sliderStub } },
    });

    expect(wrapper.get('[data-testid="side-by-side-compare"]').classes()).toContain(
      'compare--transparent',
    );
    await fireLoads(wrapper);
    expect(wrapper.get('[data-testid="side-by-side-compare"]').classes()).toContain(
      'compare--ready',
    );
    expect(wrapper.text()).toContain('Before');
    expect(wrapper.text()).toContain('After');
  });

  it('resets readiness when the compared images change', async () => {
    const wrapper = mount(SideBySide, {
      props: {
        originalImage: 'https://cdn.example.com/before.jpg',
        enhancedImage: 'https://cdn.example.com/after.jpg',
      },
      global: { stubs: { ImgComparisonSlider: sliderStub } },
    });

    await fireLoads(wrapper);
    expect(wrapper.get('[data-testid="side-by-side-compare"]').classes()).toContain(
      'compare--ready',
    );

    await wrapper.setProps({ originalImage: 'https://cdn.example.com/before-2.jpg' });
    expect(wrapper.get('[data-testid="side-by-side-compare"]').classes()).not.toContain(
      'compare--ready',
    );
  });

  it('sizes the frame from a measured host box', async () => {
    const wrapper = mount(SideBySide, {
      attachTo: document.body,
      props: {
        originalImage: 'https://cdn.example.com/before.jpg',
        enhancedImage: 'https://cdn.example.com/after.jpg',
      },
      global: { stubs: { ImgComparisonSlider: sliderStub } },
    });

    const host = wrapper.get('[data-testid="side-by-side-compare"]');
    Object.defineProperty(host.element, 'clientWidth', { value: 400 });
    Object.defineProperty(host.element, 'clientHeight', { value: 300 });
    await fireLoads(wrapper, 800, 400);
    expect(host.find('.compare__frame').attributes('style') || '').toMatch(/width|aspect-ratio/i);
    wrapper.unmount();
  });
});
