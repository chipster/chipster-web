import { expect, test } from "./fixtures";
import { ADMIN_STATE } from "./login";
import { getSession } from "./session-api";

/*
 * After a delete in the confirmation modal, the storage view loads the users again and creates its
 * grids anew: ag-grid reads gridOptions only when it's created. The view has to show the loading
 * state in between, or the old grids stay with the old rows and without their summary bars.
 *
 * The user exists only as a rule of the test's session, so it's listed in "SessionDB only", and
 * deleting its sessions deletes only that rule. A name of its own for each run, because a failed
 * run leaves the rule until the session is deleted.
 */
test("the storage view lists the users again after deleting sessions", async ({
  browser,
  pageErrors,
  api,
  sessionId,
}) => {
  const userId = `jaas/e2e-storage-${Date.now()}`;
  const share = await api.post("session-db", `/sessions/${sessionId}/rules`, { username: userId, readWrite: true });
  expect(share.ok(), `share ${share.status()}`).toBe(true);

  const adminContext = await browser.newContext({ storageState: ADMIN_STATE });
  pageErrors.watch(adminContext);
  const page = await adminContext.newPage();
  try {
    await page.goto("/admin/storage");
    await page.getByRole("tab", { name: "SessionDB only" }).click();

    // the pane of the Users tab is still there while it fades out
    const pane = page.getByRole("tabpanel", { name: "SessionDB only" });
    const grid = pane.locator("ag-grid-angular");
    const summary = pane.locator(".summary");
    const filterListed = async () => {
      await pane.locator("#session-notes").fill(userId);
      await pane.getByRole("button", { name: "Filter listed users" }).click();
    };

    await expect(summary).toBeVisible({ timeout: 30_000 });
    await pane.getByRole("button", { name: "Open filter list" }).click();
    await filterListed();
    // the row is split between the pinned and the scrolling parts of the grid
    const row = grid.locator(".ag-pinned-left-cols-container .ag-row");
    await expect(row).toHaveCount(1);
    await expect(row).toHaveText(userId);
    await expect(summary).toContainText("Users: 1 /");

    await grid.locator(".ag-pinned-right-cols-container .ag-row").getByRole("button", { name: "D ses" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("heading", { name: "Delete sessions, keep users" })).toBeVisible();
    await modal.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(modal.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
    await modal.getByRole("button", { name: "Close" }).last().click();
    await expect(modal).toBeHidden();

    // the new grid has no filter, so the summary shows all users, and the deleted one isn't there
    await expect(summary).toBeVisible();
    await expect(summary).toContainText(/Users: (\d+) \/ \1\b/);
    await filterListed();
    await expect(row).toHaveCount(0);
    await expect(summary).toContainText("Users: 0 /");

    expect((await getSession(api, sessionId)).rules.map((rule) => rule.username)).not.toContain(userId);
  } finally {
    // read the errors of the admin's pages before they are closed
    await pageErrors.settle();
    await adminContext.close();
  }
});
