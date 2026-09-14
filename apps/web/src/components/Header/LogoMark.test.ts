import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import LogoMark from '@/components/Header/LogoMark.vue';

describe('LogoMark', () => {
  it('renders an svg at the default size', () => {
    const wrapper = mount(LogoMark);
    const svg = wrapper.get('svg');
    expect(svg.attributes('width')).toBe('34');
    expect(svg.attributes('height')).toBe('34');
    expect(svg.attributes('aria-hidden')).toBe('true');
  });

  it('applies a custom size', () => {
    const wrapper = mount(LogoMark, { props: { size: 48 } });
    expect(wrapper.get('svg').attributes('width')).toBe('48');
  });
});
