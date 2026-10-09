import { defineConfig, devices } from "@playwright/test";

import { USER_STATE } from "./e2e/login";

/*
 * End-to-end tests, run against a full dev environment: the Angular dev
 * server on port 4200 and chipster-web-server, in either the proxy or the
 * direct mode, see CLAUDE.md in both repositories. The dev server is started
 * automatically if it isn't already running; the backend has to be started by
 * hand.
 *
 * Unit tests are separate and run with Vitest, see vitest.config.mts.
 */

// set BASE_URL to run the tests against an already running deployment
const baseURL = process.env.BASE_URL ?? "http://localhost:4200";

const chromium = {
  ...devices["Desktop Chrome"],
  launchOptions: {
    /*
     * The dev container runs with no-new-privileges, so Chromium cannot set up
     * its own sandbox there. The container image sets the browsers path, so
     * its presence detects the container; elsewhere the sandbox stays on.
     */
    args: process.env.PLAYWRIGHT_BROWSERS_PATH ? ["--no-sandbox"] : [],
  },
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // the session view takes a while to open in the dev setup, and some tests open it more than once
  timeout: 90_000,
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
        /*
         * in proxy mode, which works with a backend in either mode: the proxy
         * forwards the relative addresses of runProxy, and the absolute
         * addresses of the direct mode bypass it
         */
        command: "npm run start:proxy",
        url: "http://localhost:4200",
        // usually the dev server is already running, use it
        reuseExistingServer: true,
        timeout: 180_000,
      },
  projects: [
    // logs in once per user, see auth.setup.ts
    { name: "setup", testMatch: /\.setup\.ts$/, use: chromium },
    // the tests run as the logged-in user, the specs that need otherwise override this
    { name: "chromium", use: { ...chromium, storageState: USER_STATE }, dependencies: ["setup"] },
  ],
});
