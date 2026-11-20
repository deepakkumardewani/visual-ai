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
  PricingLayout: {
    template: '<div data-testid="pricing-layout"><div data-testid="faq" /></div>',
  },
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
    expect(wrapper.find('[data-testid="pricing-layout"]').exists()).toBe(true);
  });

  it('closes from the toolbar button', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showPricing();
    const wrapper = mount(PricingDialog, { global: { stubs } });
    await wrapper.get('[aria-label="Close pricing"]').trigger('click');
    expect(dialogStore.showPricingDialog).toBe(false);
  });

  it('has no footer and ends with the layout, whose FAQ is last', () => {
    useDialogStore().showPricing();
    const wrapper = mount(PricingDialog, { global: { stubs } });
    const modal = wrapper.get('[data-testid="app-modal"]');
    expect(wrapper.find('footer').exists()).toBe(false);
    expect(modal.element.querySelector('footer, [data-testid="site-footer"]')).toBeNull();
    expect(wrapper.get('.pricing-dialog').element.lastElementChild).toBe(
      wrapper.get('[data-testid="pricing-layout"]').element,
    );
    expect(wrapper.get('[data-testid="pricing-layout"]').element.lastElementChild).toBe(
      wrapper.get('[data-testid="faq"]').element,
    );
  });
});
