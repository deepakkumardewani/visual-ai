import type { TtsDoc } from '@visual-ai/shared';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TextAdvisor from '@/components/Speech/TextAdvisor.vue';

const LIMIT = 100;
const doc: TtsDoc = [{ type: 'text', text: 'one two three four five' }];

function mountAdvisor(props: { chars: number; estimated?: boolean; doc?: TtsDoc }) {
  return mount(TextAdvisor, {
    props: {
      doc: props.doc ?? doc,
      chars: props.chars,
      limit: LIMIT,
      estimated: props.estimated ?? false,
      modelLabel: 'Inworld TTS 2.0',
    },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

describe('TextAdvisor', () => {
  it('shows the spoken length and the FAQ link with no warning when well under the limit', () => {
    const wrapper = mountAdvisor({ chars: 10 });
    expect(wrapper.get('[data-testid="advisor-length"]').text()).toContain('2 s');
    expect(wrapper.find('[data-testid="advisor-warning"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="advisor-split"]').exists()).toBe(false);
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/faqs');
  });

  it('warns with the remaining characters near the limit and suggests splitting', () => {
    const wrapper = mountAdvisor({ chars: 95 });
    const warning = wrapper.get('[data-testid="advisor-warning"]');
    expect(warning.text()).toBe('5 characters left for Inworld TTS 2.0.');
    expect(warning.classes()).not.toContain('advisor-warning--over');
    expect(wrapper.get('[data-testid="advisor-split"]').text()).toContain('Split');
  });

  it('flags the overage and points to the disabled reason when over the limit', () => {
    const wrapper = mountAdvisor({ chars: 130 });
    const warning = wrapper.get('[data-testid="advisor-warning"]');
    expect(warning.text()).toBe(
      'Over the Inworld TTS 2.0 limit by 30 characters. See the reason beside Generate.',
    );
    expect(warning.classes()).toContain('advisor-warning--over');
    expect(wrapper.find('[data-testid="advisor-split"]').exists()).toBe(true);
  });

  it('shows the estimate note only for estimated costs', async () => {
    const wrapper = mountAdvisor({ chars: 10, estimated: true });
    expect(wrapper.get('[data-testid="advisor-estimate"]').text()).toContain('Estimated');
    await wrapper.setProps({ estimated: false });
    expect(wrapper.find('[data-testid="advisor-estimate"]').exists()).toBe(false);
  });

  it('adds pause seconds to the spoken length estimate', () => {
    const wrapper = mountAdvisor({
      chars: 10,
      doc: [
        { type: 'text', text: 'one two' },
        { type: 'pause', seconds: 70 },
      ],
    });
    expect(wrapper.get('[data-testid="advisor-length"]').text()).toContain('1 min 11 s');
  });
});
