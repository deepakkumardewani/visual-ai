import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const smAndUpRef = vi.hoisted(() => ({ value: true }));

vi.mock('vue-clerk', () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>();
  return {
    ...actual,
    useMediaQuery: () => smAndUpRef,
  };
});

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import CreditsChip from '@/components/Header/CreditsChip.vue';
import { useUserStore } from '@/stores/user';

describe('CreditsChip', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    smAndUpRef.value = true;
  });

  it('renders live credit count in a compact pill', () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore = useUserStore();
    userStore.credits = 42;

    const wrapper = mount(CreditsChip, {
      global: {
        plugins: [pinia],
        stubs: {
          AnimatedCounter: {
            props: ['number'],
            template: '<span data-testid="credit-count">{{ number }}</span>',
          },
          'font-awesome-icon': true,
        },
      },
    });

    expect(wrapper.find('[data-testid="credits-chip"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="credit-count"]').text()).toBe('42');
    expect(wrapper.get('[data-testid="credits-chip"]').classes().join(' ')).toContain(
      'tw-rounded-full',
    );
  });

  it('meets 44px minimum touch target', () => {
    const wrapper = mount(CreditsChip, {
      global: {
        stubs: {
          AnimatedCounter: true,
          'font-awesome-icon': true,
        },
      },
    });

    expect(wrapper.get('[data-testid="credits-chip"]').classes().join(' ')).toContain(
      'tw-min-h-11',
    );
  });

  it('opens credits menu on click for mobile', async () => {
    smAndUpRef.value = false;

    const wrapper = mount(CreditsChip, {
      global: {
        stubs: {
          AnimatedCounter: {
            props: ['number'],
            template: '<span>{{ number }}</span>',
          },
          'font-awesome-icon': true,
        },
      },
    });

    expect(wrapper.find('[data-testid="credits-chip-menu"]').exists()).toBe(false);
    await wrapper.get('[data-testid="credits-chip"]').trigger('click');
    expect(wrapper.find('[data-testid="credits-chip-menu"]').exists()).toBe(true);
  });

  it('marks a low balance and opens buy credits from the menu', async () => {
    const userStore = useUserStore();
    userStore.credits = 1;
    userStore.dailyCredits = 1;
    const { useDialogStore } = await import('@/stores/dialog');
    const dialogStore = useDialogStore();

    const wrapper = mount(CreditsChip, {
      global: {
        stubs: {
          AnimatedCounter: { props: ['number', 'animate'], template: '<span>{{ number }}</span>' },
          'font-awesome-icon': true,
        },
      },
    });

    expect(wrapper.get('[data-testid="credits-chip"]').classes().join(' ')).toContain(
      'credits-chip__trigger--low',
    );
    await wrapper.get('[data-testid="credits-chip"]').trigger('click');
    await wrapper.find('.credits-chip__cta').trigger('click');
    expect(dialogStore.showBuyCreditsDialog).toBe(true);
    expect(wrapper.find('[data-testid="credits-chip-menu"]').exists()).toBe(false);
  });

  it('does not mark a zero balance as low', () => {
    const userStore = useUserStore();
    userStore.credits = 0;
    userStore.dailyCredits = 0;
    const wrapper = mount(CreditsChip, {
      global: { stubs: { AnimatedCounter: true, 'font-awesome-icon': true } },
    });
    expect(wrapper.get('[data-testid="credits-chip"]').classes().join(' ')).not.toContain(
      'credits-chip__trigger--low',
    );
  });
});
