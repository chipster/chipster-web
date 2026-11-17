import { join, resolve } from "node:path";

import { expect, Page } from "@playwright/test";

/*
 * The browser states that auth.setup.ts saves after logging in. Absolute, so
 * that they land in the git-ignored directory wherever Playwright is run from.
 *
 * E2E_AUTH_DIR puts them in another directory, e.g. outside the checkout, so
 * that a copy of it doesn't take the tokens along. That's for running against
 * a deployment whose passwords aren't the defaults of auth.setup.ts: the
 * states are saved there by other means, and the tests run with --no-deps,
 * which skips the setup project.
 */
const AUTH_DIR = process.env.E2E_AUTH_DIR ? resolve(process.env.E2E_AUTH_DIR) : join(__dirname, "../playwright/.auth");
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
