import { expect, test } from "./fixtures";
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
});

test("a session that doesn't exist shows its state", async ({ page, pageErrors }) => {
  pageErrors.allowFailedRequest(404, "session-db", "/sessions/");
  await page.goto("/analyze/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("Session not found")).toBeVisible();
});
