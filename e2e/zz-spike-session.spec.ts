import { expect, test } from "./fixtures";
import { getSession, openSession } from "./session-api";

// temporary spike test, not to be committed: the session view follows session events

test("session details follow a rename and notes made elsewhere", async ({ page, api, sessionId }) => {
  await openSession(page, sessionId);
  const details = page.locator("ch-session-details");
  await expect(details.locator(".h6")).toHaveText("e2e session details follow a rename and notes made elsewhere");

  const session = await getSession(api, sessionId);
  const update = await api.put("session-db", `/sessions/${sessionId}`, {
    ...session,
    name: "renamed elsewhere",
    notes: "first line\nsecond line",
  });
  expect(update.ok(), `update session ${update.status()}`).toBe(true);
  await expect(details.locator(".h6")).toHaveText("renamed elsewhere");
  await expect(details.getByText("second line")).toBeVisible();

  await page.waitForTimeout(3000);
});

test("a session that doesn't exist shows its state", async ({ page, pageErrors }) => {
  pageErrors.allowFailedRequest(404, "session-db", "/sessions/");
  await page.goto("/analyze/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("Session not found")).toBeVisible();
});
