import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const mobileRef = ref(false);
const reducedMotionRef = ref(false);
const promptTextRef = ref("");

vi.mock("vuetify", () => ({
  useDisplay: () => ({ mobile: mobileRef }),
}));

vi.mock("@/composables/useReducedMotion", () => ({
  useReducedMotion: () => reducedMotionRef,
}));

vi.mock("@/stores/generate", () => ({
  useGenerateStore: () => ({
    promptText: promptTextRef,
  }),
}));

vi.mock("@/components/Aside/Heading.vue", () => ({
  default: { props: ["title"], template: "<p>{{ title }}</p>" },
}));

vi.mock("@/components/Dashboard/ControlRail/PromptAiMenu.vue", () => ({
  default: {
    props: ["currentPrompt", "disabled"],
    emits: ["apply-prompt", "loading"],
    template: `
      <div data-testid="prompt-ai-menu-stub">
        <button data-testid="stub-apply" @click="$emit('apply-prompt', 'Typed prompt')">Apply</button>
        <button data-testid="stub-loading-on" @click="$emit('loading', true)">Load on</button>
        <button data-testid="stub-loading-off" @click="$emit('loading', false)">Load off</button>
      </div>
    `,
  },
}));

import PromptBox from "@/components/Dashboard/ControlRail/PromptBox.vue";
import { useAsideStore } from "@/stores/aside";

describe("PromptBox", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mobileRef.value = false;
    reducedMotionRef.value = false;
    promptTextRef.value = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mountBox = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    return {
      wrapper: mount(PromptBox, { global: { plugins: [pinia] } }),
      asideStore: useAsideStore(),
    };
  };

  it("renders custom textarea without v-textarea", () => {
    const { wrapper } = mountBox();
    expect(wrapper.find('[data-testid="prompt-box"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="prompt-textarea"]').exists()).toBe(true);
    expect(wrapper.find("v-textarea").exists()).toBe(false);
  });

  it("shows info tooltip button with descriptive label", () => {
    const { wrapper } = mountBox();
    const info = wrapper.get('[data-testid="prompt-info"]');
    expect(info.attributes("aria-label")).toContain("Describe style");
  });

  it("syncs typingPrompt to generateStore.promptText", async () => {
    const { wrapper, asideStore } = mountBox();
    const textarea = wrapper.get('[data-testid="prompt-textarea"]');

    await textarea.setValue("Mountain landscape at dawn");
    expect(asideStore.typingPrompt).toBe("Mountain landscape at dawn");
    expect(promptTextRef.value).toBe("Mountain landscape at dawn");
  });

  it("restores promptText on mount", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    promptTextRef.value = "Saved prompt";

    const wrapper = mount(PromptBox, { global: { plugins: [pinia] } });
    await wrapper.vm.$nextTick();

    expect(useAsideStore().typingPrompt).toBe("Saved prompt");
    expect((wrapper.find('[data-testid="prompt-textarea"]').element as HTMLTextAreaElement).value).toBe("Saved prompt");
  });

  it("reveals applied prompt with typewriter effect", async () => {
    const { wrapper, asideStore } = mountBox();

    await wrapper.get('[data-testid="stub-apply"]').trigger("click");

    for (let i = 0; i < "Typed prompt".length; i++) {
      await vi.advanceTimersByTimeAsync(5);
    }

    expect(asideStore.typingPrompt).toBe("Typed prompt");
  });

  it("applies prompt immediately when reduced motion is preferred", async () => {
    reducedMotionRef.value = true;
    const { wrapper, asideStore } = mountBox();

    await wrapper.get('[data-testid="stub-apply"]').trigger("click");
    expect(asideStore.typingPrompt).toBe("Typed prompt");
  });

  it("clears prompt via clear button", async () => {
    const { wrapper, asideStore } = mountBox();
    const textarea = wrapper.get('[data-testid="prompt-textarea"]');

    await textarea.setValue("To clear");
    await wrapper.get('[data-testid="prompt-clear"]').trigger("click");

    expect(asideStore.typingPrompt).toBe("");
  });
});
