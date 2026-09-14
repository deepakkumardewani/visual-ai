import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const push = vi.fn();
const route = reactive({
  name: 'create',
  params: { feature: undefined as string | undefined },
  query: {} as Record<string, string>,
});

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push }),
}));

import FeatureSelect from '@/components/Header/FeatureSelect.vue';
import { useAppStore } from '@/stores/app';
import { useAsideStore } from '@/stores/aside';
import { FeatureType } from '@/types';
import { UPSCALER_MODELS } from '@/utils/models';

const stubs = {
  'font-awesome-icon': true,
};

describe('FeatureSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
    route.name = 'create';
    route.params = { feature: undefined };
    route.query = {};
  });

  it('renders the default image feature', () => {
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    expect(wrapper.get('[data-testid="feature-select-trigger"]').text()).toContain(
      'AI Image Generator',
    );
    expect(wrapper.get('[data-testid="feature-select-trigger"]').attributes('aria-expanded')).toBe(
      'false',
    );
  });

  it('opens the menu and lists features', async () => {
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    await wrapper.get('[data-testid="feature-select-trigger"]').trigger('click');
    expect(wrapper.find('[data-testid="feature-select-menu"]').exists()).toBe(true);
    expect(
      wrapper.find(`[data-testid="feature-select-option-${FeatureType.UPSCALE}"]`).exists(),
    ).toBe(true);
  });

  it('navigates when another feature is selected', async () => {
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    await wrapper.get('[data-testid="feature-select-trigger"]').trigger('click');
    await wrapper
      .get(`[data-testid="feature-select-option-${FeatureType.COLORIZE}"]`)
      .trigger('click');
    expect(push).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="feature-select-menu"]').exists()).toBe(false);
  });

  it('closes the menu on escape', async () => {
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    await wrapper.get('[data-testid="feature-select-trigger"]').trigger('click');
    const option = wrapper.get(`[data-testid="feature-select-option-${FeatureType.IMAGE}"]`);
    await option.trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('[data-testid="feature-select-menu"]').exists()).toBe(false);
  });

  it('opens from the trigger keyboard and wraps arrow keys', async () => {
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    await wrapper.get('[data-testid="feature-select-trigger"]').trigger('keydown', {
      key: 'ArrowDown',
    });
    expect(wrapper.find('[data-testid="feature-select-menu"]').exists()).toBe(true);

    const option = wrapper.get(`[data-testid="feature-select-option-${FeatureType.IMAGE}"]`);
    await option.trigger('keydown', { key: 'ArrowDown' });
    await option.trigger('keydown', { key: 'ArrowUp' });
    await option.trigger('keydown', { key: 'Home' });
    await option.trigger('keydown', { key: 'End' });
    await option.trigger('keydown', { key: 'Enter' });
    expect(push).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="feature-select-menu"]').exists()).toBe(false);
  });

  it('keeps the upscaler model query when selecting upscale', async () => {
    route.query = { model: UPSCALER_MODELS[0].id, feature: 'stale' };
    const aside = useAsideStore();
    aside.upscaleModel = UPSCALER_MODELS[0];

    const wrapper = mount(FeatureSelect, { global: { stubs } });
    await wrapper.get('[data-testid="feature-select-trigger"]').trigger('click');
    await wrapper
      .get(`[data-testid="feature-select-option-${FeatureType.UPSCALE}"]`)
      .trigger('click');
    expect(push).toHaveBeenCalled();
    const location = push.mock.calls.at(-1)?.[0] as { query?: Record<string, string> };
    expect(location.query?.model).toBe(UPSCALER_MODELS[0].id);
  });

  it('resolves dark-mode feature icons without throwing', () => {
    const appStore = useAppStore();
    appStore.isDark = true;
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    expect(wrapper.get('[data-testid="feature-select-trigger"]').exists()).toBe(true);
  });

  it('falls back to the image feature for unknown route params', () => {
    route.params = { feature: 'not-a-tool' };
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    expect(wrapper.get('[data-testid="feature-select-trigger"]').text()).toContain(
      'AI Image Generator',
    );
  });

  it('applies an upscaler model from the query when the feature is upscale', async () => {
    route.params = { feature: FeatureType.UPSCALE };
    route.query = { model: UPSCALER_MODELS[1].id };
    const aside = useAsideStore();
    mount(FeatureSelect, { global: { stubs } });
    expect(aside.upscaleModel.id).toBe(UPSCALER_MODELS[1].id);
  });

  it('ignores a non-string model query until the feature is upscale', () => {
    route.query = { model: ['not-a-string'] as unknown as string };
    const aside = useAsideStore();
    const before = aside.upscaleModel.id;
    mount(FeatureSelect, { global: { stubs } });
    expect(aside.upscaleModel.id).toBe(before);
  });

  it('closes an open menu on a second toggle and drops model when leaving upscale', async () => {
    route.query = { model: UPSCALER_MODELS[0].id };
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    const trigger = wrapper.get('[data-testid="feature-select-trigger"]');
    await trigger.trigger('click');
    expect(wrapper.find('[data-testid="feature-select-menu"]').exists()).toBe(true);
    await trigger.trigger('click');
    expect(wrapper.find('[data-testid="feature-select-menu"]').exists()).toBe(false);

    await trigger.trigger('click');
    await wrapper
      .get(`[data-testid="feature-select-option-${FeatureType.IMAGE}"]`)
      .trigger('click');
    const location = push.mock.calls.at(-1)?.[0] as { query?: Record<string, string> };
    expect(location.query?.model).toBeUndefined();
  });

  it('uses the aside upscaler when selecting upscale without a model query', async () => {
    const aside = useAsideStore();
    aside.upscaleModel = UPSCALER_MODELS[1];
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    await wrapper.get('[data-testid="feature-select-trigger"]').trigger('click');
    await wrapper
      .get(`[data-testid="feature-select-option-${FeatureType.UPSCALE}"]`)
      .trigger('click');
    const location = push.mock.calls.at(-1)?.[0] as { query?: Record<string, string> };
    expect(location.query?.model).toBe(UPSCALER_MODELS[1].id);
  });

  it('opens from Space on the trigger and wraps arrows on the last item', async () => {
    const wrapper = mount(FeatureSelect, { global: { stubs } });
    await wrapper.get('[data-testid="feature-select-trigger"]').trigger('keydown', { key: ' ' });
    expect(wrapper.find('[data-testid="feature-select-menu"]').exists()).toBe(true);

    const last = wrapper.get(`[data-testid="feature-select-option-${FeatureType.REMOVE_BG}"]`);
    await last.trigger('keydown', { key: 'ArrowDown' });
    await last.trigger('keydown', { key: 'ArrowUp' });
    await last.trigger('keydown', { key: ' ' });
    expect(push).toHaveBeenCalled();
  });
});
