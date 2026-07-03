import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import ModelOption from "@/components/Dashboard/ControlRail/ModelOption.vue";
import { FLUX_MODES } from "@/utils/models";

describe("ModelOption", () => {
  it("renders model name, description, tier badge, and provider icon", () => {
    const model = FLUX_MODES[2];
    const wrapper = mount(ModelOption, { props: { model } });

    expect(wrapper.text()).toContain(model.title);
    expect(wrapper.text()).toContain(model.description);
    expect(wrapper.text()).toContain("Premium");
    expect(wrapper.find('[role="img"]').exists()).toBe(true);
  });

  it("shows best-at and price when provided", () => {
    const model = FLUX_MODES[0];
    const wrapper = mount(ModelOption, { props: { model } });

    expect(wrapper.text()).toContain(model.bestAt!);
    expect(wrapper.text()).toContain("/img");
  });

  it("emits select on click", async () => {
    const wrapper = mount(ModelOption, { props: { model: FLUX_MODES[0] } });
    await wrapper.get('[data-testid="model-option"]').trigger("click");
    expect(wrapper.emitted("select")).toHaveLength(1);
  });
});
