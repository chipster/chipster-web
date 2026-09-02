import { expect, Page } from "@playwright/test";

/*
 * Fill in the local login form and submit. The form is shown directly only
 * when the auth service has no OIDC providers configured; with providers,
 * /login shows an authentication method selection first and the local login
 * form is behind its own button.
 */
export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/login");

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
