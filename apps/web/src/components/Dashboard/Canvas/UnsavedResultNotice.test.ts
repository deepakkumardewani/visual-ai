import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UnsavedResultNotice from '@/components/Dashboard/Canvas/UnsavedResultNotice.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';
import type { IImageObject } from '@/types';
import { downloadItemImage } from '@/utils/helpers';
import { HISTORY_CAP, PLAN } from '@visual-ai/shared';

vi.mock('@/utils/helpers', () => ({ downloadItemImage: vi.fn() }));

const result = { images: ['https://replicate.example/out.png'] } as unknown as IImageObject;
const mountNotice = () => mount(UnsavedResultNotice, { props: { result } });

describe('UnsavedResultNotice', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(downloadItemImage).mockReset();
    document.body.innerHTML = '';
  });

  it('warns the result is not saved and expires', () => {
    expect(mountNotice().text()).toContain('Not saved to history');
  });

  it('shows the upgrade CTA with the Pro history cap for a free user', () => {
    const wrapper = mountNotice();
    expect(wrapper.get('[data-testid="unsaved-upgrade"]').text()).toContain(
      `${HISTORY_CAP[PLAN.PRO]} history`,
    );
    expect(wrapper.find('[data-testid="unsaved-free-space"]').exists()).toBe(false);
  });

  it('opens the pricing dialog when a free user clicks upgrade', async () => {
    const wrapper = mountNotice();
    await wrapper.get('[data-testid="unsaved-upgrade"]').trigger('click');
    expect(useDialogStore().showPricingDialog).toBe(true);
  });

  it('shows the free-space CTA instead of upgrade for a Pro user', () => {
    useUserStore().plan = PLAN.PRO;
    const wrapper = mountNotice();
    expect(wrapper.find('[data-testid="unsaved-free-space"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="unsaved-upgrade"]').exists()).toBe(false);
  });

  it('scrolls the history grid into view for a Pro user', async () => {
    useUserStore().plan = PLAN.PRO;
    const grid = document.createElement('div');
    grid.dataset.testid = 'user-generations-grid';
    const scrollIntoView = vi.fn();
    grid.scrollIntoView = scrollIntoView;
    document.body.appendChild(grid);

    await mountNotice().get('[data-testid="unsaved-free-space"]').trigger('click');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('leaves the notice in place and emits nothing when the history grid is absent', async () => {
    useUserStore().plan = PLAN.PRO;
    const wrapper = mountNotice();
    await wrapper.get('[data-testid="unsaved-free-space"]').trigger('click');
    expect(wrapper.find('[data-testid="unsaved-result-notice"]').exists()).toBe(true);
    expect(wrapper.emitted('dismiss')).toBeUndefined();
    expect(useDialogStore().showPricingDialog).toBe(false);
  });

  it('downloads the result image', async () => {
    await mountNotice().get('[data-testid="unsaved-download"]').trigger('click');
    expect(downloadItemImage).toHaveBeenCalledWith(expect.any(Event), result, 0);
  });

  it('emits dismiss', async () => {
    const wrapper = mountNotice();
    await wrapper.get('[data-testid="unsaved-dismiss"]').trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });
});
