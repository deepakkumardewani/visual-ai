import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import GenerateButton from '@/components/Dashboard/ControlRail/GenerateButton.vue';

describe('GenerateButton', () => {
  it('uses amber baseline styling when not premium', () => {
    const wrapper = mount(GenerateButton, {
      props: { disabled: false, premium: false },
    });

    const button = wrapper.get('[data-testid="generate-button"]');
    expect(button.text()).toContain('Generate');
    expect(button.classes().join(' ')).toContain('tw-bg-accent');
    expect(button.classes().join(' ')).toContain('tw-shadow-accent');
    expect(button.attributes('data-premium-cue')).toBeUndefined();
    expect(wrapper.html()).not.toMatch(/<v-[a-z]/i);
  });

  it('uses gold glow styling when premium', () => {
    const wrapper = mount(GenerateButton, {
      props: { disabled: false, premium: true },
    });

    const button = wrapper.get('[data-testid="generate-button"]');
    expect(button.classes().join(' ')).toContain('tw-shadow-gold-glow');
    expect(button.classes().join(' ')).toContain('tw-bg-gradient-gold');
    expect(button.attributes('data-premium-cue')).toBe('true');
  });

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(GenerateButton, {
      props: { disabled: true },
    });

    expect(wrapper.get('[data-testid="generate-button"]').attributes('disabled')).toBeDefined();
  });

  it('shows loading affordance when loading', () => {
    const wrapper = mount(GenerateButton, {
      props: { disabled: true, loading: true },
    });

    expect(wrapper.find('[data-testid="generate-button-spinner"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Generating…');
  });

  it('emits click when enabled', async () => {
    const wrapper = mount(GenerateButton, {
      props: { disabled: false },
    });

    await wrapper.get('[data-testid="generate-button"]').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
