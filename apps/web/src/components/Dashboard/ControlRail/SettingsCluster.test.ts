import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const pushMock = vi.fn();

vi.mock("vue-clerk", () => ({
  useUser: () => ({ user: ref(null) }),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import SettingsCluster from "@/components/Dashboard/ControlRail/SettingsCluster.vue";
import { useAsideStore } from "@/stores/aside";
import { useUserStore } from "@/stores/user";
import { ASPECT_RATIOS, FLUX_MODES, IMAGE_FORMATS, MODEL_IDS } from "@/utils/constants";

describe("SettingsCluster", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    pushMock.mockClear();
  });

  it("mounts without v-* components and binds store defaults", () => {
    const wrapper = mount(SettingsCluster);
    const store = useAsideStore();

    expect(wrapper.find('[data-testid="settings-cluster"]').exists()).toBe(true);
    expect(wrapper.html()).not.toMatch(/<v-select/i);
    expect(wrapper.html()).not.toMatch(/<v-btn-toggle/i);
    expect(store.aspectRatio.title).toBe(ASPECT_RATIOS[0].title);
    expect(store.imageFormat.title).toBe(IMAGE_FORMATS[0].title);
    expect(store.noOfOutputs).toBe(1);
  });

  it("redirects non-pro users selecting pro aspect ratio to pricing", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.isPro = false;

    const wrapper = mount(SettingsCluster, {
      global: { plugins: [pinia] },
    });
    const store = useAsideStore();

    const proRatio = ASPECT_RATIOS.find((ratio) => ratio.isPro)!;
    const buttons = wrapper.findAll('[role="radio"]');
    const proButton = buttons.find((button) => button.text() === proRatio.title);
    await proButton!.trigger("click");

    expect(store.aspectRatio.title).toBe(ASPECT_RATIOS[0].title);
    expect(pushMock).toHaveBeenCalledWith("/pricing");
  });

  it("allows pro users to select pro format", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const userStore = useUserStore();
    userStore.isPro = true;

    const wrapper = mount(SettingsCluster, {
      global: { plugins: [pinia] },
    });
    const store = useAsideStore();

    const pngButton = wrapper.findAll('[role="radio"]').find((button) => button.text() === "PNG");
    await pngButton!.trigger("click");

    expect(store.imageFormat.title).toBe("PNG");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("steps variations 1 → 2 and blocks pro flux models", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(SettingsCluster, {
      global: { plugins: [pinia] },
    });
    const store = useAsideStore();

    await wrapper.get('[aria-label="Increase variations"]').trigger("click");
    expect(store.noOfOutputs).toBe(2);

    store.mode = FLUX_MODES.find((mode) => mode.id === MODEL_IDS.FLUX_PRO)!;
    await wrapper.vm.$nextTick();

    const increase = wrapper.get('[aria-label="Increase variations"]');
    expect(increase.attributes("disabled")).toBeDefined();
  });
});
