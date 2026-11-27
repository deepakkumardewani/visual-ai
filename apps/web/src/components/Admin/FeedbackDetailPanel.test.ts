import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import FeedbackDetailPanel from '@/components/Admin/FeedbackDetailPanel.vue';
import type { AdminFeedbackItem } from '@/types/feedback';

const item = {
  id: 'a',
  type: 'rating',
  rating: 5,
  status: 'new',
  adminNote: '',
  message: 'Love it',
  testimonialConsent: true,
  displayName: 'Sam',
  email: 'sam@example.com',
  createdAt: '2026-01-10T10:00:00.000Z',
  context: {},
} as unknown as AdminFeedbackItem;

const mountPanel = (props: Record<string, unknown> = {}) =>
  mount(FeedbackDetailPanel, {
    props: { item, saving: null, saveError: '', failedSaves: 0, saved: null, ...props },
    global: { stubs: { 'font-awesome-icon': true } },
  });

describe('FeedbackDetailPanel', () => {
  it('disables the status select while any save is in flight', () => {
    expect(mountPanel({ saving: 'note' }).get('select').attributes('disabled')).toBeDefined();
    expect(mountPanel().get('select').attributes('disabled')).toBeUndefined();
  });

  it('puts the status select back to the stored value after a failed save', async () => {
    const wrapper = mountPanel();
    const select = wrapper.get('select');
    await select.setValue('done');
    expect(wrapper.emitted('update-status')?.[0]).toEqual(['done']);
    expect((select.element as HTMLSelectElement).value).toBe('done');
    await wrapper.setProps({ failedSaves: 1 });
    expect((select.element as HTMLSelectElement).value).toBe('new');
  });

  it('shows the rating scale from the shared maximum and a Saved confirmation', async () => {
    const wrapper = mountPanel({ saved: 'note' });
    expect(wrapper.text()).toContain('Rated 5 of 5');
    expect(wrapper.text()).toContain('Saved');
  });

  it('tells the admin when copying the testimonial fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const wrapper = mountPanel();
    await wrapper.get('button:not(.lg\\:tw-hidden)[class*="border-gold"]').trigger('click');
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="copy-status"]').text()).toContain("Couldn't copy"),
    );
  });
});
