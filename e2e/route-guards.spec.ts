import { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { submitLoginForm } from "./login";
import { createDataset, datasetNode, getSession, openSession } from "./session-api";

/*
 * The route guards: the login redirect of AuthGuard and the question that
 * ModifiedSessionGuard asks before leaving a temporary session with changes.
 */

test.describe("logged out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a session link goes through the login and back to the session", async ({ page, api, sessionId }) => {
    const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "text\n");

    await page.goto(`/analyze/${sessionId}`);
    await expect(page).toHaveURL(new RegExp(`/login\\?returnUrl=${encodeURIComponent(`/analyze/${sessionId}`)}$`));

    await submitLoginForm(page, "chipster", "chipster");

    await expect(page).toHaveURL(new RegExp(`/analyze/${sessionId}$`));
    await expect(datasetNode(page, datasetId)).toBeVisible({ timeout: 30_000 });
  });
});

/*
 * A temporary session is what the app creates for an example session that
 * the user opens. Session-db marks it modified when something is added.
 */
test.describe("modified temporary session", () => {
  test.use({ sessionState: "TEMPORARY_UNMODIFIED" });

  test.beforeEach(async ({ page, api, sessionId }) => {
    const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "text\n");
    expect((await getSession(api, sessionId)).state).toBe("TEMPORARY_MODIFIED");
    await openSession(page, sessionId, datasetId);
  });

  async function leaveSession(page: Page) {
    await page.locator("#navbar").getByRole("link", { name: "Sessions" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("heading", { name: "Save changes?" })).toBeVisible();
    return modal;
  }

  test("leaving can be cancelled or the session saved", async ({ page, api, sessionId }) => {
    const modal = await leaveSession(page);
    await modal.getByRole("button", { name: "Cancel" }).click();
    await expect(modal).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/analyze/${sessionId}$`));

    await leaveSession(page);
    await modal.getByRole("textbox").fill("e2e route guards saved");
    await modal.getByRole("button", { name: "Save new session" }).click();
    await expect(page).toHaveURL(/\/sessions$/);
    expect(await getSession(api, sessionId)).toMatchObject({ name: "e2e route guards saved", state: "READY" });
  });

  test("leaving can discard the session", async ({ page, api, sessionId }) => {
    const modal = await leaveSession(page);
    await modal.getByRole("button", { name: "Discard changes" }).click();
    await expect(page).toHaveURL(/\/sessions$/);

    // discarding deletes the user's rule, and session-db deletes a session that has no rules left
    await expect.poll(async () => (await api.get("session-db", `/sessions/${sessionId}`)).status()).toBe(404);
  });
});
