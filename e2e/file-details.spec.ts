import { expect, test, waitForDevCheck } from "./fixtures";
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
  await waitForDevCheck(page);
});

test("the file details follow a label applied from the toolbar menu and from the labels modal", async ({
  page,
  api,
  sessionId,
}) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await createLabel(api, sessionId, "my-label");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  const details = page.locator("ch-single-dataset");
  await expect(details).toContainText("Add labels");

  // the toolbar menu applies the label, and a second toggle removes it although the selection
  // still has the dataset as it was before the first
  const labelsMenu = page.locator("ch-session-panel").getByTitle("Labels menu");
  const menuItem = page.locator(".dropdown-menu.show button", { hasText: "my-label" });
  await labelsMenu.click();
  await expect(menuItem).not.toContainText("✓");
  await menuItem.click();
  await expect(details.locator("ch-label-pill")).toContainText("my-label");
  await waitForDevCheck(page);
  await labelsMenu.click();
  await expect(menuItem).toContainText("✓");
  await menuItem.click();
  await expect(details).toContainText("Add labels");
  await waitForDevCheck(page);

  // the labels modal from the details applies it again
  await details.getByText("Add labels").click();
  const modal = page.locator("ch-labels-modal");
  await modal.locator("input[type=checkbox]").first().check();
  await modal.getByRole("button", { name: "Apply" }).click();
  await expect(modal).toBeHidden();
  await expect(details.locator("ch-label-pill")).toContainText("my-label");
  await waitForDevCheck(page);
});
