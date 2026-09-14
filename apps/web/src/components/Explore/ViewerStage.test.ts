import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ViewerStage from '@/components/Explore/ViewerStage.vue';

describe('ViewerStage', () => {
  it('renders the main image and emits next/prev', async () => {
    const wrapper = mount(ViewerStage, {
      props: {
        imageUrl: 'https://cdn.example.com/shot.jpg',
        alt: 'A mountain lake',
        canPrev: true,
        canNext: true,
      },
      global: {
        stubs: { SideBySide: true },
      },
    });

    expect(wrapper.find('[data-testid="explore-viewer-stage"]').exists()).toBe(true);
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    await buttons[0].trigger('click');
    expect(wrapper.emitted('prev') || wrapper.emitted('next')).toBeTruthy();
  });

  it('shows comparison when original and result urls are set', () => {
    const wrapper = mount(ViewerStage, {
      props: {
        imageUrl: 'https://cdn.example.com/shot.jpg',
        alt: 'Result',
        canPrev: false,
        canNext: false,
        originalUrl: 'https://cdn.example.com/before.jpg',
        resultUrl: 'https://cdn.example.com/after.jpg',
      },
      global: {
        stubs: { SideBySide: { template: '<div class="compare-stub" />' } },
      },
    });

    expect(wrapper.find('.compare-stub').exists()).toBe(true);
  });
});
