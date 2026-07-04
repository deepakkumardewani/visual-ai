import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("tailwind design tokens", () => {
  const configPath = resolve(process.cwd(), "tailwind.config.js");
  const configSource = readFileSync(configPath, "utf8");

  const requiredTokens = [
    "canvas",
    "surface",
    "ink",
    "accent",
    "gold",
    "borderRadius",
    "boxShadow",
    "transitionDuration",
    "transitionTimingFunction",
    "backgroundImage",
    "canvas-light",
    "surface-light",
    "accent-subtle",
    "gradient-gold",
    "gold-glow",
    "duration-fast",
    "out-expo",
  ];

  it.each(requiredTokens)("includes %s token definitions", (token) => {
    expect(configSource).toContain(token);
  });
});
