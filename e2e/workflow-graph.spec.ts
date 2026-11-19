import { Page } from "@playwright/test";

import {
  Api,
  createDataset,
  datasetNode,
  nodeCenter,
  openSession,
  pressMoveRelease,
  selectedInGraph,
} from "./session-api";
import { expect, test } from "./fixtures";

/*
 * Clicks and drags in the workflow graph. The files and the background are both clickable and
 * draggable with d3, which has to tell a click from a drag. A hand on a mouse or a trackpad often
 * moves a pixel or two during a click, and that must still be a click.
 */

async function savedPosition(api: Api, sessionId: string, datasetId: string) {
  const response = await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`);
  expect(response.ok()).toBe(true);
  const { x, y } = await response.json();
  return { x, y };
}

/*
 * The requests that save the positions of the files, as they are sent. A read of the position
 * right after the gesture could run before the request lands, so the request itself is counted.
 */
function datasetSaves(page: Page): string[] {
  const saves: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PUT" && request.url().includes("/datasets")) {
      saves.push(request.url());
    }
  });
  return saves;
}

test("a click that moves the mouse a little selects the file", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await openSession(page, sessionId, datasetId);

  await pressMoveRelease(page, await nodeCenter(page, datasetId), 2, 1);
  await expect(page.locator("ch-selected-files .h6")).toHaveText("a.txt");
});

test("a click that moves the mouse a little on a selected file neither moves it nor keeps the others selected", async ({
  page,
  api,
  sessionId,
}) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  const otherId = await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "b\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await datasetNode(page, otherId).click({ modifiers: ["ControlOrMeta"] });
  const selectedName = page.locator("ch-selected-files .h6");
  await expect(selectedName).toHaveText("2 files");
  const x = await datasetNode(page, datasetId).getAttribute("x");
  const saves = datasetSaves(page);

  await pressMoveRelease(page, await nodeCenter(page, datasetId), 2, 1);
  await expect(selectedName).toHaveText("a.txt");
  await expect(datasetNode(page, datasetId)).toHaveAttribute("x", x);
  await expect(datasetNode(page, otherId)).toHaveAttribute("x", "300");
  expect(saves).toEqual([]);
});

test("a drag moves the selected file and saves its position", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await expect(page.locator("ch-selected-files .h6")).toHaveText("a.txt");

  await pressMoveRelease(page, await nodeCenter(page, datasetId), 60, 40);
  // the position is saved when the drag ends
  await expect.poll(async () => (await savedPosition(api, sessionId, datasetId)).x).toBeGreaterThan(130);
  const saved = await savedPosition(api, sessionId, datasetId);
  expect(saved.y).toBeGreaterThan(115);
  await expect(datasetNode(page, datasetId)).toHaveAttribute("x", String(saved.x));
  // still selected, a drag doesn't toggle the selection
  await expect(page.locator("ch-selected-files .h6")).toHaveText("a.txt");
});

test("a click that moves the mouse a little on the background closes the context menu and keeps the selection", async ({
  page,
  api,
  sessionId,
}) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click({ button: "right" });
  const contextMenu = page.locator(".d3-context-menu");
  await expect(contextMenu).toBeVisible();
  const selectedName = page.locator("ch-selected-files .h6");
  await expect(selectedName).toHaveText("a.txt");

  // the context menu closes on the click, and a click that only closes it doesn't clear the selection.
  // The menu opens below the right-click, so the empty background above the file is clear of it.
  const center = await nodeCenter(page, datasetId);
  const background = { x: center.x, y: center.y - 60 };
  await pressMoveRelease(page, background, 2, 1);
  await expect(contextMenu).toBeHidden();
  await expect(selectedName).toHaveText("a.txt");

  // the same click with the menu closed clears the selection
  await pressMoveRelease(page, background, 2, 1);
  await expect(selectedName).toBeHidden();
});

test("a drag moves all the selected files together and saves their positions", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  const otherId = await createDataset(api, sessionId, { name: "b.txt", x: 200, y: 100 }, "b\n");
  const unselectedId = await createDataset(api, sessionId, { name: "c.txt", x: 100, y: 200 }, "c\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await datasetNode(page, otherId).click({ modifiers: ["ControlOrMeta"] });
  await expect(page.locator("ch-selected-files .h6")).toHaveText("2 files");

  // a drag of one of them; the graph is drawn at scale 1, so a pixel is a unit of the saved position
  await pressMoveRelease(page, await nodeCenter(page, datasetId), 60, 40);
  await expect.poll(async () => (await savedPosition(api, sessionId, otherId)).x).toBeGreaterThan(230);
  const saved = await savedPosition(api, sessionId, datasetId);
  const otherSaved = await savedPosition(api, sessionId, otherId);
  expect(saved.x).toBeGreaterThan(130);
  expect(saved.y).toBeGreaterThan(115);
  // the same move for both
  expect({ dx: otherSaved.x - 200, dy: otherSaved.y - 100 }).toEqual({ dx: saved.x - 100, dy: saved.y - 100 });
  await expect(datasetNode(page, otherId)).toHaveAttribute("x", String(otherSaved.x));
  await expect(datasetNode(page, otherId)).toHaveAttribute("y", String(otherSaved.y));

  // the file that wasn't selected stays where it was, and the selection stays as it was
  expect(await savedPosition(api, sessionId, unselectedId)).toEqual({ x: 100, y: 200 });
  await expect(datasetNode(page, unselectedId)).toHaveAttribute("x", "100");
  expect((await selectedInGraph(page)).sort()).toEqual([datasetId, otherId].sort());
});

test("a drag on the background selects the files in the rectangle instead of the selected ones", async ({
  page,
  api,
  sessionId,
}) => {
  const a = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  const b = await createDataset(api, sessionId, { name: "b.txt", x: 200, y: 100 }, "b\n");
  const c = await createDataset(api, sessionId, { name: "c.txt", x: 100, y: 200 }, "c\n");
  await openSession(page, sessionId, a);
  await datasetNode(page, c).click();
  await expect.poll(async () => selectedInGraph(page)).toEqual([c]);

  // from the background above and left of a.txt to below b.txt, which leaves c.txt 100 px lower outside.
  // With Ctrl the rectangle would add to the selection, but d3-drag ignores a press with Ctrl held on every
  // platform, so that branch is only reachable with Cmd on macOS
  const aCenter = await nodeCenter(page, a);
  const bCenter = await nodeCenter(page, b);
  await pressMoveRelease(page, { x: aCenter.x - 40, y: aCenter.y - 30 }, bCenter.x - aCenter.x + 80, 60);
  await expect.poll(async () => (await selectedInGraph(page)).sort()).toEqual([a, b].sort());
  await expect(page.locator("ch-selected-files .h6")).toHaveText("2 files");
  await expect(page.locator("#selection-rect")).toHaveCount(0);
});
