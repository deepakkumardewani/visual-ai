import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NotFound from '@/pages/NotFound.vue';

const { usePageSeoMock } = vi.hoisted(() => ({ usePageSeoMock: vi.fn() }));

vi.mock('@/composables/usePageSeo', () => ({ usePageSeo: usePageSeoMock }));
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/no/such/page' }) }));

function mountPage() {
  return mount(NotFound, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  });
}

describe('NotFound', () => {
  beforeEach(() => {
    usePageSeoMock.mockClear();
  });

  it('renders the heading and the requested path', () => {
    const wrapper = mountPage();
    expect(wrapper.get('h1').text()).toBe('Nothing rendered here.');
    expect(wrapper.text()).toContain('/no/such/page');
  });

  it('offers the studio and home as primary ways out', () => {
    const hrefs = mountPage()
      .findAll('a')
      .map((link) => link.attributes('href'));
    expect(hrefs).toContain('/create');
    expect(hrefs).toContain('/');
  });

  it('hides the decorative frame from assistive tech', () => {
    expect(mountPage().get('figure').attributes('aria-hidden')).toBe('true');
  });

  it('sets a noindex page title via usePageSeo', () => {
    mountPage();
    expect(usePageSeoMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Page not found – Visual AI', robots: 'noindex, follow' }),
    );
  });
});
