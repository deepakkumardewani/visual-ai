import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import HistoryFullNote from '@/components/Dashboard/Canvas/HistoryFullNote.vue';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';
import type { IImageObject } from '@/types';
import { PLAN } from '@visual-ai/shared';

const NOTE = '[data-testid="history-full-note"]';
const UPGRADE = '[data-testid="history-full-upgrade"]';

function seed(count: number, plan: typeof PLAN.FREE | typeof PLAN.PRO = PLAN.FREE, ready = true) {
  const user = useUserStore();
  user.plan = plan;
  user.isReady = ready;
  user.history = Array.from({ length: count }, (_, i) => ({ _id: String(i) }) as IImageObject);
}

describe('HistoryFullNote', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows nothing under 90% of the cap', () => {
    seed(89);
    expect(mount(HistoryFullNote).find(NOTE).exists()).toBe(false);
  });

  it('shows nothing while the count is unknown, even with a full history', () => {
    seed(100, PLAN.FREE, false);
    expect(mount(HistoryFullNote).find(NOTE).exists()).toBe(false);
  });

  it('shows the near-full wording with the count at 90 of 100', () => {
    seed(90);
    const note = mount(HistoryFullNote).get(NOTE);
    expect(note.attributes('data-level')).toBe('near');
    expect(note.text()).toContain(
      'History almost full (90/100). Delete old images to keep saving new ones.',
    );
  });

  it('shows the full wording at the cap', () => {
    seed(100);
    const note = mount(HistoryFullNote).get(NOTE);
    expect(note.attributes('data-level')).toBe('full');
    expect(note.text()).toContain(
      "History full - new creations won't be saved. Delete old images to make room.",
    );
  });

  it('evaluates a downgraded user over the cap as full', () => {
    seed(250);
    expect(mount(HistoryFullNote).get(NOTE).attributes('data-level')).toBe('full');
  });

  it('uses the Pro cap for a Pro user', () => {
    seed(100, PLAN.PRO);
    expect(mount(HistoryFullNote).find(NOTE).exists()).toBe(false);
    seed(450, PLAN.PRO);
    const wrapper = mount(HistoryFullNote);
    expect(wrapper.get(NOTE).text()).toContain('(450/500)');
  });

  it('counts only saved entries in the near-full message', () => {
    seed(90);
    useUserStore().history.unshift({} as IImageObject);
    expect(mount(HistoryFullNote).get(NOTE).text()).toContain('(90/100)');
  });

  it('offers an Upgrade link to free users that opens pricing', async () => {
    seed(100);
    const wrapper = mount(HistoryFullNote);
    await wrapper.get(UPGRADE).trigger('click');
    expect(useDialogStore().showPricingDialog).toBe(true);
  });

  it('offers no Upgrade link to Pro users', () => {
    seed(500, PLAN.PRO);
    const wrapper = mount(HistoryFullNote);
    expect(wrapper.get(NOTE).attributes('data-level')).toBe('full');
    expect(wrapper.find(UPGRADE).exists()).toBe(false);
  });
});
