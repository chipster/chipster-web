import { expect, test as setup } from "@playwright/test";

import { ADMIN_STATE, login, USER_STATE } from "./login";

/*
 * Log in once per user and save the browser state, which holds the token, for
 * the tests that only need a logged-in user. The auth service throttles
 * password logins per username (auth-password-throttle-* in the server
 * config), so logging in in every test would make the suite fail when it
 * grows or is run twice in a row.
 */

setup("log in as a user", async ({ page }) => {
  await login(page, "chipster", "chipster");
  await expect(page).toHaveURL(/\/sessions$/);
  await page.context().storageState({ path: USER_STATE });
});

setup("log in as an admin", async ({ page }) => {
  await login(page, "admin", "admin");
  await expect(page).toHaveURL(/\/sessions$/);
  await page.context().storageState({ path: ADMIN_STATE });
});
