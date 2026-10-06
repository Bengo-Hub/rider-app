import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // e2e/ holds Playwright specs (pnpm test:e2e); vitest cannot run them.
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
