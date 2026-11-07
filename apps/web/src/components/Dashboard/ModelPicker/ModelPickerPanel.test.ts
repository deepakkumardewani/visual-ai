import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { PREMIUM_MODEL_KEYS, type ModelKey } from '@visual-ai/shared';

import ModelPickerPanel from '@/components/Dashboard/ModelPicker/ModelPickerPanel.vue';
import { MODELS } from '@/utils/models';

const mountPanel = () =>
  mount(ModelPickerPanel, { props: { models: MODELS, selectedModel: MODELS[0] } });

const idsIn = (wrapper: ReturnType<typeof mountPanel>, section: string) =>
  wrapper.get(`[data-testid="model-section-${section}"]`).findAll('[data-testid="model-option"]')
    .length;

describe('ModelPickerPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders Featured, Free and Pro sections in that order', () => {
    const wrapper = mountPanel();
    expect(wrapper.get('[role="listbox"]').attributes('aria-label')).toBe('Select a model');
    expect(wrapper.findAll('h3').map((h) => h.text())).toEqual(['Featured', 'Free', 'Pro']);
  });

  it('puts featured models in Featured and repeats them in their tier section', () => {
    const wrapper = mountPanel();
    const premium = MODELS.filter((m) => PREMIUM_MODEL_KEYS.includes(m.id as ModelKey));
    expect(idsIn(wrapper, 'featured')).toBe(MODELS.filter((m) => m.featured).length);
    expect(idsIn(wrapper, 'pro')).toBe(premium.length);
    expect(idsIn(wrapper, 'free')).toBe(MODELS.length - premium.length);
  });

  it('shows locks in the Pro section for a free user', () => {
    const wrapper = mountPanel();
    const pro = wrapper.get('[data-testid="model-section-pro"]');
    expect(pro.findAll('[data-testid="premium-lock-badge"]')).toHaveLength(idsIn(wrapper, 'pro'));
  });

  it('omits empty sections', () => {
    const freeOnly = MODELS.filter((m) => !PREMIUM_MODEL_KEYS.includes(m.id as ModelKey));
    const wrapper = mount(ModelPickerPanel, {
      props: { models: freeOnly, selectedModel: freeOnly[0] },
    });
    expect(wrapper.find('[data-testid="model-section-pro"]').exists()).toBe(false);
  });

  it('emits selectModel when a free option is clicked', async () => {
    const wrapper = mountPanel();
    await wrapper
      .get('[data-testid="model-section-free"] [data-testid="model-option"]')
      .trigger('click');
    expect(wrapper.emitted('selectModel')).toHaveLength(1);
  });
});
