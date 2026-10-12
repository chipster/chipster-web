import { expect, test } from "./fixtures";
import { Api, createDataset, datasetNode, deleteDatasetFromMenu, openSession } from "./session-api";

// 200 when the file exists, 404 when it's deleted; anything else is a failure of the test setup
async function datasetStatus(api: Api, sessionId: string, datasetId: string): Promise<number> {
  const response = await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`);
  return response.status();
}

test("undo in the toast brings a deleted file back", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "undo.txt", x: 100, y: 100 }, "text\n");
  await openSession(page, sessionId, datasetId);

  // the file is deleted on the server only when the toast closes without undo
  const deleteRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "DELETE" && request.url().includes(datasetId)) {
      deleteRequests.push(request.url());
    }
  });

  await deleteDatasetFromMenu(page, datasetId);
  const toast = page.locator("ch-toasts .toast").filter({ hasText: "Deleted file" });
  await expect(toast).toContainText("Deleted file undo.txt");
  await expect(toast.locator("b")).toHaveText("undo.txt");
  await expect(datasetNode(page, datasetId)).toBeHidden();

  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(toast).toHaveCount(0);
  await expect(datasetNode(page, datasetId)).toBeVisible();

  expect(deleteRequests).toEqual([]);
  expect(await datasetStatus(api, sessionId, datasetId)).toBe(200);
});

test("closing the toast deletes the file", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "close.txt", x: 100, y: 100 }, "text\n");
  await openSession(page, sessionId, datasetId);

  await deleteDatasetFromMenu(page, datasetId);
  const toast = page.locator("ch-toasts .toast").filter({ hasText: "Deleted file" });
  await toast.getByRole("button", { name: "Close" }).click();

  await expect(toast).toHaveCount(0);
  await expect.poll(() => datasetStatus(api, sessionId, datasetId)).toBe(404);
});

test("an error toast has its buttons and closes when the url changes", async ({ page, api, baseURL, pageErrors }) => {
  // the address is relative in the proxy mode and absolute in the direct mode
  const sessions = new URL(api.address("session-db") + "/sessions", baseURL).href;
  const failSessionDb = (url: URL) => url.href.startsWith(sessions);
  pageErrors.allowFailedRequest(500, "session-db", "/sessions");
  pageErrors.allowErrorMessage("Updating sessions failed");
  await page.route(failSessionDb, (route) => route.fulfill({ status: 500, body: "e2e failure" }));
  await page.goto("/sessions");

  const toast = page.locator("ch-toasts .toast").filter({ hasText: "Updating sessions failed" });
  await expect(toast).toBeVisible();
  await expect(toast.getByRole("button", { name: "Reload" })).toBeVisible();
  await expect(toast.getByRole("button", { name: "Contact support" })).toBeVisible();
  await page.unroute(failSessionDb);

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
