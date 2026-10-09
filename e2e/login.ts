import { join } from "node:path";

import { expect, Page } from "@playwright/test";

/*
 * The browser states that auth.setup.ts saves after logging in. Absolute, so
 * that they land in the git-ignored directory wherever Playwright is run from.
 */
export const USER_STATE = join(__dirname, "../playwright/.auth/chipster.json");
export const ADMIN_STATE = join(__dirname, "../playwright/.auth/admin.json");

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
