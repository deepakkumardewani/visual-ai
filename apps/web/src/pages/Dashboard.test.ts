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

vi.mock("@/components/Dashboard/DashboardShell.vue", () => ({
  default: {
    template:
      '<div data-testid="dashboard-shell-stub"><slot name="rail" /><slot name="canvas" /></div>',
  },
}));

vi.mock("@/components/Dashboard/Sidebar/DashboardSidebar.vue", () => ({
  default: { template: '<div data-testid="dashboard-sidebar-stub" />' },
}));

vi.mock("@/components/Dashboard/Composer/PromptBar.vue", () => ({
  default: { template: '<div data-testid="prompt-bar-stub" />' },
}));

vi.mock("@/components/Dashboard/Canvas/ResultCanvas.vue", () => ({
  default: { template: '<div data-testid="result-canvas-stub" />' },
}));

vi.mock("@/components/Dialogs/SignupDialog.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("@/components/Dialogs/BuyMoreCreditsDialog.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("@/components/Dialogs/LowCreditsDialog.vue", () => ({
  default: { template: "<div />" },
}));

vi.mock("@/components/History/History.vue", () => ({
  default: { template: '<div data-testid="history-stub">History</div>' },
}));

vi.mock("@/components/Header/NavTabs.vue", () => ({
  default: { template: '<div data-testid="nav-tabs-stub">NavTabs</div>' },
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

  it("shows two-column create layout with sidebar, prompt bar, and canvas", async () => {
    const wrapper = mount(Dashboard);
    const store = useAppStore();

    store.tab = 1;
    await wrapper.vm.$nextTick();

    expect(panelIsShown(wrapper, "dashboard-generate-panel")).toBe(true);
    expect(wrapper.find('[data-testid="dashboard-shell-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dashboard-sidebar-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="prompt-bar-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="result-canvas-stub"]').exists()).toBe(true);
  });

  it("shows assets panel on tab 3", async () => {
    const wrapper = mount(Dashboard);
    const store = useAppStore();

    store.tab = 3;
    await wrapper.vm.$nextTick();

    expect(panelIsShown(wrapper, "dashboard-generate-panel")).toBe(false);
    expect(panelIsShown(wrapper, "dashboard-assets-panel")).toBe(true);
    expect(wrapper.find('[data-testid="history-stub"]').exists()).toBe(true);
  });

  it("shows mobile nav tab strip only on xs viewports at /dashboard", async () => {
    xsRef.value = true;

    const wrapper = mount(Dashboard);

    expect(wrapper.find('[data-testid="dashboard-mobile-tabs"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="nav-tabs-stub"]').exists()).toBe(true);
  });

  it("does not render v-tabs-window or v-divider", () => {
    const wrapper = mount(Dashboard);

    expect(wrapper.html()).not.toMatch(/<v-tabs-window/i);
    expect(wrapper.html()).not.toMatch(/<v-divider/i);
  });
});
