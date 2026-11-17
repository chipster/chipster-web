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
 * by other means, and the tests don't depend on the setup project then, see
 * playwright.config.ts. The traces of failed tests in test-results/ have the
 * token too.
 *
 * The directory has to be an absolute path: a relative one would be resolved
 * against the directory Playwright is run in, and a ~ in quotes isn't
 * expanded, both of which could put the tokens in the checkout after all.
 */
export const EXTERNAL_AUTH_DIR = process.env.E2E_AUTH_DIR || undefined;
if (EXTERNAL_AUTH_DIR && !isAbsolute(EXTERNAL_AUTH_DIR)) {
  throw new Error(`E2E_AUTH_DIR has to be an absolute path, not "${EXTERNAL_AUTH_DIR}"`);
}
const AUTH_DIR = EXTERNAL_AUTH_DIR ?? join(__dirname, "../playwright/.auth");
export const USER_STATE = join(AUTH_DIR, "chipster.json");
export const ADMIN_STATE = join(AUTH_DIR, "admin.json");

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
