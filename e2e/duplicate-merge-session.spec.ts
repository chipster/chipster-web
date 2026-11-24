import { randomUUID } from "node:crypto";

import { Page } from "@playwright/test";

import { expect, fillWhenRendered, test, waitForDevCheck } from "./fixtures";
import {
  COPIED_JOBS_OF_FILES,
  COPIED_LABELS,
  COPIED_LABELS_OF_FILES,
  createDataset,
  createLabel,
  createLabelledFilesWithJobs,
  createSession,
  datasetNode,
  deleteSessions,
  expectLabelShown,
  findSessions,
  getDatasets,
  getSession,
  jobsOfFiles,
  labelNamesAndColors,
  labelsOfFiles,
  nodeCenter,
  openSession,
  pickSession,
  SOURCE_JOBS_OF_FILES,
} from "./session-api";

/*
 * Duplicate and Merge session in the session view. Duplicate copies a normal session to a new one
 * and opens the copy, but only renames a temporary session and saves it. Merge copies the files
 * of another session to the right of the current session's files. Both take the labels and the
 * jobs of the files along like copying the selected files does, see copy-to-session.spec.ts, and
 * Duplicate in the sessions list, see session-list.spec.ts.
 */

async function sessionMenuAction(page: Page, item: string) {
  const details = page.locator("ch-session-details");
  await details.getByTitle("Actions").click();
  await details.getByRole("button", { name: item }).click();
}

// the name modal of Duplicate
async function duplicateWithName(page: Page, defaultName: string, copyName: string) {
  const modal = page.getByRole("dialog");
  await expect(modal.getByRole("textbox")).toHaveValue(defaultName);
  await fillWhenRendered(modal.getByRole("textbox"), copyName);
  await modal.getByRole("button", { name: "Duplicate", exact: true }).click();
}

const MERGE_TITLE = "Select a session to merge into this session";

test("a session is duplicated with its labels and jobs from the session menu", async ({
  page,
  pageErrors,
  api,
  sessionId,
}, testInfo) => {
  const name = `e2e ${testInfo.title}`;
  const copyName = `e2e copy ${randomUUID()}`;
  const { madeId } = await createLabelledFilesWithJobs(api, sessionId);

  try {
    await openSession(page, sessionId, madeId);
    await sessionMenuAction(page, "Duplicate…");
    await duplicateWithName(page, `${name}_copy`, copyName);

    // the app sets the copy READY last, after its files, jobs and labels
    await expect
      .poll(async () => (await findSessions(api, copyName)).map((s) => s.state), { timeout: 30_000 })
      .toEqual(["READY"]);
    const copyId = (await findSessions(api, copyName))[0].sessionId;
    expect(copyId).not.toBe(sessionId);
    expect(await labelNamesAndColors(api, copyId)).toEqual(COPIED_LABELS);
    expect(await labelsOfFiles(api, copyId)).toEqual(COPIED_LABELS_OF_FILES);
    expect(await jobsOfFiles(api, copyId)).toEqual(COPIED_JOBS_OF_FILES);

    // the app opens the copy
    const copyOfOrphan = (await getDatasets(api, copyId)).find((d) => d.name === "orphan.txt").datasetId;
    await expectLabelShown(page, copyId, copyOfOrphan, "label-a");

    // the original is unchanged
    expect((await getSession(api, sessionId)).name).toBe(name);
    expect(await labelNamesAndColors(api, sessionId)).toEqual(COPIED_LABELS);
    expect(await labelsOfFiles(api, sessionId)).toEqual(COPIED_LABELS_OF_FILES);
    expect(await jobsOfFiles(api, sessionId)).toEqual(SOURCE_JOBS_OF_FILES);
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () =>
      (await findSessions(api, copyName)).map((s) => s.sessionId),
    );
  }
});

/*
 * A temporary session, like the copy of an example session that the app opens, isn't copied: it
 * gets the new name and is saved as a normal session, which then stays when the user leaves it.
 */
test.describe("temporary session", () => {
  test.use({ sessionState: "TEMPORARY_UNMODIFIED" });

  test("a temporary session is saved with the new name from the session menu", async ({ page, api, sessionId }) => {
    // unique: a copy would have this name too, so the session of this name has to be the same one
    const newName = `e2e copy ${randomUUID()}`;
    const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
    const temporaryName = (await getSession(api, sessionId)).name;

    await openSession(page, sessionId, datasetId);
    await sessionMenuAction(page, "Duplicate…");
    await duplicateWithName(page, `${temporaryName}_copy`, newName);

    await expect
      .poll(async () => (await findSessions(api, newName)).map((s) => [s.sessionId, s.state]), { timeout: 30_000 })
      .toEqual([[sessionId, "READY"]]);
    await expect(page.locator("ch-session-details .h6")).toHaveText(newName);
    expect((await getDatasets(api, sessionId)).map((d) => d.name)).toEqual(["a.txt"]);

    // a saved session is left without asking, and kept
    await page.locator("#navbar").getByRole("link", { name: "Sessions" }).click();
    await expect(page).toHaveURL(/\/sessions$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect((await getSession(api, sessionId)).state).toBe("READY");
    await waitForDevCheck(page);
  });
});

/*
 * The current session has a file and a label of its own, which stay as they are. The source is
 * merged twice: the files are then there twice, but each label only once, because the copy reuses
 * a label of the same id.
 */
test("a session is merged twice with its labels and jobs from the session menu", async ({
  page,
  pageErrors,
  api,
  sessionId,
}) => {
  const sourceName = `e2e merge source ${randomUUID()}`;
  const ownLabel = await createLabel(api, sessionId, "own-label", "#0000ff");
  const ownId = await createDataset(api, sessionId, { name: "own.txt", x: 100, y: 100, labelIds: [ownLabel] }, "own\n");
  const sourceId = await createSession(api, sourceName);

  try {
    await createLabelledFilesWithJobs(api, sourceId);
    const sourceDatasetIds = (await getDatasets(api, sourceId)).map((d) => d.datasetId);

    await openSession(page, sessionId, ownId);
    await sessionMenuAction(page, "Merge session…");
    await pickSession(page, MERGE_TITLE, sourceName, "Merge");

    // the app creates the jobs in a request of their own after the files
    await expect
      .poll(async () => jobsOfFiles(api, sessionId), { timeout: 30_000 })
      .toEqual({ "own.txt": [null], ...COPIED_JOBS_OF_FILES });
    const datasets = await getDatasets(api, sessionId);
    const own = datasets.find((d) => d.datasetId === ownId);
    const merged = datasets.filter((d) => d.datasetId !== ownId);
    expect(merged).toHaveLength(3);
    for (const dataset of merged) {
      expect(sourceDatasetIds).not.toContain(dataset.datasetId);
      expect(dataset.x, dataset.name).toBeGreaterThan(own.x);
    }
    expect(own).toMatchObject({ name: "own.txt", x: 100, y: 100 });
    expect(await labelNamesAndColors(api, sessionId)).toEqual([
      ...COPIED_LABELS,
      { name: "own-label", color: "#0000ff" },
    ]);
    expect(await labelsOfFiles(api, sessionId)).toEqual({ "own.txt": [["own-label"]], ...COPIED_LABELS_OF_FILES });
    /*
     * The page shows the merged files with their labels. The second merge reuses the labels that
     * the page knows, so it has to have heard of them first.
     */
    const mergedOrphan = merged.find((d) => d.name === "orphan.txt").datasetId;
    await expectLabelShown(page, sessionId, mergedOrphan, "label-b");

    // the session menu is shown when no file is selected: a click on the background above the file clears the selection
    const center = await nodeCenter(page, mergedOrphan);
    await page.mouse.click(center.x, center.y - 60);
    await expect(page.locator("ch-session-details")).toBeVisible();
    await sessionMenuAction(page, "Merge session…");
    await pickSession(page, MERGE_TITLE, sourceName, "Merge");

    await expect
      .poll(async () => jobsOfFiles(api, sessionId), { timeout: 30_000 })
      .toEqual({
        "own.txt": [null],
        "made.txt": ["Kept tool", "Kept tool"],
        "orphan.txt": [null, null],
        "running.txt": [null, null],
      });
    const twice = await getDatasets(api, sessionId);
    expect(new Set(twice.map((d) => d.datasetId)).size).toBe(7);
    expect(await labelNamesAndColors(api, sessionId)).toEqual([
      ...COPIED_LABELS,
      { name: "own-label", color: "#0000ff" },
    ]);
    expect(await labelsOfFiles(api, sessionId)).toEqual({
      "own.txt": [["own-label"]],
      "made.txt": [["label-b"], ["label-b"]],
      "orphan.txt": [
        ["label-a", "label-b"],
        ["label-a", "label-b"],
      ],
      "running.txt": [[], []],
    });

    // the source is unchanged
    expect((await getDatasets(api, sourceId)).map((d) => d.datasetId).sort()).toEqual([...sourceDatasetIds].sort());
    expect(await labelNamesAndColors(api, sourceId)).toEqual(COPIED_LABELS);
    expect(await labelsOfFiles(api, sourceId)).toEqual(COPIED_LABELS_OF_FILES);
    expect(await jobsOfFiles(api, sourceId)).toEqual(SOURCE_JOBS_OF_FILES);
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () => [sourceId]);
  }
});

test("a session is merged from the Add file menu", async ({ page, pageErrors, api, sessionId }) => {
  const sourceName = `e2e merge source ${randomUUID()}`;
  const sourceId = await createSession(api, sourceName);

  try {
    await createDataset(api, sourceId, { name: "a.txt", x: 100, y: 100 }, "a\n");

    await openSession(page, sessionId);
    await page.locator("#addFileDropdownMenuButton").click();
    await page.locator(".dropdown-menu.show").getByRole("button", { name: "Merge session" }).click();
    await pickSession(page, MERGE_TITLE, sourceName, "Merge");

    await expect
      .poll(async () => (await getDatasets(api, sessionId)).map((d) => d.name), { timeout: 30_000 })
      .toEqual(["a.txt"]);
    const merged = (await getDatasets(api, sessionId))[0].datasetId;
    await expect(datasetNode(page, merged)).toBeVisible({ timeout: 30_000 });
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () => [sourceId]);
  }
});
