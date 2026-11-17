import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{js,ts}"],
    environment: "node",
    // Test helpers are injected instead of imported. On Windows, importing
    // "vitest" from a terminal opened as e: (lowercase drive letter) loads a
    // second copy of the runner and every test file fails to start.
    globals: true,
  },
});
