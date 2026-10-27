import { expect, test } from "./fixtures";
import { getSession, openSession } from "./session-api";

// temporary spike test, not to be committed: rename and notes from the modals update the OnPush views

test("rename and notes in the sessions list", async ({ page, api, sessionId }) => {
  await page.goto("/sessions");
  const row = page.locator("tr.session-list-item", { hasText: "e2e rename and notes in the sessions list" });
  await row.hover();
  await row.getByTitle("Actions").click();
  await page.getByRole("button", { name: "Rename…" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("textbox").fill("renamed in the list");
  await modal.getByRole("button", { name: "Rename" }).click();
  await expect(modal).toBeHidden();
  const renamed = page.locator("tr.session-list-item", { hasText: "renamed in the list" });
  await expect(renamed).toBeVisible();
  await expect.poll(async () => (await getSession(api, sessionId)).name).toBe("renamed in the list");

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

  // the dev check runs once a second
  await page.waitForTimeout(3000);
});

test("rename and notes in the session details", async ({ page, api, sessionId }) => {
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

  await page.waitForTimeout(3000);
});
