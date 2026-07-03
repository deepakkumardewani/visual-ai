import { computed } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reducedMotionRef = vi.hoisted(() => ({ value: false }));

vi.mock("@/composables/useReducedMotion", () => ({
  useReducedMotion: () => computed(() => reducedMotionRef.value),
}));

import { useDashboardMotion } from "@/composables/useDashboardMotion";

describe("useDashboardMotion", () => {
  beforeEach(() => {
    reducedMotionRef.value = false;
  });

  it("returns transform-based press feedback when motion is allowed", () => {
    const motion = useDashboardMotion();

    expect(motion.pressable.value).toContain("active:tw-scale-[0.98]");
    expect(motion.chevronTransition.value).toContain("tw-transition-transform");
    expect(motion.imageHoverZoom.value).toContain("group-hover:tw-scale-[1.02]");
  });

  it("falls back to static feedback when reduced motion is preferred", () => {
    reducedMotionRef.value = true;
    const motion = useDashboardMotion();

    expect(motion.reducedMotion.value).toBe(true);
    expect(motion.pressable.value).toContain("active:tw-opacity-90");
    expect(motion.pressable.value).not.toContain("active:tw-scale");
    expect(motion.chevronTransition.value).toBe("");
    expect(motion.imageHoverZoom.value).toBe("");
    expect(motion.cardHover.value).toBe("");
  });

  it("always keeps fast color transitions with motion-reduce guard", () => {
    const motion = useDashboardMotion();

    expect(motion.interactiveTransition.value).toContain("tw-duration-fast");
    expect(motion.interactiveTransition.value).toContain("motion-reduce:tw-transition-none");
  });
});
