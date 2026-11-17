import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { expect, Page } from "@playwright/test";

/*
 * The browser states that auth.setup.ts saves after logging in, which hold the
 * tokens. By default in a git-ignored directory of the checkout, given as an
 * absolute path so that it's the same wherever Playwright is run from.
 *
 * EXTERNAL_AUTH_DIR (the variable E2E_AUTH_DIR) puts them in another
 * directory, e.g. outside the checkout, so that a copy of the checkout doesn't
 * take the login states along. That's for running against a deployment whose
 * passwords aren't the defaults of auth.setup.ts: the states are saved there
 * by other means, and the setup project is left out then, see
 * playwright.config.ts. The traces of failed tests in test-results/ have the
 * token too.
 */
export const EXTERNAL_AUTH_DIR = process.env.E2E_AUTH_DIR;
const AUTH_DIR = EXTERNAL_AUTH_DIR || join(__dirname, "../playwright/.auth");
export const USER_STATE = join(AUTH_DIR, "chipster.json");
export const ADMIN_STATE = join(AUTH_DIR, "admin.json");

/*
 * Refuse an E2E_AUTH_DIR that can't work, before any test starts: called from
 * playwright.config.ts, so that the error is the first thing printed and
 * doesn't repeat for every test.
 *
 * - The directory has to be an absolute path: a relative one would be resolved
 *   against the directory Playwright is run in, and a ~ in quotes isn't
 *   expanded, both of which could put the tokens in the checkout after all.
 * - Both states have to be there. Without the setup project nothing creates
 *   them, and a missing admin state would fail the admin specs only when they
 *   open their admin context, in the middle of the run.
 * - The states have to be for the origin of baseURL: Playwright puts the
 *   localStorage of a state only into pages of the origin the state was saved
 *   for, so with another origin (a different host, scheme or port, or a
 *   forgotten BASE_URL that points the tests at the local dev server) every
 *   test would just end up on the login page.
 */
export function validateExternalAuthDir(baseURL: string): void {
  if (!EXTERNAL_AUTH_DIR) {
    return;
  }
  if (!isAbsolute(EXTERNAL_AUTH_DIR)) {
    throw new Error(`E2E_AUTH_DIR has to be an absolute path, not "${EXTERNAL_AUTH_DIR}"`);
  }
  const origin = new URL(baseURL).origin;
  for (const state of [USER_STATE, ADMIN_STATE]) {
    if (!existsSync(state)) {
      throw new Error(`E2E_AUTH_DIR is set, but there is no login state ${state}`);
    }
    const origins: string[] = JSON.parse(readFileSync(state, "utf8")).origins.map((o: { origin: string }) => o.origin);
    if (!origins.includes(origin)) {
      throw new Error(
        `the login state ${state} is for ${origins.join(", ") || "no origin"}, not for ${origin} (BASE_URL)`,
      );
    }
  }
}

/*
 * Fill in the local login form and submit. The form is shown directly only
 * when the auth service has no OIDC providers configured; with providers,
 * /login shows an authentication method selection first and the local login
 * form is behind its own button.
 */
export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/login");
  await submitLoginForm(page, username, password);
}

// the same on a login page that is open already, e.g. after a redirect that has to keep its returnUrl
export async function submitLoginForm(page: Page, username: string, password: string): Promise<void> {
  const usernameField = page.locator("#username");
  // the auth method button is "<app-name> login", e.g. "Chipster login"
  const localLoginButton = page.getByRole("button", { name: /login$/ });
  await expect(usernameField.or(localLoginButton)).toBeVisible();
  if (!(await usernameField.isVisible())) {
    await localLoginButton.click();
  }

  await usernameField.fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
}
