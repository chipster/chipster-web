import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests, run against a full dev environment: the Angular dev
 * server on port 4200 and chipster-web-server on ports 8000-8016. Start them
 * before running the tests, see CLAUDE.md in both repositories.
 *
 * Unit tests are separate and run with Vitest, see vitest.config.mts.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4200",
    /*
     * Keep evidence of what went wrong, but only for failures, so that a
     * green run doesn't fill the disk with traces.
     */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          /*
           * The container runs as a non-root user with no-new-privileges, so
           * Chromium cannot set up its own sandbox.
           */
          args: ["--no-sandbox"],
        },
      },
    },
  ],
});
