import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["src/**/*.test.ts"],
        setupFiles: ["dotenv/config"],
        coverage: {
            provider: "istanbul",
            include: ["src/**/*.ts"],
            exclude: ["**/*.test.ts", "src/types/**"],
            reporter: ["text", "json-summary"],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 90,
                statements: 90,
            },
        },
    },
})
