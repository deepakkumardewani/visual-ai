import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ModelCompanyHeader from '@/components/Dashboard/ModelPicker/ModelCompanyHeader.vue';
import { FLUX_MODES } from '@/utils/models';

const HEADER = '[data-testid="model-company-header"]';
const withLogo = FLUX_MODES[2];

describe('ModelCompanyHeader', () => {
  it('renders the company name and its logo from the first model', () => {
    const wrapper = mount(ModelCompanyHeader, {
      props: { company: 'Black Forest Labs', models: [withLogo] },
    });
    expect(wrapper.get(HEADER).text()).toBe('Black Forest Labs');
    const img = wrapper.get('img');
    expect(img.attributes('alt')).toBe('Black Forest Labs logo');
    expect(img.attributes('src')).toBeTruthy();
  });

  it('exposes the company name as a title for truncated text', () => {
    const wrapper = mount(ModelCompanyHeader, {
      props: { company: 'Black Forest Labs', models: [withLogo] },
    });
    expect(wrapper.get('span[title]').attributes('title')).toBe('Black Forest Labs');
  });

  it('falls back to the provider icon when the first model has no logo', () => {
    const model = { ...withLogo, iconUrl: undefined };
    const wrapper = mount(ModelCompanyHeader, { props: { company: 'Acme', models: [model] } });
    expect(wrapper.find('img[alt="Acme logo"]').exists()).toBe(false);
    expect(wrapper.get(HEADER).text()).toBe('Acme');
    expect(wrapper.findComponent({ name: 'ProviderIcon' }).props('provider')).toBe(model.provider);
  });

  it('renders only the name when there are no models', () => {
    const wrapper = mount(ModelCompanyHeader, { props: { company: 'Empty', models: [] } });
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'ProviderIcon' }).exists()).toBe(false);
    expect(wrapper.get(HEADER).text()).toBe('Empty');
  });
});
