import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelKey } from '@visual-ai/shared';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import ReferenceImageControl from '@/components/Dashboard/Composer/ReferenceImageControl.vue';
import { MAX_IMAGE_BYTES } from '@/composables/useImageDrop';
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

function enableReference(
  pinia: ReturnType<typeof createPinia>,
  modelId: ModelKey = 'FLUX_KONTEXT_PRO',
) {
  const model = MODELS.find((entry) => entry.id === modelId);
  useAsideStore(pinia).mode = model ?? { ...useAsideStore(pinia).mode, id: modelId };
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

    expect(wrapper.find('[data-testid="reference-image-control"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reference-image-disabled"]').exists()).toBe(true);
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
    useAsideStore(pinia).setReferenceImage(new File(['x'], 'ref.png', { type: 'image/png' }));

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
    const click = vi.spyOn(input, 'click').mockImplementation(async () => {});
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

  it('adds multiple references for multi-image models', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia, 'FLUX_2_PRO');

    const wrapper = mountControl(pinia);
    const files = [
      new File(['1'], 'one.png', { type: 'image/png' }),
      new File(['2'], 'two.png', { type: 'image/png' }),
    ];
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: files, configurable: true });
    await input.trigger('change');

    expect(useAsideStore(pinia).referenceImages).toHaveLength(2);
  });

  it('uses singular copy when a single-image model is full', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);
    useAsideStore(pinia).setReferenceImage(new File(['1'], 'one.png', { type: 'image/png' }));

    const wrapper = mountControl(pinia);
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      value: [new File(['2'], 'two.png', { type: 'image/png' })],
      configurable: true,
    });
    await input.trigger('change');

    expect(wrapper.get('[data-testid="reference-image-inline-error"]').text()).toBe(
      'This model accepts up to 1 image',
    );
  });

  it('highlights the trigger while the reference popover is open', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mount(ReferenceImageControl, {
      global: {
        plugins: [pinia],
        stubs: {
          ...stubs,
          Popover: {
            template:
              '<div><slot name="trigger" :open="true" /><div data-testid="popover-body"><slot /></div></div>',
          },
        },
      },
      attachTo: document.body,
    });

    expect(wrapper.get('[data-testid="reference-image-trigger"]').classes()).toContain(
      'tw-text-ink',
    );
    wrapper.unmount();
  });

  it('blocks selections beyond the model max with an inline message', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia, 'FLUX_2_PRO');
    const store = useAsideStore(pinia);
    for (let i = 0; i < 8; i += 1) {
      store.addReferenceImage(new File([String(i)], `img-${i}.png`, { type: 'image/png' }));
    }

    const wrapper = mountControl(pinia);
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', {
      value: [new File(['9'], 'nine.png', { type: 'image/png' })],
      configurable: true,
    });
    await input.trigger('change');

    expect(store.referenceImages).toHaveLength(8);
    expect(wrapper.get('[data-testid="reference-image-inline-error"]').text()).toContain(
      'up to 8 images',
    );
  });

  it('shows size and type validation errors inline', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    enableReference(pinia);

    const wrapper = mountControl(pinia);
    const input = wrapper.get('input[type="file"]');
    const huge = new File([new Uint8Array(8)], 'big.png', { type: 'image/png' });
    Object.defineProperty(huge, 'size', { value: MAX_IMAGE_BYTES + 1 });
    Object.defineProperty(input.element, 'files', { value: [huge], configurable: true });
    await input.trigger('change');

    expect(wrapper.get('[data-testid="reference-image-inline-error"]').text()).toContain('5MB');
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
