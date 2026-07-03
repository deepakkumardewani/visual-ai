import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const isLoadingRef = ref(false);
const imagesRef = ref<{ aiImageUrl?: string }[]>([]);

vi.mock("@/components/ResultColumn.vue", () => ({
  default: {
    name: "ResultColumn",
    template: '<div data-testid="result-column-stub">Results</div>',
  },
}));

vi.mock("@/components/Dashboard/Canvas/CommunityFeed.vue", () => ({
  default: {
    name: "CommunityFeed",
    template: '<div data-testid="community-feed-stub">Feed</div>',
  },
}));

vi.mock("@/stores/generate", () => ({
  useGenerateStore: () => ({
    isLoading: isLoadingRef,
    images: imagesRef,
  }),
}));

import ResultCanvas from "@/components/Dashboard/Canvas/ResultCanvas.vue";

describe("ResultCanvas", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isLoadingRef.value = false;
    imagesRef.value = [];
  });

  it("shows community feed when idle", () => {
    const wrapper = mount(ResultCanvas);

    expect(wrapper.get('[data-testid="result-canvas"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="community-feed-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="result-column-stub"]').exists()).toBe(false);
  });

  it("shows results while loading", () => {
    isLoadingRef.value = true;

    const wrapper = mount(ResultCanvas);

    expect(wrapper.get('[data-testid="result-column-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="community-feed-stub"]').exists()).toBe(false);
  });

  it("shows results when images are available", () => {
    imagesRef.value = [{ aiImageUrl: "https://example.com/generated.jpg" }];

    const wrapper = mount(ResultCanvas);

    expect(wrapper.get('[data-testid="result-column-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="community-feed-stub"]').exists()).toBe(false);
  });
});
