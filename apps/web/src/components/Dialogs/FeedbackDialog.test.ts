import { FEEDBACK_MESSAGE_MAX_LENGTH } from '@visual-ai/shared';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const submitFeedback = vi.fn();
vi.mock('@/utils/feedbackApi', () => ({
  submitFeedback: (...args: unknown[]) => submitFeedback(...args),
}));
vi.mock('@/composables/useFeedbackContext', () => ({
  useFeedbackContext: () => () => ({ route: '/profile' }),
}));

import FeedbackDialog from '@/components/Dialogs/FeedbackDialog.vue';
import { useDialogStore } from '@/stores/dialog';
import { FEEDBACK_RATE_LIMITED_ERROR } from '@/utils/feedbackUi';

const stubs = {
  AppModal: {
    props: ['open'],
    template: '<div v-if="open" data-testid="app-modal"><slot name="title" /><slot /></div>',
  },
  'font-awesome-icon': true,
};

function mountOpen() {
  const dialog = useDialogStore();
  dialog.showFeedback();
  return { wrapper: mount(FeedbackDialog, { global: { stubs } }), dialog };
}

describe('FeedbackDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    submitFeedback.mockReset().mockResolvedValue({ ok: true, data: { id: '1' } });
  });

  it('is closed by default', () => {
    expect(
      mount(FeedbackDialog, { global: { stubs } }).find('[data-testid="app-modal"]').exists(),
    ).toBe(false);
  });

  it('disables send until there is a non-blank message', async () => {
    const { wrapper } = mountOpen();
    const send = () => wrapper.get('button[type="submit"]');
    expect(send().attributes('disabled')).toBeDefined();
    await wrapper.get('textarea').setValue('   ');
    expect(send().attributes('disabled')).toBeDefined();
    await wrapper.get('textarea').setValue('Export fails');
    expect(send().attributes('disabled')).toBeUndefined();
  });

  it('caps the textarea at the shared max length', () => {
    const { wrapper } = mountOpen();
    expect(wrapper.get('textarea').attributes('maxlength')).toBe(
      String(FEEDBACK_MESSAGE_MAX_LENGTH),
    );
  });

  it('submits type, trimmed message and context, then shows the success state', async () => {
    const { wrapper } = mountOpen();
    await wrapper.get('textarea').setValue('  Export fails  ');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(submitFeedback).toHaveBeenCalledWith({
      source: 'menu',
      type: 'bug',
      message: 'Export fails',
      context: { route: '/profile' },
    });
    expect(wrapper.get('[data-testid="feedback-sent"]').text()).toContain('Thanks');
  });

  it('keeps the message and shows an alert on failure', async () => {
    submitFeedback.mockResolvedValue({ ok: false, status: 500 });
    const { wrapper } = mountOpen();
    await wrapper.get('textarea').setValue('Export fails');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Export fails');
  });

  it('shows distinct rate-limited copy on 429', async () => {
    submitFeedback.mockResolvedValue({ ok: false, status: 429 });
    const { wrapper } = mountOpen();
    await wrapper.get('textarea').setValue('Export fails');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe(FEEDBACK_RATE_LIMITED_ERROR);
  });

  it('ignores a response that lands after the dialog was closed and reopened', async () => {
    let resolve!: (value: unknown) => void;
    submitFeedback.mockReturnValue(new Promise((r) => (resolve = r)));
    const { wrapper, dialog } = mountOpen();
    await wrapper.get('textarea').setValue('Export fails');
    await wrapper.get('form').trigger('submit');
    dialog.hideFeedback();
    await flushPromises();
    dialog.showFeedback();
    await flushPromises();
    resolve({ ok: true, data: { id: '1' } });
    await flushPromises();
    expect(wrapper.find('[data-testid="feedback-sent"]').exists()).toBe(false);
  });
});
