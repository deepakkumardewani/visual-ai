import { createPinia, setActivePinia } from 'pinia';
import { DOMWrapper, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

// The dropdown panel is teleported to document.body (see Popover.vue),
// so options are queried via a DOMWrapper over document.body rather than the wrapper's own subtree.
function body() {
  return new DOMWrapper(document.body);
}

const pushMock = vi.fn();

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import ModelPicker from '@/components/Dashboard/ModelPicker/ModelPicker.vue';
import { MODEL_IDS } from '@visual-ai/shared';
import { FLUX_MODES, getFeaturedModels, MODELS } from '@/utils/models';

// Non-featured models live in a per-company submenu that only renders on hover
// (ModelCompanyGroup.vue). Simulate the mouseenter that Popover's real DOM would receive.
function openCompanySubmenu(companyName: string) {
  const label = body()
    .findAll('span')
    .find((el) => el.text() === companyName)!;
  const row = label.element.parentElement!.parentElement as HTMLElement;
  row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
}

describe('ModelPicker', () => {
  let activeWrapper: VueWrapper | null = null;

  beforeEach(() => {
    setActivePinia(createPinia());
    pushMock.mockClear();
  });

  afterEach(() => {
    activeWrapper?.unmount();
    activeWrapper = null;
    document.body.innerHTML = '';
  });

  const mountPicker = (
    options: {
      attachTo?: HTMLElement;
      models?: typeof MODELS;
      selected?: (typeof MODELS)[0];
      fallback?: (typeof MODELS)[0];
      pinia?: any;
    } = {},
  ) => {
    const pinia = options.pinia ?? createPinia();
    if (!options.pinia) {
      setActivePinia(pinia);
    }
    const models = options.models ?? MODELS;
    const selected = options.selected ?? MODELS[0];
    const fallback = options.fallback ?? FLUX_MODES[1];

    const wrapper = mount(ModelPicker, {
      props: { models, selected, fallback },
      global: { plugins: [pinia] },
      attachTo: document.body,
    });
    activeWrapper = wrapper;
    return { wrapper, pinia };
  };

  it('renders "Model" label and trigger', () => {
    const { wrapper } = mountPicker();
    expect(wrapper.text()).toContain('Model');
    expect(wrapper.find('[data-testid="model-picker-trigger"]').exists()).toBe(true);
  });

  it('opens popover and lists grouped model options', async () => {
    const { wrapper } = mountPicker({ attachTo: document.body });

    await wrapper.get('button').trigger('click');
    const options = body().findAll('[data-testid="model-option"]');
    expect(options.length).toBe(getFeaturedModels().length);
    expect(body().text()).toContain('Black Forest Labs');
    expect(body().text()).toContain('OpenAI');
  });

  it('supports keyboard navigation between model options', async () => {
    const { wrapper } = mountPicker({ attachTo: document.body });

    await wrapper.get('button').trigger('click');
    const first = body().findAll('[data-testid="model-option"]')[0].element as HTMLButtonElement;
    const second = body().findAll('[data-testid="model-option"]')[1].element as HTMLButtonElement;

    expect(document.activeElement).toBe(first);

    await body().find('[role="dialog"]').trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);
  });

  it('emits selected model regardless of tier', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const { wrapper } = mountPicker({ pinia });
    await wrapper.get('button').trigger('click');

    const fluxPro = MODELS.find((m) => m.id === MODEL_IDS.FLUX_PRO)!;
    openCompanySubmenu(fluxPro.companyName!);
    await wrapper.vm.$nextTick();
    const proOption = body()
      .findAll('[data-testid="model-option"]')
      .find((el) => el.text().includes(fluxPro.title))!;

    await proOption.trigger('click');

    expect(wrapper.emitted('update:selected')).toBeTruthy();
    const emittedModel = wrapper.emitted('update:selected')?.[0]?.[0] as any;
    expect(emittedModel?.id).toBe(MODEL_IDS.FLUX_PRO);
  });

  it('allows selection of FLUX_1_1_PRO model', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const { wrapper } = mountPicker({ pinia });
    await wrapper.get('button').trigger('click');

    const flux11Pro = MODELS.find((m) => m.id === MODEL_IDS.FLUX_1_1_PRO)!;
    openCompanySubmenu(flux11Pro.companyName!);
    await wrapper.vm.$nextTick();
    const proOption = body()
      .findAll('[data-testid="model-option"]')
      .find((el) => el.text().includes(flux11Pro.title))!;

    await proOption.trigger('click');

    expect(wrapper.emitted('update:selected')).toBeTruthy();
    const emittedModel = wrapper.emitted('update:selected')?.[0]?.[0] as any;
    expect(emittedModel?.id).toBe(MODEL_IDS.FLUX_1_1_PRO);
  });

  it('accepts and uses different model lists', () => {
    // Verify the component can be mounted with different model lists
    const alternateModels = MODELS.slice(0, 3);
    const { wrapper } = mountPicker({
      models: alternateModels,
      selected: alternateModels[0],
      fallback: alternateModels[2],
    });

    expect(wrapper.text()).toContain('Model');
    expect(wrapper.find('[data-testid="model-picker-trigger"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="model-picker"]').exists()).toBe(true);
  });
});
