import { expect, test } from "./fixtures";
import { createDataset, datasetNode, openSession } from "./session-api";

// temporary spike test, not to be committed: the Details tab follows dataset and label events
test("details follow changes made elsewhere", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  const otherId = await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "b\n");
  await openSession(page, sessionId, datasetId);

  await datasetNode(page, datasetId).click();
  await page.locator("ch-visualizations").getByText("Details", { exact: true }).first().click();
  const details = page.locator("ch-single-dataset");
  await expect(details).toContainText("Add labels");

  // a label and notes added elsewhere
  const label = await api.post("session-db", `/sessions/${sessionId}/labels`, {
    sessionId,
    name: "spike-label",
    color: "#ff0000",
  });
  expect(label.ok(), `create label ${label.status()}`).toBe(true);
  const labelId = (await label.json()).labelId;
  const current = await (await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`)).json();
  const update = await api.put("session-db", `/sessions/${sessionId}/datasets/${datasetId}`, {
    ...current,
    labelIds: [labelId],
    notes: "remote note",
  });
  expect(update.ok(), `update dataset ${update.status()}`).toBe(true);

  await expect(details.locator("ch-label-pill")).toContainText("spike-label");
  await expect(details.locator("textarea")).toHaveValue("remote note");

  // the label renamed elsewhere
  const rename = await api.put("session-db", `/sessions/${sessionId}/labels/${labelId}`, {
    sessionId,
    labelId,
    name: "renamed-label",
    color: "#ff0000",
  });
  expect(rename.ok(), `rename label ${rename.status()}`).toBe(true);
  await expect(details.locator("ch-label-pill")).toContainText("renamed-label");

  // two files selected: the list shows the label too
  await datasetNode(page, otherId).click({ modifiers: ["ControlOrMeta"] });
  const files = page.locator("ch-files-details");
  await expect(files).toContainText("a.txt");
  await expect(files).toContainText("b.txt");
  await expect(files.locator("ch-label-pill")).toContainText("renamed-label");

  await page.waitForTimeout(3000);
});
