import { Page, Route } from "@playwright/test";

import { expect, PageErrors, test, waitForDevCheck } from "./fixtures";
import {
  Api,
  createDataset,
  createLabel,
  datasetNode,
  openSession,
  updateDataset,
  visualizationTab,
} from "./session-api";

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

// opens the details of a file with the notes "old note" and types "new note" into them while the server
// fails the saves of the file. Returns the notes box, the file on the server, and a function that lets the
// saves through again.
async function failNotesSave(
  {
    page,
    api,
    baseURL,
    sessionId,
    pageErrors,
  }: { page: Page; api: Api; baseURL: string; sessionId: string; pageErrors: PageErrors },
  datasetId: string,
) {
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  const textarea = page.locator("ch-single-dataset textarea");
  await expect(textarea).toHaveValue("old note");
  const datasetOnServer = async () =>
    (await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`)).json();

  // the address is relative in the proxy mode and absolute in the direct mode
  const datasetPath = `/sessions/${sessionId}/datasets/${datasetId}`;
  const datasetUrl = new URL(api.address("session-db") + datasetPath, baseURL).href;
  pageErrors.allowFailedRequest(500, "session-db", datasetPath);
  pageErrors.allowErrorMessage("saving notes failed");
  const failSave = (route: Route) =>
    route.request().method() === "PUT" ? route.fulfill({ status: 500, body: "e2e failure" }) : route.fallback();
  await page.route(datasetUrl, failSave);

  await textarea.click();
  await textarea.fill("new note");
  await textarea.blur();
  await expect(page.locator("ch-toasts .toast").filter({ hasText: "saving notes failed" })).toBeVisible();
  // the typed text stays for a retry or a copy
  await expect(textarea).toHaveValue("new note");
  expect((await datasetOnServer()).notes).toBe("old note");

  return { textarea, datasetOnServer, allowSaves: () => page.unroute(datasetUrl, failSave) };
}

test("notes that fail to save stay in the box but don't leak into the next save", async ({
  page,
  api,
  baseURL,
  sessionId,
  pageErrors,
}) => {
  // the details put the notes into the session's copy of the file before the save, so that a change sent
  // right after it carries them too. A failed save has to put the old notes back there, or the next
  // whole-object update (here a label) sends the notes after all.
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100, notes: "old note" }, "a\n");
  await createLabel(api, sessionId, "my-label");
  const { datasetOnServer, allowSaves } = await failNotesSave({ page, api, baseURL, sessionId, pageErrors }, datasetId);

  // the next save of the file sends the old notes
  await allowSaves();
  await page.locator("ch-session-panel").getByTitle("Labels menu").click();
  await page.locator(".dropdown-menu.show button", { hasText: "my-label" }).click();
  await expect.poll(async () => (await datasetOnServer()).labelIds).toHaveLength(1);
  expect((await datasetOnServer()).notes).toBe("old note");
  await expect(page.locator("ch-single-dataset ch-label-pill")).toContainText("my-label");
  await waitForDevCheck(page);
});

test("notes that failed to save can be saved again", async ({ page, api, baseURL, sessionId, pageErrors }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100, notes: "old note" }, "a\n");
  const { textarea, datasetOnServer, allowSaves } = await failNotesSave(
    { page, api, baseURL, sessionId, pageErrors },
    datasetId,
  );

  // leaving the box again saves the kept text, without typing it again
  await allowSaves();
  await textarea.click();
  await textarea.blur();
  await expect.poll(async () => (await datasetOnServer()).notes).toBe("new note");
  await expect(textarea).toHaveValue("new note");
  await waitForDevCheck(page);
});
