import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import TokenScratch from "@/components/primitives/TokenScratch.vue";

describe("TokenScratch", () => {
  it("mounts and exposes token verification surface", () => {
    const wrapper = mount(TokenScratch);
    const root = wrapper.get('[data-testid="token-scratch"]');

    expect(root.classes().join(" ")).toContain("tw-bg-canvas");
    expect(root.classes().join(" ")).toContain("tw-text-ink-primary");
    expect(wrapper.text()).toContain("Surface 1");
    expect(wrapper.text()).toContain("Gold");
    expect(wrapper.text()).toContain("Light canvas");
  });
});
