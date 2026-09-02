import { expect, test } from "@playwright/test";

import { login } from "./login";

/*
 * Smoke tests for the whole stack: the Angular app, chipster-web-server and
 * the database. The credentials are the defaults from the web server's
 * security/users file.
 */

test("home page opens", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/home$/);
  await expect(page).toHaveTitle("Chipster");
  /*
   * assert parts that the home page itself renders unconditionally, not the
   * h1 heading, which comes from the deployment-configurable home-header-path
   */
  await expect(page.getByRole("heading", { name: "Get started" })).toBeVisible();
  await expect(page.locator("#getstarted").getByRole("button", { name: "Log In" })).toBeVisible();
  // scoped to the navbar, because the home page adds its own Sessions link when logged in
  await expect(page.locator("#navbar").getByRole("link", { name: "Sessions" })).toBeVisible();
});

test("logging in opens the session list", async ({ page }) => {
  await login(page, "chipster", "chipster");

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
  await login(page, "chipster", "not-the-password");

  /*
   * wait for the auth service's rejection first: the URL and heading
   * assertions below are true already before the login request completes, so
   * on their own they would pass even if the password was never checked
   */
  await expect(page.getByText("Incorrect username or password")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /login$/ })).toBeVisible();
});
