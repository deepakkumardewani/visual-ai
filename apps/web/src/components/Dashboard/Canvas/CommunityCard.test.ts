import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CommunityCard from "@/components/Dashboard/Canvas/CommunityCard.vue";
import type { CommunityFeedItem } from "@/utils/communityMock";

const sampleItem: CommunityFeedItem = {
  id: "test-001",
  imageUrl: "https://example.com/image.jpg",
  author: "test_artist",
  likes: 128,
  prompt: "A test prompt for remixing.",
  aspectRatio: "4:5",
};

describe("CommunityCard", () => {
  it("mounts with image, author, likes, and remix button", () => {
    const wrapper = mount(CommunityCard, {
      props: { item: sampleItem },
    });

    const card = wrapper.get('[data-testid="community-card"]');
    const image = card.get("img");

    expect(image.attributes("src")).toBe(sampleItem.imageUrl);
    expect(image.attributes("loading")).toBe("lazy");
    expect(image.attributes("alt")).toContain(sampleItem.author);
    expect(card.text()).toContain(sampleItem.author);
    expect(card.text()).toContain("128");
    expect(wrapper.get('[data-testid="community-remix-button"]').text()).toContain("Remix");
    expect(wrapper.get('[data-testid="community-remix-button"]').attributes("aria-label")).toBe(
      "Remix prompt by test_artist",
    );
  });

  it("emits remix with the item prompt", async () => {
    const wrapper = mount(CommunityCard, {
      props: { item: sampleItem },
    });

    await wrapper.get('[data-testid="community-remix-button"]').trigger("click");

    expect(wrapper.emitted("remix")).toEqual([[sampleItem.prompt]]);
  });
});
