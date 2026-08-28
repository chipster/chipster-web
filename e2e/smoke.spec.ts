import { expect, test } from "@playwright/test";

/*
 * Smoke tests for the whole stack: the Angular app, chipster-web-server and
 * the database. The credentials are the defaults from the web server's
 * security/users file.
 */

test("home page opens", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/home$/);
  await expect(page).toHaveTitle("Chipster");
  await expect(page.getByRole("heading", { name: "Chipster", level: 1, exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sessions" })).toBeVisible();
});

test("logging in opens the session list", async ({ page }) => {
  await page.goto("/login");

  await page.locator("#username").fill("chipster");
  await page.locator("#password").fill("chipster");
  await page.getByRole("button", { name: "Log In" }).click();

  await expect(page).toHaveURL(/\/sessions$/);
  /*
   * exact, because the role name matches substrings by default and the
   * session list has a "Your sessions" heading too
   */
  await expect(page.getByRole("heading", { name: "Sessions", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New session" })).toBeVisible();
  // the user menu of the navigation bar shows who is logged in
  await expect(page.getByRole("button", { name: "chipster", exact: true })).toBeVisible();
});

test("wrong password keeps the user on the login page", async ({ page }) => {
  await page.goto("/login");

  await page.locator("#username").fill("chipster");
  await page.locator("#password").fill("not-the-password");
  await page.getByRole("button", { name: "Log In" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Chipster login" })).toBeVisible();
});
