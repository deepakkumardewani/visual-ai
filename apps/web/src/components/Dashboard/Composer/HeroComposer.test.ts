import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/Dashboard/Composer/ComposerTextarea.vue", () => ({
  default: { template: '<div data-testid="composer-textarea-stub" />' },
}));

vi.mock("@/components/Dashboard/Composer/SettingsPopovers.vue", () => ({
  default: { template: '<div data-testid="settings-popovers-stub" />' },
}));

vi.mock("@/components/Dashboard/Composer/GenerateArrow.vue", () => ({
  default: { template: '<button data-testid="generate-arrow-stub" />' },
}));

vi.mock("@/components/Dashboard/ControlRail/ModelPicker.vue", () => ({
  default: { template: '<div data-testid="model-picker-stub" />' },
}));

vi.mock("@/components/Dialogs/SignupDialog.vue", () => ({
  default: { template: "<div />" },
}));

import HeroComposer from "@/components/Dashboard/Composer/HeroComposer.vue";

describe("HeroComposer", () => {
  it("renders centered composer shell with controls row", () => {
    const wrapper = mount(HeroComposer);

    expect(wrapper.find('[data-testid="hero-composer"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="composer-textarea-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="hero-composer-controls"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="model-picker-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-popovers-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="generate-arrow-stub"]').exists()).toBe(true);
  });
});
