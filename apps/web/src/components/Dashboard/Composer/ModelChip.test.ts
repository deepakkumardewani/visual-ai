import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ModelChip from "@/components/Dashboard/Composer/ModelChip.vue";
import { FLUX_MODES } from "@/utils/models";

describe("ModelChip", () => {
  it("renders model name with provider icon slot", () => {
    const wrapper = mount(ModelChip, {
      props: { model: FLUX_MODES[0], open: false },
    });

    expect(wrapper.get('[data-testid="model-chip"]').text()).toContain(FLUX_MODES[0].title);
    expect(wrapper.html()).not.toMatch(/<v-/i);
  });
});
