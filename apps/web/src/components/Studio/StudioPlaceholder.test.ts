import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import StudioPlaceholder from '@/components/Studio/StudioPlaceholder.vue';
import { APP_SURFACE } from '@/utils/dashboardRoutes';

const RouterLinkStub = defineComponent({
  props: { to: { type: Object, required: true } },
  setup:
    (props, { slots }) =>
    () =>
      h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.()),
});

function mountPlaceholder(label = 'Song', studio: 'song' | 'tools' = 'song') {
  return mount(StudioPlaceholder, {
    props: { studio, label },
    global: { stubs: { 'router-link': RouterLinkStub } },
  });
}

describe('StudioPlaceholder', () => {
  it('says the studio is coming soon with an honest note that nothing costs credits', () => {
    const wrapper = mountPlaceholder('Song');

    expect(wrapper.get('h1').text()).toBe('Song studio is coming soon');
    expect(wrapper.text()).toContain('Nothing here costs credits yet');
  });

  it('links back to Image', () => {
    const link = mountPlaceholder().get('[data-testid="studio-placeholder-back"]');

    expect(link.text()).toBe('Back to Image');
    expect(JSON.parse(link.attributes('data-to')!)).toEqual({ name: APP_SURFACE.CREATE });
  });

  it('scopes the accent to the given studio', () => {
    const wrapper = mountPlaceholder('Tools', 'tools');

    expect(wrapper.get('[data-testid="studio-shell"]').attributes('data-studio')).toBe('tools');
    expect(wrapper.get('h1').text()).toBe('Tools studio is coming soon');
  });
});
