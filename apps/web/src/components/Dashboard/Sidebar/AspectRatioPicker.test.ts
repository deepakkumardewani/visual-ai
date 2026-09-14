import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AspectRatioPicker from '@/components/Dashboard/Sidebar/AspectRatioPicker.vue';
import { ASPECT_RATIOS } from '@/utils/constants';

describe('AspectRatioPicker', () => {
  it('renders primary ratios and highlights the selected value', () => {
    const wrapper = mount(AspectRatioPicker, {
      props: { options: ASPECT_RATIOS, modelValue: ASPECT_RATIOS[0] },
      global: { stubs: { ChevronCaret: true } },
    });

    expect(wrapper.get('[data-testid="aspect-ratio-picker"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="aspect-1:1"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('[data-testid="aspect-more-trigger"]').text()).toContain('More sizes');
  });

  it('emits update:modelValue when a primary ratio is clicked', async () => {
    const wrapper = mount(AspectRatioPicker, {
      props: { options: ASPECT_RATIOS, modelValue: ASPECT_RATIOS[0] },
      global: { stubs: { ChevronCaret: true } },
    });

    await wrapper.get('[data-testid="aspect-2:3"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      expect.objectContaining({ title: '2:3' }),
    ]);
  });

  it('expands extra sizes and selects one', async () => {
    const wrapper = mount(AspectRatioPicker, {
      props: { options: ASPECT_RATIOS, modelValue: ASPECT_RATIOS[0] },
      global: { stubs: { ChevronCaret: true } },
    });

    expect(wrapper.get('[data-testid="aspect-more-trigger"]').attributes('aria-expanded')).toBe(
      'false',
    );
    await wrapper.get('[data-testid="aspect-more-trigger"]').trigger('click');
    expect(wrapper.get('[data-testid="aspect-more-trigger"]').attributes('aria-expanded')).toBe(
      'true',
    );

    await wrapper.get('[data-testid="aspect-more-9:16"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(
      expect.objectContaining({ title: '9:16' }),
    );
  });

  it('hides the extra-size trigger when every option fits the primary row', () => {
    const wrapper = mount(AspectRatioPicker, {
      props: { options: ASPECT_RATIOS.slice(0, 3), modelValue: ASPECT_RATIOS[0] },
      global: { stubs: { ChevronCaret: true } },
    });

    expect(wrapper.find('[data-testid="aspect-more-trigger"]').exists()).toBe(false);
    expect(wrapper.get('[aria-label="Aspect ratio"]').classes().join(' ')).toContain(
      'tw-grid-cols-3',
    );
  });

  it('uses a two-column grid for two primary options', () => {
    const wrapper = mount(AspectRatioPicker, {
      props: { options: ASPECT_RATIOS.slice(0, 2), modelValue: ASPECT_RATIOS[0] },
      global: { stubs: { ChevronCaret: true } },
    });
    expect(wrapper.get('[aria-label="Aspect ratio"]').classes().join(' ')).toContain(
      'tw-grid-cols-2',
    );
  });

  it('uses a single column when only one ratio is available', () => {
    const wrapper = mount(AspectRatioPicker, {
      props: { options: [ASPECT_RATIOS[0]], modelValue: ASPECT_RATIOS[0] },
      global: { stubs: { ChevronCaret: true } },
    });
    expect(wrapper.get('[aria-label="Aspect ratio"]').classes().join(' ')).toContain(
      'tw-grid-cols-1',
    );
  });

  it('shows the selected extra ratio on the trigger and collapses when a primary is picked', async () => {
    const extra = ASPECT_RATIOS.find((ratio) => ratio.title === '9:16')!;
    const wrapper = mount(AspectRatioPicker, {
      props: { options: ASPECT_RATIOS, modelValue: extra },
      global: { stubs: { ChevronCaret: true } },
    });

    expect(wrapper.get('[data-testid="aspect-more-trigger"]').text()).toContain('9:16');
    expect(wrapper.get('[data-testid="aspect-more-trigger"]').text()).not.toContain('More sizes');

    await wrapper.get('[data-testid="aspect-more-trigger"]').trigger('click');
    expect(wrapper.get('[data-testid="aspect-more-trigger"]').attributes('aria-expanded')).toBe(
      'true',
    );

    await wrapper.get('[data-testid="aspect-1:1"]').trigger('click');
    expect(wrapper.get('[data-testid="aspect-more-trigger"]').attributes('aria-expanded')).toBe(
      'false',
    );
  });

  it('renders square preview frames for auto and invalid ratios', () => {
    const auto = ASPECT_RATIOS.find((ratio) => ratio.title === 'auto')!;
    const invalid = { ...ASPECT_RATIOS[0], title: '0:2', name: 'Broken' };
    const wrapper = mount(AspectRatioPicker, {
      props: { options: [auto, invalid], modelValue: auto },
      global: { stubs: { ChevronCaret: true } },
    });

    expect(wrapper.get('[data-testid="aspect-auto"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="aspect-0:2"]').exists()).toBe(true);
  });
});
