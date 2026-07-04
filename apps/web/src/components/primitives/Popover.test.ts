import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import Popover from "@/components/primitives/Popover.vue";

describe("Popover", () => {
  it("opens and closes via trigger click", async () => {
    const wrapper = mount(Popover, {
      slots: {
        trigger: "<span>Open</span>",
        default: "<p>Panel</p>",
      },
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await wrapper.get("button").trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    await wrapper.get("button").trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("opens via Enter key and closes via Escape", async () => {
    const wrapper = mount(Popover, {
      slots: {
        trigger: "<span>Open</span>",
        default: "<button type='button'>Inside</button>",
      },
    });

    const trigger = wrapper.get("button");
    await trigger.trigger("keydown", { key: "Enter" });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    await wrapper.find('[role="dialog"]').trigger("keydown", { key: "Escape" });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("moves focus with arrow keys inside the panel", async () => {
    const wrapper = mount(Popover, {
      attachTo: document.body,
      slots: {
        trigger: "<span>Open</span>",
        default: `
          <button type="button" data-testid="first">First</button>
          <button type="button" data-testid="second">Second</button>
        `,
      },
    });

    await wrapper.get("button").trigger("click");

    const first = wrapper.get('[data-testid="first"]').element as HTMLButtonElement;
    const second = wrapper.get('[data-testid="second"]').element as HTMLButtonElement;

    expect(document.activeElement).toBe(first);

    await wrapper.find('[role="dialog"]').trigger("keydown", { key: "ArrowDown" });
    expect(document.activeElement).toBe(second);

    await wrapper.find('[role="dialog"]').trigger("keydown", { key: "ArrowUp" });
    expect(document.activeElement).toBe(first);

    wrapper.unmount();
  });

  it("shows focus-visible outline class on trigger", () => {
    const wrapper = mount(Popover, {
      slots: { trigger: "<span>Open</span>" },
    });

    expect(wrapper.get("button").classes().join(" ")).toContain("focus-visible:tw-outline-accent");
  });
});
