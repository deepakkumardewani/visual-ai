import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import ModelPickerSearch from '@/components/Dashboard/ModelPicker/ModelPickerSearch.vue';

const mountSearch = (modelValue = '') =>
  mount(ModelPickerSearch, { props: { modelValue }, attachTo: document.body });

describe('ModelPickerSearch', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an accessible searchbox showing the value', () => {
    const input = mountSearch('flux').get('[data-testid="model-search-input"]');
    expect(input.attributes('role')).toBe('searchbox');
    expect(input.attributes('aria-label')).toBe('Search models');
    expect((input.element as HTMLInputElement).value).toBe('flux');
  });

  it('emits update:modelValue as the user types', async () => {
    const wrapper = mountSearch();
    await wrapper.get('[data-testid="model-search-input"]').setValue('sdxl');
    expect(wrapper.emitted('update:modelValue')).toEqual([['sdxl']]);
  });

  it('hides the clear button when empty and shows it with a value', () => {
    expect(mountSearch().find('[data-testid="model-search-clear"]').exists()).toBe(false);
    expect(mountSearch('x').find('[data-testid="model-search-clear"]').exists()).toBe(true);
  });

  it('clear emits an empty value and refocuses the input', async () => {
    const wrapper = mountSearch('flux');
    await wrapper.get('[data-testid="model-search-clear"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(document.activeElement).toBe(wrapper.get('input').element);
  });

  it('exposes focus() that focuses the input', () => {
    const wrapper = mountSearch();
    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(wrapper.get('input').element);
  });
});
