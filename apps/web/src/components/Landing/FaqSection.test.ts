import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const gsap = vi.hoisted(() => ({
  registerPlugin: vi.fn(),
  set: vi.fn(),
  to: vi.fn(() => ({ kill: vi.fn(), scrollTrigger: { kill: vi.fn() } })),
}));

vi.mock('gsap', () => ({ gsap }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));

import FaqSection from '@/components/Landing/FaqSection.vue';
import { REVEAL_SCROLLER_KEY, vReveal } from '@/directives/reveal';
import { FAQS as FALLBACK_FAQS } from '@/utils/landing';

const FAQS = [
  { question: 'Are credits free?', answer: 'Yes, daily credits refresh.' },
  { question: 'Can I buy more?', answer: 'Yes, from Pricing.' },
];

type RevealConfig = { delay: number; scrollTrigger: { scroller?: unknown; trigger: Element } };

const revealConfigs = () =>
  gsap.to.mock.calls.map((call) => (call as unknown[])[1] as RevealConfig);

describe('FaqSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  it('renders the heading and questions', () => {
    const wrapper = mount(FaqSection, {
      props: { heading: 'Questions people ask', faqs: FAQS },
    });
    expect(wrapper.text()).toContain('Questions people ask');
    expect(wrapper.text()).toContain('Are credits free?');
    expect(wrapper.text()).toContain('Can I buy more?');
  });

  it('opens the first item, switches on click and collapses on a second click', async () => {
    const wrapper = mount(FaqSection, { props: { faqs: FAQS } });
    const buttons = wrapper.findAll('.faq__q');
    const expanded = () => buttons.map((b) => b.attributes('aria-expanded'));

    expect(expanded()).toEqual(['true', 'false']);
    await buttons[1]!.trigger('click');
    expect(expanded()).toEqual(['false', 'true']);
    await buttons[1]!.trigger('click');
    expect(expanded()).toEqual(['false', 'false']);
  });

  it('falls back to the landing FAQs and default heading', () => {
    const wrapper = mount(FaqSection);
    expect(wrapper.findAll('.faq__item')).toHaveLength(FALLBACK_FAQS.length);
    expect(wrapper.find('.faq__title').text()).toBe('Good to know.');
  });

  it('uses the centered variant classes when requested', () => {
    const plain = mount(FaqSection, { props: { faqs: FAQS } });
    const centered = mount(FaqSection, { props: { faqs: FAQS, centered: true } });
    expect(plain.classes()).not.toContain('faq--centered');
    expect(plain.find('p').classes()).toContain('eyebrow');
    expect(centered.classes()).toContain('faq--centered');
    expect(centered.find('p').classes()).toContain('home-eyebrow');
  });

  describe('reveal scroller', () => {
    it('tracks the surrounding modal panel for the heading and every item', () => {
      const panel = document.createElement('div');
      const wrapper = mount(FaqSection, {
        props: { heading: 'Before you buy.', faqs: FAQS },
        global: {
          directives: { reveal: vReveal },
          provide: { [REVEAL_SCROLLER_KEY as symbol]: ref(panel) },
        },
      });

      const configs = revealConfigs();
      // eyebrow + title + one per question
      expect(configs).toHaveLength(2 + FAQS.length);
      expect(configs.every((c) => c.scrollTrigger.scroller === panel)).toBe(true);
      wrapper.unmount();
    });

    it('keeps the window scroller outside a modal and staggers items', () => {
      mount(FaqSection, {
        props: { faqs: FAQS },
        global: { directives: { reveal: vReveal } },
      });

      const configs = revealConfigs();
      expect(configs).toHaveLength(2 + FAQS.length);
      expect(configs.every((c) => c.scrollTrigger.scroller === undefined)).toBe(true);
      expect(configs.map((c) => c.delay)).toEqual([0, 0.05, 0, 0.05]);
    });
  });
});
