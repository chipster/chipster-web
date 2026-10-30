import { expect, test } from "./fixtures";
import { createDataset, createLabel, datasetNode, openSession, updateDataset, visualizationTab } from "./session-api";

/*
 * The Details tab of the selected files: one file, or the list of several.
 */

test("the file details show one selected file and list several", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  const otherId = await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "b\n");
  await openSession(page, sessionId, datasetId);

  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  const details = page.locator("ch-single-dataset");
  await expect(details).toContainText("Add labels");
  await expect(details.locator("textarea")).toBeVisible();

  await datasetNode(page, otherId).click({ modifiers: ["ControlOrMeta"] });
  const files = page.locator("ch-files-details");
  await expect(files).toContainText("a.txt");
  await expect(files).toContainText("b.txt");
});

test("the file details follow the labels and notes changed elsewhere", async ({ page, api, sessionId }) => {
  // The details show the datasets of the selection, which the dataset events don't update, so
  // the label and the notes don't show until the selection changes
  test.fail();

  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  const details = page.locator("ch-single-dataset");
  await expect(details).toContainText("Add labels");

  // a label and notes added elsewhere
  const labelId = await createLabel(api, sessionId, "remote-label");
  await updateDataset(api, sessionId, datasetId, { labelIds: [labelId], notes: "remote note" });
  await expect(details.locator("ch-label-pill")).toContainText("remote-label");
  await expect(details.locator("textarea")).toHaveValue("remote note");
});
