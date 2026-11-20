import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import ProPerksDialog from '@/components/Dialogs/ProPerksDialog.vue';
import { useDialogStore } from '@/stores/dialog';
import { PRO_PERKS } from '@/utils/proPerks';

const stubs = {
  AppModal: {
    props: ['open'],
    emits: ['close'],
    template:
      '<div v-if="open" data-testid="app-modal"><button data-testid="modal-close" @click="$emit(\'close\')" /><slot /></div>',
  },
  'font-awesome-icon': true,
};

describe('ProPerksDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render when closed', () => {
    const wrapper = mount(ProPerksDialog, { global: { stubs } });
    expect(wrapper.find('[data-testid="pro-perks-dialog"]').exists()).toBe(false);
  });

  it('lists every Pro perk once the dialog is open', () => {
    useDialogStore().showProPerks();
    const wrapper = mount(ProPerksDialog, { global: { stubs } });
    const items = wrapper.findAll('li').map((li) => li.text());
    expect(PRO_PERKS.length).toBe(4);
    expect(items).toEqual([...PRO_PERKS]);
    expect(items).toContain('Priority queue: your jobs start first');
    expect(items).toContain('Your generations stay private, hidden from Explore');
    expect(wrapper.get('#pro-perks-title').text()).toBe('Your Pro perks');
  });

  it('offers no purchase action', () => {
    useDialogStore().showProPerks();
    const wrapper = mount(ProPerksDialog, { global: { stubs } });
    const content = wrapper.get('[data-testid="pro-perks-dialog"]');
    const labels = content.findAll('button').map((b) => b.attributes('aria-label'));
    expect(labels).toEqual(['Close dialog']);
    expect(wrapper.text()).not.toMatch(/upgrade|subscribe|buy|purchase/i);
  });

  it('closes from the close button', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showProPerks();
    const wrapper = mount(ProPerksDialog, { global: { stubs } });
    await wrapper.get('[aria-label="Close dialog"]').trigger('click');
    expect(dialogStore.showProPerksDialog).toBe(false);
  });

  it('closes when the modal emits close', async () => {
    const dialogStore = useDialogStore();
    dialogStore.showProPerks();
    const wrapper = mount(ProPerksDialog, { global: { stubs } });
    await wrapper.get('[data-testid="modal-close"]').trigger('click');
    expect(dialogStore.showProPerksDialog).toBe(false);
  });
});
