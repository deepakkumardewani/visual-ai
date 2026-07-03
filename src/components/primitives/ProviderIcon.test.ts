import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ProviderIcon from "@/components/primitives/ProviderIcon.vue";

describe("ProviderIcon", () => {
  it("renders logo image for known providers", () => {
    const wrapper = mount(ProviderIcon, { props: { provider: "openai" } });
    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBeTruthy();
  });

  it("falls back to lettermark for unknown providers", () => {
    const wrapper = mount(ProviderIcon, { props: { provider: "unknown-co" } });
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toBe("U");
  });

  it("falls back to lettermark when image fails to load", async () => {
    const wrapper = mount(ProviderIcon, { props: { provider: "openai" } });
    await wrapper.find("img").trigger("error");
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toBe("O");
  });
});
