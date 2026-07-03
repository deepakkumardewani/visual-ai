import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const xsRef = ref(false);

vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/dashboard" }),
}));

vi.mock("vuetify", () => ({
  useDisplay: () => ({ xs: xsRef }),
  useTheme: () => ({
    global: { name: { value: "dark" } },
  }),
}));

vi.mock("vue-clerk", () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock("@/components/Dashboard/ControlRail/ControlRail.vue", () => ({
  default: { template: '<div data-testid="control-rail-stub" />' },
}));

vi.mock("@/components/Dialogs/BuyMoreCreditsDialog.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("@/components/Dialogs/LowCreditsDialog.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("@/components/Dashboard/Canvas/ResultCanvas.vue", () => ({
  default: { template: '<div data-testid="result-canvas-stub" />' },
}));

vi.mock("@/components/History/History.vue", () => ({
  default: { template: '<div data-testid="history-stub">History</div>' },
}));

vi.mock("@/components/Header/Tabs.vue", () => ({
  default: { template: '<div data-testid="tabs-stub">Tabs</div>' },
}));

import Dashboard from "@/pages/Dashboard.vue";
import { useAppStore } from "@/stores/app";

describe("Dashboard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    xsRef.value = false;
  });

  const panelIsShown = (wrapper: ReturnType<typeof mount>, testId: string) => {
    const style = wrapper.get(`[data-testid="${testId}"]`).attributes("style") ?? "";
    return !style.includes("display: none");
  };

  it("shows generate panel when tab is 1 and history when tab is 2", async () => {
    const wrapper = mount(Dashboard, {
      global: {
        stubs: {
          DashboardShell: {
            template:
              '<div data-testid="dashboard-shell-stub"><slot name="rail" /><slot name="canvas" /></div>',
          },
        },
      },
    });

    const store = useAppStore();

    store.tab = 1;
    await wrapper.vm.$nextTick();
    expect(panelIsShown(wrapper, "dashboard-generate-panel")).toBe(true);
    expect(panelIsShown(wrapper, "dashboard-history-panel")).toBe(false);

    store.tab = 2;
    await wrapper.vm.$nextTick();
    expect(panelIsShown(wrapper, "dashboard-generate-panel")).toBe(false);
    expect(panelIsShown(wrapper, "dashboard-history-panel")).toBe(true);
    expect(wrapper.get('[data-testid="history-stub"]').exists()).toBe(true);
  });

  it("shows mobile tab bar only on xs viewports at /dashboard", async () => {
    xsRef.value = true;

    const wrapper = mount(Dashboard, {
      global: {
        stubs: {
          DashboardShell: true,
        },
      },
    });

    expect(wrapper.get('[data-testid="dashboard-mobile-tabs"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="tabs-stub"]').exists()).toBe(true);
  });

  it("does not render v-tabs-window or v-divider", () => {
    const wrapper = mount(Dashboard, {
      global: {
        stubs: {
          DashboardShell: true,
        },
      },
    });

    expect(wrapper.html()).not.toMatch(/<v-tabs-window/i);
    expect(wrapper.html()).not.toMatch(/<v-divider/i);
  });
});
