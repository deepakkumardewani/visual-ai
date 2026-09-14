import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import PricingDialog from '@/components/Dialogs/PricingDialog.vue';
import { useDialogStore } from '@/stores/dialog';

const stubs = {
  AppModal: {
    props: ['open'],
    template:
      '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /><slot name="actions" /></div>',
  },
  Pricing: { template: '<div data-testid="pricing-page" />' },
  FAQ: { template: '<div data-testid="pricing-faq" />' },
  'font-awesome-icon': true,
};

describe('PricingDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render when closed', () => {
    const wrapper = mount(PricingDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="app-modal"]').exists()).toBe(false);
  });

  it('renders pricing content when open', () => {
    const dialogStore = useDialogStore();
    dialogStore.showPricing();
    const wrapper = mount(PricingDialog, { global: { stubs } });
    expect(wrapper.text()).toContain('Unlock the full power of Visual AI');
    expect(wrapper.find('[data-testid="pricing-page"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pricing-faq"]').exists()).toBe(true);
  });

  it('closes from the toolbar button', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showPricing();
    const wrapper = mount(PricingDialog, { global: { stubs } });
    await wrapper.get('[aria-label="Close pricing"]').trigger('click');
    expect(dialogStore.showPricingDialog).toBe(false);
  });
});
