import { Route } from "@playwright/test";

import { expect, test, waitForDevCheck } from "./fixtures";
import { getSession, openSession } from "./session-api";

/*
 * The session details in the session view: the name and the notes, changed in the modals of the
 * details' menu or elsewhere through the API, which the page learns about from the session events.
 */

test("the session details follow a rename and notes made elsewhere", async ({ page, api, sessionId }, testInfo) => {
  await openSession(page, sessionId);
  const details = page.locator("ch-session-details");
  await expect(details.locator(".h6")).toHaveText(`e2e ${testInfo.title}`);

  const session = await getSession(api, sessionId);
  const update = await api.put("session-db", `/sessions/${sessionId}`, {
    ...session,
    name: "renamed elsewhere",
    notes: "first line\nsecond line",
  });
  expect(update.ok(), `update session ${update.status()}`).toBe(true);
  await expect(details.locator(".h6")).toHaveText("renamed elsewhere");
  await expect(details.getByText("second line")).toBeVisible();
  await waitForDevCheck(page);
});

test("a session is renamed and its notes edited in the session details", async ({ page, api, sessionId }) => {
  await openSession(page, sessionId);
  const details = page.locator("ch-session-details");

  await details.getByTitle("Actions").click();
  await details.getByRole("button", { name: "Rename…" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("textbox").fill("renamed in the details");
  await modal.getByRole("button", { name: "Rename" }).click();
  await expect(modal).toBeHidden();
  await expect(details.locator(".h6")).toHaveText("renamed in the details");
  await expect.poll(async () => (await getSession(api, sessionId)).name).toBe("renamed in the details");

  await details.getByTitle("Actions").click();
  await details.getByRole("button", { name: "Edit notes…" }).click();
  await modal.locator("textarea").fill("first line\nsecond line");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).toBeHidden();
  await expect(details.getByText("second line")).toBeVisible();
  await expect.poll(async () => (await getSession(api, sessionId)).notes).toBe("first line\nsecond line");
  await waitForDevCheck(page);
});

/*
 * The sharing modal shows the rules of the session and follows the rule events: it doesn't add or
 * remove a row itself after its own request. The share goes to a user that doesn't have to exist,
 * and is gone with the session after the test. The session is renamed first, because a session
 * event replaces the session of the open session view, and the rule events must still reach it.
 */
test("the open session is shared and the share removed in the sharing modal", async ({ page, api, sessionId }) => {
  const username = "jaas/e2e-share-target";
  const rulesOf = async () => (await getSession(api, sessionId)).rules.map((rule) => rule.username);

  await openSession(page, sessionId);
  const details = page.locator("ch-session-details");
  const session = await getSession(api, sessionId);
  const update = await api.put("session-db", `/sessions/${sessionId}`, { ...session, name: "renamed before sharing" });
  expect(update.ok(), `update session ${update.status()}`).toBe(true);
  await expect(details.locator(".h6")).toHaveText("renamed before sharing");

  await details.getByTitle("Actions").click();
  await details.getByRole("button", { name: "Share…" }).click();
  const modal = page.getByRole("dialog").filter({ hasText: "Share session" });
  const shareRow = modal.getByRole("row").filter({ hasText: username });
  await expect(modal.getByRole("row").filter({ hasText: "owner" })).toBeVisible();

  await modal.getByRole("button", { name: "Add rule" }).click();
  await modal.getByRole("textbox").fill(username);
  await modal.getByRole("button", { name: "Add", exact: true }).click();
  await expect(shareRow).toBeVisible();
  await expect(shareRow).toContainText("read-write");
  await expect.poll(rulesOf).toContain(username);

  await shareRow.getByRole("button").click();
  const confirm = page.getByRole("dialog").filter({ hasText: `Stop sharing with ${username}?` });
  await confirm.getByRole("button", { name: "Stop sharing" }).click();
  await expect(confirm).toBeHidden();
  await expect(shareRow).toBeHidden();
  await expect.poll(rulesOf).not.toContain(username);
  await expect(modal.getByRole("row").filter({ hasText: "owner" })).toBeVisible();

  await modal.getByRole("button", { name: "Close" }).click();
  await expect(modal).toBeHidden();
  await waitForDevCheck(page);
});

/*
 * Renaming a temporary session saves it. The page has to know that right after the request, not
 * only after the session event, or leaving the page in between deletes the session as unsaved.
 * The session event's fetch of the session is held until the page has been left.
 */
test.describe("temporary session", () => {
  test.use({ sessionState: "TEMPORARY_UNMODIFIED" });

  test("a renamed temporary session is kept when the page is left at once", async ({ page, api, sessionId }) => {
    await openSession(page, sessionId);
    const held: Route[] = [];
    const sessionUrl = (url: URL) => url.pathname.endsWith(`/sessions/${sessionId}`);
    await page.route(sessionUrl, (route) => (route.request().method() === "GET" ? held.push(route) : route.continue()));

    const details = page.locator("ch-session-details");
    await details.getByTitle("Actions").click();
    await details.getByRole("button", { name: "Rename…" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("textbox").fill("renamed temporary session");
    await modal.getByRole("button", { name: "Rename" }).click();
    await expect(modal).toBeHidden();
    await expect.poll(async () => (await getSession(api, sessionId)).state).toBe("READY");
    await expect.poll(() => held.length).toBeGreaterThan(0);

    await page.locator("#navbar").getByRole("link", { name: "Sessions" }).click();
    await expect(page).toHaveURL(/\/sessions$/);
    await expect(page.getByText("renamed temporary session")).toBeVisible();
    expect(await getSession(api, sessionId)).toMatchObject({ name: "renamed temporary session", state: "READY" });

    await Promise.all(held.map((route) => route.continue()));
    await page.unroute(sessionUrl);
  });
});

test("a session that doesn't exist shows its state", async ({ page, pageErrors }) => {
  pageErrors.allowFailedRequest(404, "session-db", "/sessions/");
  await page.goto("/analyze/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("Session not found")).toBeVisible();
});
