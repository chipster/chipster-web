import { expect, test } from "./fixtures";
import { getSession } from "./session-api";

/*
 * The sessions list: the name and the notes changed in the modals of a session's menu.
 */

test("a session is renamed and its notes edited in the sessions list", async ({ page, api, sessionId }, testInfo) => {
  // with the title, so that a session left behind by an interrupted run doesn't match
  const name = `e2e ${testInfo.title}`;
  const newName = `${name} (renamed)`;

  await page.goto("/sessions");
  const row = page.locator("tr.session-list-item", { hasText: name });
  await row.hover();
  await row.getByTitle("Actions").click();
  await page.getByRole("button", { name: "Rename…" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("textbox").fill(newName);
  await modal.getByRole("button", { name: "Rename" }).click();
  await expect(modal).toBeHidden();
  const renamed = page.locator("tr.session-list-item", { hasText: newName });
  await expect(renamed).toBeVisible();
  await expect.poll(async () => (await getSession(api, sessionId)).name).toBe(newName);

  await renamed.hover();
  await renamed.getByTitle("Actions").click();
  await page.getByRole("button", { name: /notes…/i }).click();
  await modal.locator("textarea").fill("first line\nsecond line");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).toBeHidden();
  // the preview of the hovered session shows the notes
  await renamed.hover();
  await expect(page.getByText("second line")).toBeVisible();
  await expect.poll(async () => (await getSession(api, sessionId)).notes).toBe("first line\nsecond line");
});
