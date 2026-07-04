import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ComposerChip from "@/components/Dashboard/Composer/ComposerChip.vue";

describe("ComposerChip", () => {
  it("renders label and chevron", () => {
    const wrapper = mount(ComposerChip, {
      props: { label: "16:9", open: false },
    });

    expect(wrapper.get('[data-testid="composer-chip"]').text()).toContain("16:9");
    expect(wrapper.html()).not.toMatch(/<v-/i);
  });

  it("rotates chevron when open", () => {
    const wrapper = mount(ComposerChip, {
      props: { label: "SD", open: true },
    });

    expect(wrapper.get('[data-testid="composer-chip"]').classes().join(" ")).toContain(
      "tw-border-accent/50",
    );
  });
});
