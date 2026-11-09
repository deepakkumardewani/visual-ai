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

const result = {
  images: ['https://replicate.example/out.png'],
} as unknown as IImageObject;
const mountNotice = () => mount(UnsavedResultNotice, { props: { result } });

describe('UnsavedResultNotice', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(downloadItemImage).mockReset();
    document.body.innerHTML = '';
  });

  it('explains the image was not saved with the real count and cap for a free user', () => {
    const user = useUserStore();
    user.history = Array.from(
      { length: HISTORY_CAP[PLAN.FREE] },
      (_, i) => ({ _id: String(i) }) as IImageObject,
    );
    expect(mountNotice().text()).toContain(
      `History full (${HISTORY_CAP[PLAN.FREE]}/${HISTORY_CAP[PLAN.FREE]}) - this image wasn't saved. Download it within ~1 hour.`,
    );
  });

  it('does not count an unsaved entry toward the saved count', () => {
    const user = useUserStore();
    user.history = [
      ...Array.from({ length: 99 }, (_, i) => ({ _id: String(i) }) as IImageObject),
      {} as IImageObject,
    ];
    expect(mountNotice().text()).toContain('History full (99/100)');
  });

  it('uses the Pro cap for a Pro user and drops the free-space action', () => {
    const user = useUserStore();
    user.plan = PLAN.PRO;
    user.history = Array.from(
      { length: HISTORY_CAP[PLAN.PRO] },
      (_, i) => ({ _id: String(i) }) as IImageObject,
    );
    const wrapper = mountNotice();
    expect(wrapper.text()).toContain(
      `History full (${HISTORY_CAP[PLAN.PRO]}/${HISTORY_CAP[PLAN.PRO]})`,
    );
    expect(wrapper.text()).not.toContain('Delete images to free space');
  });

  it('shows the upgrade CTA with the Pro history cap for a free user', () => {
    const wrapper = mountNotice();
    expect(wrapper.get('[data-testid="unsaved-upgrade"]').text()).toContain(
      `${HISTORY_CAP[PLAN.PRO]} history`,
    );
  });

  it('opens the pricing dialog when a free user clicks upgrade', async () => {
    const wrapper = mountNotice();
    await wrapper.get('[data-testid="unsaved-upgrade"]').trigger('click');
    expect(useDialogStore().showPricingDialog).toBe(true);
  });

  it('shows no upgrade link for a Pro user', () => {
    useUserStore().plan = PLAN.PRO;
    expect(mountNotice().find('[data-testid="unsaved-upgrade"]').exists()).toBe(false);
  });

  it('labels the icon buttons', () => {
    const wrapper = mountNotice();
    expect(wrapper.get('[data-testid="unsaved-download"]').attributes('aria-label')).toBe(
      'Download image',
    );
    expect(wrapper.get('[data-testid="unsaved-dismiss"]').attributes('aria-label')).toBe('Dismiss');
  });

  it('offers no delete action', () => {
    const wrapper = mountNotice();
    expect(wrapper.findAll('button').map((b) => b.attributes('aria-label'))).toEqual([
      undefined, // the free-plan upgrade link
      'Download image',
      'Dismiss',
    ]);
    expect(wrapper.html().toLowerCase()).not.toContain('delete');
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
