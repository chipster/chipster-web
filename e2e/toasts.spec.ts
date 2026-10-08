import { expect, test } from "@playwright/test";

import { login } from "./login";
import { Api, createDataset, createSession, datasetNode, deleteDataset, getApi, openSession } from "./session";

test.describe.configure({ timeout: 90_000 });

let api: Api;
let sessionId: string | undefined;

test.beforeEach(async ({ page }) => {
  await login(page, "chipster", "chipster");
  api = await getApi(page);
  sessionId = await createSession(api, "e2e toasts");
});

test.afterEach(async () => {
  // cleared right away, so that a later test whose setup fails before
  // creating its own session doesn't delete this one again
  const sessionToDelete = sessionId;
  sessionId = undefined;
  if (sessionToDelete) {
    const response = await api.request.delete(`/session-db/sessions/${sessionToDelete}`, { headers: api.headers });
    expect(response.ok()).toBe(true);
  }
});

// 200 when the file exists, 404 when it's deleted; anything else is a failure of the test setup
async function datasetStatus(datasetId: string): Promise<number> {
  const response = await api.request.get(`/session-db/sessions/${sessionId}/datasets/${datasetId}`, {
    headers: api.headers,
  });
  return response.status();
}

test("undo in the toast brings a deleted file back", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "undo.txt", x: 100, y: 100 }, "text\n");
  await openSession(page, sessionId, datasetId);

  // the file is deleted on the server only when the toast closes without undo
  const deleteRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "DELETE" && request.url().includes(datasetId)) {
      deleteRequests.push(request.url());
    }
  });

  await deleteDataset(page, datasetId);
  const toast = page.locator("ch-toasts .toast").filter({ hasText: "Deleted file" });
  await expect(toast).toContainText("Deleted file undo.txt");
  await expect(toast.locator("b")).toHaveText("undo.txt");
  await expect(datasetNode(page, datasetId)).toBeHidden();

  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(toast).toHaveCount(0);
  await expect(datasetNode(page, datasetId)).toBeVisible();

  expect(deleteRequests).toEqual([]);
  expect(await datasetStatus(datasetId)).toBe(200);
});

test("closing the toast deletes the file", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "close.txt", x: 100, y: 100 }, "text\n");
  await openSession(page, sessionId, datasetId);

  await deleteDataset(page, datasetId);
  const toast = page.locator("ch-toasts .toast").filter({ hasText: "Deleted file" });
  await toast.getByRole("button", { name: "Close" }).click();

  await expect(toast).toHaveCount(0);
  await expect.poll(() => datasetStatus(datasetId)).toBe(404);
});

test("an error toast has its buttons and closes when the url changes", async ({ page }) => {
  await page.route(/\/session-db\//, (route) => route.fulfill({ status: 500, body: "e2e failure" }));
  await page.goto("/sessions");

  const toast = page.locator("ch-toasts .toast").filter({ hasText: "Updating sessions failed" });
  await expect(toast).toBeVisible();
  await expect(toast.getByRole("button", { name: "Reload" })).toBeVisible();
  await expect(toast.getByRole("button", { name: "Contact support" })).toBeVisible();
  await page.unroute(/\/session-db\//);

  await toast.getByRole("button", { name: "Show details" }).click();
  // the error has only a message, so the title of the details is just "details"
  const details = page.locator(".modal-content").filter({ hasText: "Client error" });
  await expect(details).toContainText("message: Updating sessions failed");
  await details.getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".modal-content")).toHaveCount(0);

  // the error is still there until the user moves on
  await expect(toast).toBeVisible();
  await page.getByRole("link", { name: "Manual" }).click();
  await expect(page.locator("ch-toasts .toast")).toHaveCount(0);
});
