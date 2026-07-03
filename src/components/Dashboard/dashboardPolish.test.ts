import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const dashboardRoot = join(process.cwd(), "src/components/Dashboard");

function collectVueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectVueFiles(fullPath);
    if (entry.name.endsWith(".vue")) return [fullPath];
    return [];
  });
}

describe("Dashboard polish audit", () => {
  it("uses no Vuetify presentational components in Dashboard subtree", () => {
    const files = collectVueFiles(dashboardRoot);

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/<v-[a-z]/i);
    }
  });
});
