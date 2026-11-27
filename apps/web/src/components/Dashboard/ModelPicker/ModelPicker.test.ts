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
import { MODEL_IDS, PLAN } from '@visual-ai/shared';
import { useDialogStore } from '@/stores/dialog';
import { useUserStore } from '@/stores/user';
import { FLUX_MODES, getFeaturedModels, MODELS } from '@/utils/models';
import { installMatchMedia } from '@/test/matchMediaMock';
import { BREAKPOINT } from '@/utils/layout';

// Every model is listed in its tier section, so options are looked up by title.
function findOption(title: string) {
  return body()
    .findAll('[data-testid="model-option"]')
    .find((el) => el.text().includes(title))!;
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
    // Featured models repeat once in their tier section, and every model has exactly one tier.
    expect(options.length).toBe(getFeaturedModels().length + MODELS.length);
    expect(
      body()
        .findAll('h3')
        .map((h) => h.text()),
    ).toEqual(['Featured', 'Free', 'Pro']);
  });

  it('supports keyboard navigation between model options', async () => {
    const { wrapper } = mountPicker({ attachTo: document.body });

    await wrapper.get('button').trigger('click');
    const first = body().findAll('[data-testid="model-option"]')[0].element as HTMLButtonElement;
    const second = body().findAll('[data-testid="model-option"]')[1].element as HTMLButtonElement;

    // happy-dom matches the desktop media query, so the search input is focused first.
    const input = body().find('[data-testid="model-search-input"]');
    expect(document.activeElement).toBe(input.element);

    await input.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(first);

    await body().find('[role="dialog"]').trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);
  });

  it('opens the upgrade prompt instead of selecting a premium model on the free plan', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const { wrapper } = mountPicker({ pinia });
    await wrapper.get('button').trigger('click');

    const fluxPro = MODELS.find((m) => m.id === MODEL_IDS.FLUX_PRO)!;
    await findOption(fluxPro.title).trigger('click');

    expect(wrapper.emitted('update:selected')).toBeFalsy();
    expect(useDialogStore().showPricingDialog).toBe(true);
  });

  it('emits a premium model for a Pro user', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    useUserStore().plan = PLAN.PRO;

    const { wrapper } = mountPicker({ pinia });
    await wrapper.get('button').trigger('click');

    const flux11Pro = MODELS.find((m) => m.id === MODEL_IDS.FLUX_1_1_PRO)!;
    await findOption(flux11Pro.title).trigger('click');

    const emittedModel = wrapper.emitted('update:selected')?.[0]?.[0] as { id: string };
    expect(emittedModel?.id).toBe(MODEL_IDS.FLUX_1_1_PRO);
  });

  it('emits a non-premium model on the free plan', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const { wrapper } = mountPicker({ pinia });
    await wrapper.get('button').trigger('click');

    const flux2Pro = MODELS.find((m) => m.id === MODEL_IDS.FLUX_2_PRO)!;
    await findOption(flux2Pro.title).trigger('click');

    const emittedModel = wrapper.emitted('update:selected')?.[0]?.[0] as { id: string };
    expect(emittedModel?.id).toBe(MODEL_IDS.FLUX_2_PRO);
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

  it('does not autofocus the search input when the desktop media query does not match', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

    try {
      const { wrapper } = mountPicker({ attachTo: document.body });
      await wrapper.get('button').trigger('click');

      const input = body().find('[data-testid="model-search-input"]');
      expect(input.exists()).toBe(true);
      expect(document.activeElement).not.toBe(input.element);
    } finally {
      window.matchMedia = original;
    }
  });

  it('emits the filtered model when filtering, pressing ArrowDown, then Enter', async () => {
    const { wrapper } = mountPicker({ attachTo: document.body });
    await wrapper.get('button').trigger('click');

    const target = MODELS.find((m) => m.id === MODEL_IDS.FLUX_2_PRO)!;
    const input = body().find('[data-testid="model-search-input"]');
    await input.setValue(target.title);

    const options = body().findAll('[data-testid="model-option"]');
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.text().includes(target.title))).toBe(true);

    await input.trigger('keydown', { key: 'ArrowDown' });
    const focused = document.activeElement as HTMLElement;
    expect(focused.textContent).toContain(target.title);

    // Enter on a focused button activates it natively; happy-dom needs the click dispatched.
    await body().find('[role="dialog"]').trigger('keydown', { key: 'Enter' });
    focused.click();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted('update:selected')?.[0]?.[0] as {
      id: string;
    };
    expect(emitted.id).toBe(MODEL_IDS.FLUX_2_PRO);
  });
});

describe('ModelPicker responsive container', () => {
  const SHEET = '[data-testid="model-picker-sheet"]';
  const BACKDROP = '[data-testid="model-picker-sheet-backdrop"]';
  let media: ReturnType<typeof installMatchMedia>;
  let wrapper: VueWrapper | null = null;

  function mountAt(width: number) {
    media = installMatchMedia({ width });
    const pinia = createPinia();
    setActivePinia(pinia);
    wrapper = mount(ModelPicker, {
      props: { models: MODELS, selected: MODELS[0], fallback: FLUX_MODES[1] },
      global: { plugins: [pinia] },
      attachTo: document.body,
    });
    return wrapper;
  }

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    media.restore();
    document.body.style.overflow = '';
    document.body.innerHTML = '';
  });

  it('opens a bottom sheet below the 768 breakpoint', async () => {
    const w = mountAt(BREAKPOINT.MOBILE_MAX - 1);
    await w.get('button').trigger('click');

    expect(body().find(SHEET).exists()).toBe(true);
    expect(body().find('[data-testid="model-search-input"]').exists()).toBe(true);
    expect(w.get('button').attributes('aria-haspopup')).toBe('dialog');
    expect(w.get('button').attributes('aria-expanded')).toBe('true');
  });

  it('uses the anchored popover at 768 and above', async () => {
    const w = mountAt(BREAKPOINT.MOBILE_MAX);
    await w.get('button').trigger('click');

    expect(body().find(SHEET).exists()).toBe(false);
    expect(body().findAll('[data-testid="model-option"]').length).toBeGreaterThan(0);
  });

  it('renders the chip trigger in the sheet layout when chip is set', async () => {
    media = installMatchMedia({ width: 390 });
    const pinia = createPinia();
    setActivePinia(pinia);
    wrapper = mount(ModelPicker, {
      props: {
        chip: true,
        models: MODELS,
        selected: MODELS[0],
        fallback: FLUX_MODES[1],
      },
      global: { plugins: [pinia] },
      attachTo: document.body,
    });

    expect(wrapper.find('[data-testid="model-picker-trigger"]').exists()).toBe(false);
    await wrapper.get('button').trigger('click');
    expect(body().find(SHEET).exists()).toBe(true);
  });

  it('renders the chip trigger in the popover layout when chip is set', async () => {
    media = installMatchMedia({ width: 1280 });
    const pinia = createPinia();
    setActivePinia(pinia);
    wrapper = mount(ModelPicker, {
      props: { chip: true, models: MODELS, selected: MODELS[0], fallback: FLUX_MODES[1] },
      global: { plugins: [pinia] },
      attachTo: document.body,
    });

    expect(wrapper.find('[data-testid="model-picker-trigger"]').exists()).toBe(false);
    await wrapper.get('button').trigger('click');
    expect(body().find(SHEET).exists()).toBe(false);
    expect(body().findAll('[data-testid="model-option"]').length).toBeGreaterThan(0);
  });

  it('closes the sheet on backdrop click', async () => {
    const w = mountAt(390);
    await w.get('button').trigger('click');

    (body().find(BACKDROP).element as HTMLElement).click();
    await w.vm.$nextTick();

    expect(body().find(SHEET).exists()).toBe(false);
    expect(w.get('button').attributes('aria-expanded')).toBe('false');
  });

  it('closes the sheet on Escape', async () => {
    const w = mountAt(390);
    await w.get('button').trigger('click');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    await w.vm.$nextTick();

    expect(body().find(SHEET).exists()).toBe(false);
  });

  it('emits the selection and closes the sheet when a model is chosen', async () => {
    const w = mountAt(390);
    await w.get('button').trigger('click');

    const target = MODELS.find((m) => m.id === MODEL_IDS.FLUX_2_PRO)!;
    await findOption(target.title).trigger('click');

    expect((w.emitted('update:selected')?.[0]?.[0] as { id: string }).id).toBe(
      MODEL_IDS.FLUX_2_PRO,
    );
    expect(body().find(SHEET).exists()).toBe(false);
  });

  it('returns focus to the trigger when the sheet closes', async () => {
    const w = mountAt(390);
    const trigger = w.get('button').element as HTMLButtonElement;
    trigger.focus();
    await w.get('button').trigger('click');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    await w.vm.$nextTick();

    expect(document.activeElement).toBe(trigger);
  });

  it('locks body scroll while the sheet is open and releases it on close', async () => {
    const w = mountAt(390);
    await w.get('button').trigger('click');
    expect(document.body.style.overflow).toBe('hidden');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    await w.vm.$nextTick();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('closes an open sheet when the viewport grows past the breakpoint', async () => {
    const w = mountAt(390);
    await w.get('button').trigger('click');
    expect(body().find(SHEET).exists()).toBe(true);

    media.setWidth(1024);
    await w.vm.$nextTick();
    await w.vm.$nextTick();

    expect(body().find(SHEET).exists()).toBe(false);
    expect(body().findAll('[data-testid="model-option"]')).toHaveLength(0);
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('closes an open popover when the viewport shrinks below the breakpoint', async () => {
    const w = mountAt(1024);
    await w.get('button').trigger('click');
    expect(body().findAll('[data-testid="model-option"]').length).toBeGreaterThan(0);

    media.setWidth(390);
    await w.vm.$nextTick();
    await w.vm.$nextTick();

    expect(body().findAll('[data-testid="model-option"]')).toHaveLength(0);
    expect(body().find(SHEET).exists()).toBe(false);
  });
});
