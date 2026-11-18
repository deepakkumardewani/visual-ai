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

  it('renders a company header with logo and name per company group in Free and Pro', () => {
    const wrapper = mountPanel();
    for (const section of ['free', 'pro']) {
      const root = wrapper.get(`[data-testid="model-section-${section}"]`);
      const headers = root.findAll('[data-testid="model-company-header"]');
      const names = headers.map((h) => h.text());
      expect(names.length).toBeGreaterThan(0);
      expect(new Set(names).size).toBe(names.length);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
      for (const h of headers) expect(h.find('img, svg, [data-provider]').exists()).toBe(true);
    }
  });

  it('header count matches the number of distinct companies in each tier', () => {
    const wrapper = mountPanel();
    const company = (m: (typeof MODELS)[number]) => m.companyName ?? m.provider;
    const premium = MODELS.filter((m) => PREMIUM_MODEL_KEYS.includes(m.id as ModelKey));
    const free = MODELS.filter((m) => !PREMIUM_MODEL_KEYS.includes(m.id as ModelKey));
    const count = (s: string) =>
      wrapper
        .get(`[data-testid="model-section-${s}"]`)
        .findAll('[data-testid="model-company-header"]').length;
    expect(count('free')).toBe(new Set(free.map(company)).size);
    expect(count('pro')).toBe(new Set(premium.map(company)).size);
  });

  it('has no company headers in the Featured section', () => {
    const featured = mountPanel().get('[data-testid="model-section-featured"]');
    expect(featured.find('[data-testid="model-company-header"]').exists()).toBe(false);
  });

  it('emits selectModel with the model when a Featured option is clicked', async () => {
    const wrapper = mountPanel();
    const first = MODELS.find((m) => m.featured && !PREMIUM_MODEL_KEYS.includes(m.id as ModelKey))!;
    const options = wrapper
      .get('[data-testid="model-section-featured"]')
      .findAll('[data-testid="model-option"]');
    const idx = MODELS.filter((m) => m.featured).indexOf(first);
    await options[idx].trigger('click');
    expect(wrapper.emitted('selectModel')?.[0]).toEqual([first]);
  });

  it('marks only the selected model option as selected', () => {
    const wrapper = mountPanel();
    const selected = wrapper
      .findAll('[data-testid="model-option"]')
      .filter((o) => o.attributes('aria-selected') === 'true');
    expect(selected.length).toBeGreaterThan(0);
    for (const o of selected) expect(o.text()).toContain(MODELS[0].title);
  });
});
