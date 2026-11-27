import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const submitFeedback = vi.fn();
vi.mock('@/utils/feedbackApi', () => ({
  submitFeedback: (...args: unknown[]) => submitFeedback(...args),
  requestEligibility: vi.fn(),
}));
vi.mock('@/composables/useFeedbackContext', () => ({
  useFeedbackContext: () => () => ({ route: '/create/image' }),
}));

import FeedbackPopup from '@/components/Feedback/FeedbackPopup.vue';
import { useFeedbackStore } from '@/stores/feedback';
import { FEEDBACK_RATE_LIMITED_ERROR, FEEDBACK_SUCCESS_AUTOCLOSE_MS } from '@/utils/feedbackUi';

const mountPopup = () =>
  mount(FeedbackPopup, {
    attachTo: document.body,
    global: {
      stubs: { 'font-awesome-icon': true, Teleport: true },
    },
  });

async function openAt(wrapper: ReturnType<typeof mountPopup>, rating: number) {
  const store = useFeedbackStore();
  store.popupOpen = true;
  await flushPromises();
  await wrapper.get(`[data-testid="feedback-rating-${rating}"]`).trigger('click');
  await flushPromises();
}

describe('FeedbackPopup', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    submitFeedback.mockReset().mockResolvedValue({ ok: true, data: { id: '1' } });
    document.body.innerHTML = '';
  });

  it('renders nothing until opened', () => {
    expect(mountPopup().find('[data-testid="feedback-popup"]').exists()).toBe(false);
  });

  it('shows a radiogroup of five ratings', async () => {
    const wrapper = mountPopup();
    useFeedbackStore().popupOpen = true;
    await flushPromises();
    expect(wrapper.findAll('[role="radio"]')).toHaveLength(5);
  });

  it.each([1, 2])('rating %i asks what went wrong and offers no consent', async (rating) => {
    const wrapper = mountPopup();
    await openAt(wrapper, rating);
    expect(wrapper.text()).toContain('What went wrong');
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
  });

  it('rating 3 asks what would make it better, no consent', async () => {
    const wrapper = mountPopup();
    await openAt(wrapper, 3);
    expect(wrapper.text()).toContain('What would make it better');
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
  });

  it.each([4, 5])('rating %i offers a quote consent and name field', async (rating) => {
    const wrapper = mountPopup();
    await openAt(wrapper, rating);
    expect(wrapper.text()).toContain('What do you love');
    expect(wrapper.find('input[type="text"]').exists()).toBe(false);
    await wrapper.get('input[type="checkbox"]').setValue(true);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
  });

  it('submits the rating without a message and thanks the user', async () => {
    const wrapper = mountPopup();
    await openAt(wrapper, 2);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(submitFeedback).toHaveBeenCalledWith({
      source: 'popup',
      rating: 2,
      context: { route: '/create/image' },
    });
    expect(wrapper.get('[role="status"]').text()).toContain('Thanks');
  });

  it('sends consent and display name only for high ratings', async () => {
    const wrapper = mountPopup();
    await openAt(wrapper, 5);
    await wrapper.get('textarea').setValue('  Love the upscaler  ');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await wrapper.get('input[type="text"]').setValue('Sam');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 5,
        message: 'Love the upscaler',
        testimonialConsent: true,
        displayName: 'Sam',
      }),
    );
  });

  it('keeps the form and shows an alert when sending fails', async () => {
    submitFeedback.mockResolvedValue({ ok: false, status: 500 });
    const wrapper = mountPopup();
    await openAt(wrapper, 1);
    await wrapper.get('textarea').setValue('broken');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('try again');
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('broken');
  });

  it('closes on Escape and on the dismiss button', async () => {
    const wrapper = mountPopup();
    const store = useFeedbackStore();
    store.popupOpen = true;
    await flushPromises();
    await wrapper.get('[data-testid="feedback-popup"]').trigger('keydown', { key: 'Escape' });
    expect(store.popupOpen).toBe(false);
    store.popupOpen = true;
    await flushPromises();
    await wrapper.get('[data-testid="feedback-popup-close"]').trigger('click');
    expect(store.popupOpen).toBe(false);
  });

  it('shows distinct rate-limited copy on 429', async () => {
    submitFeedback.mockResolvedValue({ ok: false, status: 429 });
    const wrapper = mountPopup();
    await openAt(wrapper, 1);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe(FEEDBACK_RATE_LIMITED_ERROR);
  });

  it('returns focus to the opener on Escape, dismiss and auto-close', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    const wrapper = mountPopup();
    const store = useFeedbackStore();

    opener.focus();
    store.popupOpen = true;
    await flushPromises();
    const card = wrapper.get('[data-testid="feedback-popup"]');
    expect(document.activeElement).toBe(card.element);
    await card.trigger('keydown', { key: 'Escape' });
    await flushPromises();
    expect(document.activeElement).toBe(opener);

    opener.focus();
    store.popupOpen = true;
    await flushPromises();
    (wrapper.get('[data-testid="feedback-popup-close"]').element as HTMLElement).focus();
    await wrapper.get('[data-testid="feedback-popup-close"]').trigger('click');
    await flushPromises();
    expect(document.activeElement).toBe(opener);

    vi.useFakeTimers();
    opener.focus();
    store.popupOpen = true;
    await flushPromises();
    await wrapper.get('[data-testid="feedback-rating-2"]').trigger('click');
    await flushPromises();
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(document.activeElement).toBe(wrapper.get('[data-testid="feedback-popup"]').element);
    await vi.advanceTimersByTimeAsync(FEEDBACK_SUCCESS_AUTOCLOSE_MS);
    await flushPromises();
    vi.useRealTimers();
    expect(store.popupOpen).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('keeps focus inside the card after Change so Escape still closes it', async () => {
    const wrapper = mountPopup();
    const store = useFeedbackStore();
    await openAt(wrapper, 4);
    (wrapper.get('form button[type="button"]').element as HTMLElement).focus();
    await wrapper.get('form button[type="button"]').trigger('click');
    await flushPromises();
    const card = wrapper.get('[data-testid="feedback-popup"]');
    expect(card.element.contains(document.activeElement)).toBe(true);
    await card.trigger('keydown', { key: 'Escape' });
    expect(store.popupOpen).toBe(false);
  });

  it('keeps focus inside the card after choosing a rating so Escape still closes it', async () => {
    const wrapper = mountPopup();
    const store = useFeedbackStore();
    store.popupOpen = true;
    await flushPromises();
    const choice = wrapper.get('[data-testid="feedback-rating-3"]');
    (choice.element as HTMLElement).focus();
    await choice.trigger('click');
    await flushPromises();
    const card = wrapper.get('[data-testid="feedback-popup"]');
    expect(document.activeElement).not.toBe(document.body);
    expect(card.element.contains(document.activeElement)).toBe(true);
    await card.trigger('keydown', { key: 'Escape' });
    expect(store.popupOpen).toBe(false);
  });

  it('marks the chosen rating as checked after Change', async () => {
    const wrapper = mountPopup();
    await openAt(wrapper, 4);
    await wrapper.get('form button[type="button"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="feedback-rating-4"]').attributes('aria-checked')).toBe(
      'true',
    );
  });
});
