import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { ref } from "vue";

vi.mock("vue-clerk", () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock("vuetify", () => ({
  useTheme: () => ({
    global: { name: { value: "dark" } },
  }),
}));

import NavTabs from "@/components/Header/NavTabs.vue";
import { useAppStore } from "@/stores/app";

describe("NavTabs", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mountNavTabs = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    return {
      wrapper: mount(NavTabs, { global: { plugins: [pinia] } }),
      store: useAppStore(),
    };
  };

  it("renders Create, Explore, and Assets tabs", () => {
    const { wrapper } = mountNavTabs();

    expect(wrapper.get('[data-testid="nav-tab-create"]').text()).toBe("Create");
    expect(wrapper.get('[data-testid="nav-tab-explore"]').text()).toBe("Explore");
    expect(wrapper.get('[data-testid="nav-tab-assets"]').text()).toBe("Assets");
  });

  it("writes selected tab to appStore on click", async () => {
    const { wrapper, store } = mountNavTabs();

    await wrapper.get('[data-testid="nav-tab-explore"]').trigger("click");
    expect(store.tab).toBe(2);

    await wrapper.get('[data-testid="nav-tab-assets"]').trigger("click");
    expect(store.tab).toBe(3);
  });

  it("marks the active tab with aria-selected", async () => {
    const { wrapper, store } = mountNavTabs();
    store.tab = 2;
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-testid="nav-tab-explore"]').attributes("aria-selected")).toBe("true");
    expect(wrapper.get('[data-testid="nav-tab-create"]').attributes("aria-selected")).toBe("false");
  });

  it("uses 44px minimum touch targets", () => {
    const { wrapper } = mountNavTabs();
    const buttons = wrapper.findAll('[role="tab"]');

    buttons.forEach((button) => {
      expect(button.classes().join(" ")).toContain("tw-min-h-11");
    });
  });

  it("supports keyboard navigation between tabs", async () => {
    const { wrapper, store } = mountNavTabs();
    store.tab = 1;
    await wrapper.vm.$nextTick();

    const createTab = wrapper.get('[data-testid="nav-tab-create"]');
    await createTab.trigger("keydown", { key: "ArrowRight" });

    expect(store.tab).toBe(2);
  });
});
