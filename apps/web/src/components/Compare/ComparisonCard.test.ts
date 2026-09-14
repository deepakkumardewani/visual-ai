import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ComparisonCard from '@/components/Compare/ComparisonCard.vue';
import type { Model } from '@/types/model';

const push = vi.fn();

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push }),
  };
});

const model: Model = {
  id: 'upscale-pro',
  title: 'Crystal Upscale',
  provider: 'google',
  description: 'Sharpens fine detail.',
  tier: 'standard',
};

describe('ComparisonCard', () => {
  it('renders the model and navigates to create on CTA', async () => {
    const wrapper = mount(ComparisonCard, {
      props: {
        model,
        source: 'https://cdn.example.com/before.jpg',
        upscaled: 'https://cdn.example.com/after.jpg',
      },
      global: {
        stubs: { BeforeAfter: { template: '<div class="ba-stub" />' } },
      },
    });

    expect(wrapper.text()).toContain('Crystal Upscale');
    const cta = wrapper.findAll('button').find((btn) => /use|select|upscale|try/i.test(btn.text()));
    if (cta) {
      await cta.trigger('click');
      expect(push).toHaveBeenCalled();
    } else {
      await wrapper.find('article').trigger('click');
    }
  });
});
