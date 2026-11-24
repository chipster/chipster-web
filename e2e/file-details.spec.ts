import { Page } from "@playwright/test";

import { expect, PageErrors, test, waitForDevCheck } from "./fixtures";
import {
  Api,
  createDataset,
  createLabel,
  datasetNode,
  openSession,
  selectedInGraph,
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

type NotesFixtures = { page: Page; api: Api; baseURL: string; sessionId: string; pageErrors: PageErrors };

// the notes box of the file in the details
async function openNotes(page: Page, sessionId: string, datasetId: string) {
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  return page.locator("ch-single-dataset textarea");
}

async function notesOnServer(api: Api, sessionId: string, datasetId: string): Promise<string | undefined> {
  const response = await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`);
  expect(response.ok()).toBe(true);
  return (await response.json()).notes;
}

function saveFailedToast(page: Page) {
  return page.locator("ch-toasts .toast").filter({ hasText: "saving notes failed" });
}

// makes the server fail the saves of the file. With hold, the failures wait for release(), so that other
// things can happen during a save. allowSaves() lets the later saves through, also while a failure is held.
async function failSaves(
  { page, api, baseURL, sessionId, pageErrors }: NotesFixtures,
  datasetId: string,
  hold = false,
) {
  // the address is relative in the proxy mode and absolute in the direct mode
  const datasetPath = `/sessions/${sessionId}/datasets/${datasetId}`;
  const datasetUrl = new URL(api.address("session-db") + datasetPath, baseURL).href;
  pageErrors.allowFailedRequest(500, "session-db", datasetPath);
  pageErrors.allowErrorMessage("saving notes failed");
  let release = () => {};
  const released = hold
    ? new Promise<void>((resolve) => {
        release = resolve;
      })
    : Promise.resolve();
  // a flag rather than unroute, which would hand over a held request to the server
  let failing = true;
  await page.route(datasetUrl, async (route) => {
    if (failing && route.request().method() === "PUT") {
      await released;
      return route.fulfill({ status: 500, body: "e2e failure" });
    }
    return route.fallback();
  });
  return {
    release,
    allowSaves: () => {
      failing = false;
    },
    // call before the action that saves. If the test fails before awaiting it, the wait fails when the page
    // closes, which mustn't add an unhandled error to the test's own
    saveSent: () => {
      const sent = page.waitForRequest((request) => request.method() === "PUT" && request.url() === datasetUrl);
      sent.catch(() => {});
      return sent;
    },
  };
}

// opens the details of a file with the notes "old note" and types "new note" into them while the server
// fails the saves of the file. Returns the notes box and a function that lets the saves through again.
async function typeNotesThatFailToSave(fixtures: NotesFixtures, datasetId: string) {
  const { page, api, sessionId } = fixtures;
  const textarea = await openNotes(page, sessionId, datasetId);
  await expect(textarea).toHaveValue("old note");
  const { allowSaves } = await failSaves(fixtures, datasetId);

  await textarea.click();
  await textarea.fill("new note");
  await textarea.blur();
  await expect(saveFailedToast(page)).toBeVisible();
  // the typed text stays for a retry or a copy
  await expect(textarea).toHaveValue("new note");
  expect(await notesOnServer(api, sessionId, datasetId)).toBe("old note");
  return { textarea, allowSaves };
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
  // whole-object update (here a label) sends the notes after all. The box keeps the typed text over
  // the label's new copy of the file.
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100, notes: "old note" }, "a\n");
  await createLabel(api, sessionId, "my-label");
  const { textarea, allowSaves } = await typeNotesThatFailToSave(
    { page, api, baseURL, sessionId, pageErrors },
    datasetId,
  );

  // the next save of the file sends the old notes
  allowSaves();
  await page.locator("ch-session-panel").getByTitle("Labels menu").click();
  await page.locator(".dropdown-menu.show button", { hasText: "my-label" }).click();
  await expect(page.locator("ch-single-dataset ch-label-pill")).toContainText("my-label");
  await expect
    .poll(async () => (await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`)).json())
    .toMatchObject({ labelIds: [expect.any(String)], notes: "old note" });
  await expect(textarea).toHaveValue("new note");
  await waitForDevCheck(page);
});

test("notes that failed to save can be saved again", async ({ page, api, baseURL, sessionId, pageErrors }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100, notes: "old note" }, "a\n");
  const { textarea, allowSaves } = await typeNotesThatFailToSave(
    { page, api, baseURL, sessionId, pageErrors },
    datasetId,
  );

  // leaving the box again saves the kept text, without typing it again
  allowSaves();
  await textarea.click();
  await textarea.blur();
  await expect.poll(() => notesOnServer(api, sessionId, datasetId)).toBe("new note");
  await expect(textarea).toHaveValue("new note");
  await waitForDevCheck(page);
});

test("notes that failed to save give way to notes changed elsewhere", async ({
  page,
  api,
  baseURL,
  sessionId,
  pageErrors,
}) => {
  // a retry of the kept text would overwrite the other change without a warning
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100, notes: "old note" }, "a\n");
  const { textarea } = await typeNotesThatFailToSave({ page, api, baseURL, sessionId, pageErrors }, datasetId);

  await updateDataset(api, sessionId, datasetId, { notes: "other note" });
  await expect(textarea).toHaveValue("other note");
  // and don't come back when the notes are changed back
  await updateDataset(api, sessionId, datasetId, { notes: "old note" });
  await expect(textarea).toHaveValue("old note");
  await waitForDevCheck(page);
});

test("notes that fail to save stay in the box over a label applied elsewhere during the save", async ({
  page,
  api,
  baseURL,
  sessionId,
  pageErrors,
}) => {
  // the label's event replaces the file's copy during the save, but the notes are still the old ones
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100, notes: "old note" }, "a\n");
  const labelId = await createLabel(api, sessionId, "my-label");
  const textarea = await openNotes(page, sessionId, datasetId);
  await expect(textarea).toHaveValue("old note");
  const { release, saveSent } = await failSaves({ page, api, baseURL, sessionId, pageErrors }, datasetId, true);

  const sent = saveSent();
  await textarea.click();
  await textarea.fill("new note");
  await textarea.blur();
  await sent;
  await updateDataset(api, sessionId, datasetId, { labelIds: [labelId] });
  await expect(page.locator("ch-single-dataset ch-label-pill")).toContainText("my-label");
  release();
  await expect(saveFailedToast(page)).toBeVisible();
  await expect(textarea).toHaveValue("new note");
  expect(await notesOnServer(api, sessionId, datasetId)).toBe("old note");
  await waitForDevCheck(page);
});

test("notes whose save fails after another file is selected stay out of its box", async ({
  page,
  api,
  baseURL,
  sessionId,
  pageErrors,
}) => {
  // the box of the other file shows its own notes, also when they are the same as the first file's, here
  // none like in most files, and also after the first file's save fails
  const aId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  const bId = await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "b\n");
  const textarea = await openNotes(page, sessionId, aId);
  await expect(textarea).toHaveValue("");
  const { release, saveSent } = await failSaves({ page, api, baseURL, sessionId, pageErrors }, aId, true);

  await textarea.click();
  await textarea.fill("new note");
  // selecting the other file leaves the box, which saves the notes
  const sent = saveSent();
  await datasetNode(page, bId).click();
  await sent;
  await expect.poll(() => selectedInGraph(page)).toEqual([bId]);
  await expect(textarea).toHaveValue("");
  release();
  await expect(saveFailedToast(page)).toBeVisible();
  await expect(textarea).toHaveValue("");
  expect(await notesOnServer(api, sessionId, aId)).toBeFalsy();
  expect(await notesOnServer(api, sessionId, bId)).toBeFalsy();
  await waitForDevCheck(page);
});

test("an older save that fails doesn't bring its notes back over newer ones", async ({
  page,
  api,
  baseURL,
  sessionId,
  pageErrors,
}) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100, notes: "old note" }, "a\n");
  const textarea = await openNotes(page, sessionId, datasetId);
  await expect(textarea).toHaveValue("old note");
  const { release, allowSaves, saveSent } = await failSaves(
    { page, api, baseURL, sessionId, pageErrors },
    datasetId,
    true,
  );

  // the first save waits for its failure while the second one, back to the old notes, goes through. The
  // notes on the server are then the same as before the first save, so only the save's own copy can tell
  // that something newer was saved during it.
  const sent = saveSent();
  await textarea.click();
  await textarea.fill("first note");
  await textarea.blur();
  await sent;
  allowSaves();
  const secondSent = saveSent();
  await textarea.click();
  await textarea.fill("old note");
  await textarea.blur();
  expect((await (await secondSent).response())?.ok()).toBe(true);

  release();
  await expect(saveFailedToast(page)).toBeVisible();
  await expect(textarea).toHaveValue("old note");
  expect(await notesOnServer(api, sessionId, datasetId)).toBe("old note");
  await waitForDevCheck(page);
});
