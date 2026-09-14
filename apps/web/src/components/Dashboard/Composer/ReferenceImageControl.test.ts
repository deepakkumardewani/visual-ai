import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MODEL_REGISTRY, type ModelKey } from '@visual-ai/shared';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import ReferenceImageControl from '@/components/Dashboard/Composer/ReferenceImageControl.vue';
import { useAsideStore } from '@/stores/aside';
import { MODELS } from '@/utils/models';

const stubs = {
  'font-awesome-icon': true,
  Popover: {
    template:
      '<div><slot name="trigger" :open="false" /><div data-testid="popover-body"><slot /></div></div>',
  },
  Teleport: { template: '<div><slot /></div>' },
};

function enableReference(pinia: ReturnType<typeof createPinia>) {
  const withInput = MODELS.find((model) => {
    const fields = MODEL_REGISTRY[model.id as ModelKey]?.fields;
    return Boolean(fields && 'imageInput' in fields && fields.imageInput);
  }) ?? { ...useAsideStore(pinia).mode, id: 'FLUX_KONTEXT_PRO' };
  useAsideStore(pinia).mode = withInput;
}

function mountControl(pinia = createPinia()) {
  setActivePinia(pinia);
  return mount(ReferenceImageControl, {
    global: { plugins: [pinia], stubs },
    attachTo: document.body,
  });
}

describe('ReferenceImageControl', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.body.innerHTML = '';
  });

  it('shows a disabled trigger when the model does not support image input', () => {
    const wrapper = mountControl();

    expect(wrapper.get('[data-testid="reference-image-control"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="reference-image-disabled"]').exists()).toBe(true);
    expect(
      wrapper.get('[data-testid="reference-image-trigger"]').attributes('disabled'),
    ).toBeDefined();
  });

  it('shows a tooltip on hover and hides it on leave', async () => {
    const wrapper = mountControl();
    window.dispatchEvent(new Event('scroll'));
    const disabled = wrapper.get('[data-testid="reference-image-disabled"]');

    await disabled.trigger('mouseenter');
    expect(
      document.body.querySelector('[data-testid="reference-image-tooltip"]')?.textContent,
    ).toContain('doesn’t support reference images');

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));

    await disabled.trigger('mouseleave');
    expect(document.body.querySelector('[data-testid="reference-image-tooltip"]')).toBeNull();
    wrapper.unmount();
  });

  it('shows the tooltip on focus and hides it on blur', async () => {
    const wrapper = mountControl();
    const disabled = wrapper.get('[data-testid="reference-image-disabled"]');

    await disabled.trigger('focusin');
    expect(document.body.querySelector('[data-testid="reference-image-tooltip"]')).not.toBeNull();

    await disabled.trigger('focusout');
    expect(document.body.querySelector('[data-testid="reference-image-tooltip"]')).toBeNull();
  });

  it('opens the add-reference dialog when image input is supported', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mountControl(pinia);

    expect(useAsideStore(pinia).supportsImageInput).toBe(true);
    expect(wrapper.find('[data-testid="reference-image-info"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="reference-image-add"]').text()).toMatch(/Add reference/i);
  });

  it('labels the action as replace when a reference is already set', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);
    useAsideStore(pinia).referenceImage = {
      file: new File(['x'], 'ref.png', { type: 'image/png' }),
      previewUrl: 'blob:ref',
      name: 'ref.png',
    };

    const wrapper = mountControl(pinia);
    expect(wrapper.get('[data-testid="reference-image-add"]').text()).toMatch(/Replace reference/i);
  });

  it('closes the info dialog from the close button', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mountControl(pinia);

    await wrapper.get('[aria-label="Close"]').trigger('click');
    expect(wrapper.find('[data-testid="reference-image-info"]').exists()).toBe(true);
  });

  it('opens the file picker from Add reference', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mountControl(pinia);

    const input = wrapper.get('input[type="file"]').element as HTMLInputElement;
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});
    await wrapper.get('[data-testid="reference-image-add"]').trigger('click');
    expect(click).toHaveBeenCalled();
  });

  it('stores a valid reference image from the file input', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mountControl(pinia);
    const file = new File(['img'], 'guide.png', { type: 'image/png' });
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });

    await input.trigger('change');
    expect(useAsideStore(pinia).referenceImage?.name).toBe('guide.png');
  });

  it('ignores invalid or empty file selections', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const wrapper = mountControl(pinia);

    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [], configurable: true });
    await input.trigger('change');
    expect(useAsideStore(pinia).referenceImage).toBeNull();

    const bad = new File(['x'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(input.element, 'files', { value: [bad], configurable: true });
    await input.trigger('change');
    expect(useAsideStore(pinia).referenceImage).toBeNull();
  });
});
