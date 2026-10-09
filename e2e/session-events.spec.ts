import { expect, test } from "./fixtures";
import { createDataset, datasetNode, deleteDataset, openSession } from "./session-api";

/*
 * An open session follows the changes that others make to it: session-db
 * sends them over a WebSocket and the app applies them to its state. The
 * changes are made through the API here, so the page learns about them only
 * from the events.
 */

test.describe.configure({ timeout: 90_000 });

test("datasets added and deleted elsewhere appear and disappear without a reload", async ({ page, api, sessionId }) => {
  const firstId = await createDataset(api, sessionId, { name: "first.txt", x: 100, y: 100 }, "first\n");
  await openSession(page, sessionId, firstId);

  // a reload would clear this
  await page.evaluate(() => {
    (window as unknown as { notReloaded: boolean }).notReloaded = true;
  });

  const secondId = await createDataset(api, sessionId, { name: "second.txt", x: 300, y: 100 }, "second\n");
  await expect(datasetNode(page, secondId)).toBeVisible();

  await deleteDataset(api, sessionId, firstId);
  await expect(datasetNode(page, firstId)).toBeHidden();
  await expect(datasetNode(page, secondId)).toBeVisible();

  // the List tab shows the same state as the graph
  await page.getByRole("tab", { name: "List" }).click();
  await expect(page.locator("ch-session-panel").getByText("second.txt")).toBeVisible();
  await expect(page.locator("ch-session-panel").getByText("first.txt")).toBeHidden();

  expect(await page.evaluate(() => (window as unknown as { notReloaded?: boolean }).notReloaded)).toBe(true);
});
