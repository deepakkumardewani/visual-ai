import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const pushMock = vi.fn();

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import ModelPicker from '@/components/Dashboard/ControlRail/ModelPicker.vue';
import { useAsideStore } from '@/stores/aside';
import { useUserStore } from '@/stores/user';
import { MODEL_IDS } from '@/utils/modelIds';
import { FLUX_MODES, MODELS } from '@/utils/models';

describe('ModelPicker', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    pushMock.mockClear();
  });

  const mountPicker = (options: { attachTo?: HTMLElement } = {}) => {
    const pinia = createPinia();
    setActivePinia(pinia);
    return { wrapper: mount(ModelPicker, { global: { plugins: [pinia] }, ...options }), pinia };
  };

  it('renders "Model" label and trigger', () => {
    const { wrapper } = mountPicker();
    expect(wrapper.text()).toContain('Model');
    expect(wrapper.find('[data-testid="model-picker-trigger"]').exists()).toBe(true);
  });

  it('opens popover and lists grouped model options', async () => {
    const { wrapper } = mountPicker();

    await wrapper.get('button').trigger('click');
    const options = wrapper.findAll('[data-testid="model-option"]');
    expect(options.length).toBe(MODELS.length);
    expect(wrapper.text()).toContain('Black Forest Labs');
    expect(wrapper.text()).toContain('OpenAI');
  });

  it('supports keyboard navigation between model options', async () => {
    const { wrapper } = mountPicker({ attachTo: document.body });

    await wrapper.get('button').trigger('click');
    const first = wrapper.findAll('[data-testid="model-option"]')[0].element as HTMLButtonElement;
    const second = wrapper.findAll('[data-testid="model-option"]')[1].element as HTMLButtonElement;

    expect(document.activeElement).toBe(first);

    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(second);

    wrapper.unmount();
  });

  it('redirects non-pro users selecting premium model to pricing', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.isPro = false;

    const asideStore = useAsideStore();
    asideStore.mode = FLUX_MODES[0];

    const wrapper = mount(ModelPicker, { global: { plugins: [pinia] } });
    await wrapper.get('button').trigger('click');

    const fluxPro = MODELS.find((m) => m.id === MODEL_IDS.FLUX_PRO)!;
    const proOption = wrapper
      .findAll('[data-testid="model-option"]')
      .find((el) => el.text().includes(fluxPro.title))!;

    await proOption.trigger('click');

    expect(pushMock).toHaveBeenCalledWith('/pricing');
    expect(asideStore.mode.title).toBe(FLUX_MODES[1].title);
  });

  it('sets noOfOutputs to 1 when selecting FLUX_PRO', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.isPro = true;

    const asideStore = useAsideStore();
    asideStore.noOfOutputs = 4;

    const wrapper = mount(ModelPicker, { global: { plugins: [pinia] } });
    await wrapper.get('button').trigger('click');

    const fluxPro = MODELS.find((m) => m.id === MODEL_IDS.FLUX_PRO)!;
    const proOption = wrapper
      .findAll('[data-testid="model-option"]')
      .find((el) => el.text().includes(fluxPro.title))!;

    await proOption.trigger('click');

    expect(asideStore.mode.id).toBe(MODEL_IDS.FLUX_PRO);
    expect(asideStore.noOfOutputs).toBe(1);
  });

  it('sets noOfOutputs to 1 when selecting FLUX_1_1_PRO', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.isPro = true;

    const asideStore = useAsideStore();
    asideStore.noOfOutputs = 3;

    const wrapper = mount(ModelPicker, { global: { plugins: [pinia] } });
    await wrapper.get('button').trigger('click');

    const flux11Pro = MODELS.find((m) => m.id === MODEL_IDS.FLUX_1_1_PRO)!;
    const proOption = wrapper
      .findAll('[data-testid="model-option"]')
      .find((el) => el.text().includes(flux11Pro.title))!;

    await proOption.trigger('click');

    expect(asideStore.mode.id).toBe(MODEL_IDS.FLUX_1_1_PRO);
    expect(asideStore.noOfOutputs).toBe(1);
  });
});
