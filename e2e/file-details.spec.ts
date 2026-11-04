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

test("notes and a label saved from the details survive a rename from the toolbar", async ({ page, api, sessionId }) => {
  // the toolbar's Rename sends the whole dataset, so it has to send the latest copy, not the one of the
  // selection, which the dataset events don't update
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await createLabel(api, sessionId, "my-label");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  const details = page.locator("ch-single-dataset");
  const textarea = details.locator("textarea");
  const datasetOnServer = async () =>
    (await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`)).json();

  await textarea.click();
  await textarea.fill("my note");
  await textarea.blur();
  await expect.poll(async () => (await datasetOnServer()).notes).toBe("my note");
  await page.locator("ch-session-panel").getByTitle("Labels menu").click();
  await page.locator(".dropdown-menu.show button", { hasText: "my-label" }).click();
  await expect(details.locator("ch-label-pill")).toContainText("my-label");

  await page.locator("ch-selected-files").getByTitle("Actions").locator("visible=true").first().click();
  await page.locator(".dropdown-menu.show").getByText("Rename").click();
  const modal = page.locator(".modal-content");
  await modal.locator("input").fill("b.txt");
  await modal.getByRole("button", { name: "Rename" }).click();
  await expect(modal).toBeHidden();
  await expect.poll(async () => (await datasetOnServer()).name).toBe("b.txt");
  await waitForDevCheck(page);
  const saved = await datasetOnServer();
  expect(saved.notes).toBe("my note");
  expect(saved.labelIds).toHaveLength(1);
  await expect(textarea).toHaveValue("my note");
  await expect(details.locator("ch-label-pill")).toContainText("my-label");
});

test("the sample metadata of a failed Define samples doesn't leak into the next save", async ({
  page,
  api,
  baseURL,
  sessionId,
  pageErrors,
}) => {
  // the toolbar gives the samples modal the latest copies of the datasets, which are the map's objects:
  // the modal has to write the sample metadata into copies of its own, or a failed save leaves it in the
  // map, from where the next whole-object update (the notes) sends it to the server
  const datasetId = await createDataset(api, sessionId, { name: "a.fastq", x: 100, y: 100 }, "@r\nA\n+\nF\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  const details = page.locator("ch-single-dataset");
  const textarea = details.locator("textarea");
  const datasetOnServer = async () =>
    (await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`)).json();

  // the address is relative in the proxy mode and absolute in the direct mode
  const arrayPath = `/sessions/${sessionId}/datasets/array`;
  const arrayUrl = new URL(api.address("session-db") + arrayPath, baseURL).href;
  pageErrors.allowFailedRequest(500, "session-db", arrayPath);
  pageErrors.allowErrorMessage("Saving groups failed");
  await page.route(
    (url) => url.href.startsWith(arrayUrl),
    (route) => route.fulfill({ status: 500, body: "e2e failure" }),
  );

  await page.locator("ch-selected-files").getByTitle("Actions").locator("visible=true").first().click();
  await page.locator(".dropdown-menu.show").getByText("Define samples").click();
  const modal = page.locator(".modal-content");
  await modal.locator('input[value="single"]').check();
  await modal.getByRole("button", { name: "One file per sample" }).click();
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("ch-toasts .toast").filter({ hasText: "Saving groups failed" })).toBeVisible();
  await expect(modal).toHaveCount(0);

  await textarea.click();
  await textarea.fill("my note");
  await textarea.blur();
  await expect.poll(async () => (await datasetOnServer()).notes).toBe("my note");
  await waitForDevCheck(page);
  expect((await datasetOnServer()).metadataFiles ?? []).toHaveLength(0);
});
