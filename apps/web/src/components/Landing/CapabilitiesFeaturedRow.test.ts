import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CapabilitiesFeaturedRow from '@/components/Landing/CapabilitiesFeaturedRow.vue';
import type { Model } from '@/types/model';

const models = [
  {
    id: 'flux',
    title: 'Flux',
    description: 'Fast photoreal images',
    creditCost: 2,
    bestAt: 'Portraits',
    companyName: 'Black Forest',
    provider: 'replicate',
    tier: 'standard',
  },
  {
    id: 'sd',
    title: 'Stable Diffusion',
    description: 'Open weights',
    provider: 'replicate',
    tier: 'standard',
  },
] as Model[];

describe('CapabilitiesFeaturedRow', () => {
  function mountRow(list = models) {
    return mount(CapabilitiesFeaturedRow, {
      props: { models: list },
      global: {
        directives: { reveal: () => undefined },
        stubs: {
          CreditCostBadge: {
            props: ['cost'],
            template: '<span class="cost-badge">{{ cost }}</span>',
          },
        },
      },
    });
  }

  it('renders featured capability cards', () => {
    const wrapper = mountRow();
    expect(wrapper.text()).toContain('Flux');
    expect(wrapper.text()).toContain('Stable Diffusion');
    expect(wrapper.find('.cost-badge').text()).toBe('2');
    expect(wrapper.text()).toContain('Portraits');
    expect(wrapper.text()).toContain('Black Forest');
  });

  it('omits cost, best-at, and lab when those fields are missing', () => {
    const wrapper = mountRow([models[1]]);
    expect(wrapper.find('.cost-badge').exists()).toBe(false);
    expect(wrapper.find('.featured__meta').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Best at');
  });

  it('shows best-at without a lab chip when companyName is absent', () => {
    const wrapper = mountRow([{ ...models[0], companyName: undefined, creditCost: undefined }]);
    expect(wrapper.find('.featured__meta').exists()).toBe(true);
    expect(wrapper.find('.featured__lab').exists()).toBe(false);
    expect(wrapper.find('.cost-badge').exists()).toBe(false);
  });
});
