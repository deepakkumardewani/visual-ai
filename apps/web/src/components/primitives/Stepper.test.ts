import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import Stepper from "@/components/primitives/Stepper.vue";

describe("Stepper", () => {
  it("increments and decrements within bounds", async () => {
    const wrapper = mount(Stepper, {
      props: { modelValue: 2, min: 1, max: 4 },
    });

    const [decrement, increment] = wrapper.findAll("button");

    await increment.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([3]);

    await wrapper.setProps({ modelValue: 1 });
    await decrement.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[1]).toBeUndefined();
  });

  it("clamps at max and disables increment", async () => {
    const wrapper = mount(Stepper, {
      props: { modelValue: 4, min: 1, max: 4 },
    });

    const increment = wrapper.findAll("button")[1];
    expect(increment.attributes("disabled")).toBeDefined();

    await increment.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("responds to arrow keys on spinbutton", async () => {
    const wrapper = mount(Stepper, {
      props: { modelValue: 2, min: 1, max: 4 },
    });

    const spinbutton = wrapper.find('[role="spinbutton"]');
    await spinbutton.trigger("keydown", { key: "ArrowUp" });
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([3]);

    await wrapper.setProps({ modelValue: 2 });
    await spinbutton.trigger("keydown", { key: "ArrowDown" });
    expect(wrapper.emitted("update:modelValue")?.[1]).toEqual([1]);
  });
});
