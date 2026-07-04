import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DashboardShell from '@/components/Dashboard/DashboardShell.vue';

describe('DashboardShell', () => {
  it('mounts rail and canvas slots', () => {
    const wrapper = mount(DashboardShell, {
      slots: {
        rail: '<div data-testid="rail-content">Rail</div>',
        canvas: '<div data-testid="canvas-content">Canvas</div>',
      },
    });

    expect(wrapper.get('[data-testid="rail-content"]').text()).toBe('Rail');
    expect(wrapper.get('[data-testid="canvas-content"]').text()).toBe('Canvas');
  });

  it('uses design tokens and contains no v-* components in its own markup', () => {
    const wrapper = mount(DashboardShell, {
      slots: {
        rail: 'rail',
        canvas: 'canvas',
      },
    });

    const shell = wrapper.get('[data-testid="dashboard-shell"]');
    const rail = wrapper.get('[data-testid="dashboard-rail"]');
    const canvas = wrapper.get('[data-testid="dashboard-canvas"]');

    expect(shell.classes().join(' ')).toContain('tw-bg-canvas');
    expect(rail.classes().join(' ')).toContain('tw-bg-surface-1');
    expect(rail.classes().join(' ')).toContain('tw-border-hairline');
    expect(canvas.classes().join(' ')).toContain('tw-bg-canvas');
    expect(wrapper.html()).not.toMatch(/<v-[a-z]/i);
  });
});
