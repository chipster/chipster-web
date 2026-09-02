import { defineConfig, devices } from "@playwright/test";

/*
 * End-to-end tests, run against a full dev environment: the Angular dev
 * server on port 4200 and chipster-web-server on ports 8000-8016. The dev
 * server is started automatically if it isn't already running; the backend
 * has to be started by hand, see CLAUDE.md in both repositories.
 *
 * Unit tests are separate and run with Vitest, see vitest.config.mts.
 */

// set BASE_URL to run the tests against an already running deployment
const baseURL = process.env.BASE_URL ?? "http://localhost:4200";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL,
    /*
     * Record a trace for every test, but keep it only for failures. Recording
     * on green runs is the price of getting traces locally, where there are
     * no retries that could trigger a recording.
     */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.BASE_URL
    ? // a deployment given with BASE_URL is already running
      undefined
    : {
        command: "npm start",
        url: "http://localhost:4200",
        // usually the dev server is already running, use it
        reuseExistingServer: true,
        timeout: 180_000,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          /*
           * The dev container runs with no-new-privileges, so Chromium cannot
           * set up its own sandbox there. The container image sets the
           * browsers path, so its presence detects the container; elsewhere
           * the sandbox stays on.
           */
          args: process.env.PLAYWRIGHT_BROWSERS_PATH ? ["--no-sandbox"] : [],
        },
      },
    },
  ],
});
