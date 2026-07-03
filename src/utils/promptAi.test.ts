import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PROMPTS from "@/utils/prompts.json";
import REALISTIC_PROMPTS from "@/utils/realisticPrompts.json";
import { MODEL_IDS } from "@/utils/modelIds";
import { describeImage, improvePrompt, pickRandomPrompt } from "@/utils/promptAi";

describe("promptAi", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("improvePrompt", () => {
    it("returns a fallback prompt when input is empty", async () => {
      const promise = improvePrompt("   ");
      await vi.advanceTimersByTimeAsync(1200);
      const result = await promise;

      expect(result.text).toContain("cinematic portrait");
    });

    it("enhances a non-empty prompt", async () => {
      const promise = improvePrompt("A red fox in snow");
      await vi.advanceTimersByTimeAsync(1200);
      const result = await promise;

      expect(result.text).toContain("A red fox in snow");
      expect(result.text).toContain("enhanced");
    });
  });

  describe("describeImage", () => {
    it("returns a mock description derived from the file name", async () => {
      const file = new File(["pixels"], "sunset-beach.png", { type: "image/png" });
      const promise = describeImage(file);
      await vi.advanceTimersByTimeAsync(1200);
      const result = await promise;

      expect(result.text).toContain("sunset-beach");
    });
  });

  describe("pickRandomPrompt", () => {
    it("selects from realistic prompts for FLUX_REALISM", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);

      const prompt = pickRandomPrompt(MODEL_IDS.FLUX_REALISM);
      expect(prompt).toBe(REALISTIC_PROMPTS[0]);
    });

    it("selects from general prompts for other models", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);

      const prompt = pickRandomPrompt(MODEL_IDS.FLUX_BASIC);
      expect(prompt).toBe(PROMPTS[0]);
    });
  });
});
