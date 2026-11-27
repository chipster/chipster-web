import { randomUUID } from "node:crypto";

import { Page } from "@playwright/test";

import { expect, fillWhenRendered, test, waitForDevCheck } from "./fixtures";
import {
  createDataset,
  createFilesWithJobs,
  createJob,
  createLabel,
  createSession,
  datasetNode,
  deleteDataset,
  deleteSessions,
  expectLabelShown,
  findSessions,
  getDatasetContent,
  getDatasets,
  getJobs,
  jobsOfFiles,
  labelNamesAndColors,
  labelsOfFiles,
  openSession,
  pickSession,
  TEST_JOB,
  updateJob,
  visualizationTab,
} from "./session-api";

/*
 * Copying the selected files to a new session and to an existing one. Both are in the Actions menu
 * of the selected files and in the workflow graph's right-click menu, and both open the same
 * modals. A file takes its labels along: the destination gets the labels of the copied files (and
 * only those), and the copies refer to them.
 */

async function selectedFilesAction(page: Page, item: string) {
  await page.locator("ch-selected-files").getByTitle("Actions").locator("visible=true").first().click();
  await page.locator(".dropdown-menu.show").getByText(item, { exact: true }).click();
}

// an item of the graph's right-click menu, which d3-context-menu draws outside Angular
async function contextMenuAction(page: Page, datasetId: string, item: string) {
  await datasetNode(page, datasetId).click({ button: "right" });
  const menu = page.locator(".d3-context-menu");
  await expect(menu).toBeVisible();
  await menu.getByText(item, { exact: true }).click();
  await expect(menu).toBeHidden();
}

// the name modal of Copy to new session, which then copies and opens the copy
async function copyToNewSession(page: Page, defaultName: string, copyName: string) {
  const modal = page.getByRole("dialog");
  await expect(modal.getByRole("textbox")).toHaveValue(defaultName);
  await fillWhenRendered(modal.getByRole("textbox"), copyName);
  await modal.getByRole("button", { name: "Copy", exact: true }).click();
}

// the session list modal of Copy to existing session, which then copies and opens the session
async function copyToExistingSession(page: Page, targetName: string) {
  await pickSession(page, "Copy selected files to an existing session", targetName, "Copy");
}

test("selected files are copied with their labels to a new session from the Selected Files menu", async ({
  page,
  pageErrors,
  api,
  sessionId,
}, testInfo) => {
  const name = `e2e ${testInfo.title}`;
  const copyName = `e2e copy ${randomUUID()}`;
  const files = { "a.tsv": "gene\tvalue\ng1\t1\n", "b.txt": "some text\n", "c.txt": "not copied\n" };
  const labelA = await createLabel(api, sessionId, "label-a", "#ff0000");
  const labelB = await createLabel(api, sessionId, "label-b", "#00ff00");
  const labelC = await createLabel(api, sessionId, "label-c", "#0000ff");
  // label-a on both copied files, label-c only on the file that isn't copied
  const aId = await createDataset(
    api,
    sessionId,
    { name: "a.tsv", x: 100, y: 100, labelIds: [labelA] },
    files["a.tsv"],
  );
  const bId = await createDataset(
    api,
    sessionId,
    { name: "b.txt", x: 300, y: 100, labelIds: [labelA, labelB] },
    files["b.txt"],
  );
  await createDataset(api, sessionId, { name: "c.txt", x: 500, y: 100, labelIds: [labelC] }, files["c.txt"]);

  try {
    await openSession(page, sessionId, aId);
    await datasetNode(page, aId).click();
    await datasetNode(page, bId).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files .h6")).toHaveText("2 files");
    await selectedFilesAction(page, "Copy to new session…");
    await copyToNewSession(page, `${name}_part`, copyName);

    // the app sets the copy READY last, after its files, jobs and labels
    await expect
      .poll(async () => (await findSessions(api, copyName)).map((s) => s.state), { timeout: 30_000 })
      .toEqual(["READY"]);
    const copyId = (await findSessions(api, copyName))[0].sessionId;
    const copies = await getDatasets(api, copyId);
    expect(copies.map((d) => d.name).sort()).toEqual(["a.tsv", "b.txt"]);
    for (const dataset of copies) {
      expect(await getDatasetContent(api, copyId, dataset.datasetId)).toBe(files[dataset.name]);
    }

    // the labels of the copied files, each once, and not label-c
    expect(await labelNamesAndColors(api, copyId)).toEqual([
      { name: "label-a", color: "#ff0000" },
      { name: "label-b", color: "#00ff00" },
    ]);
    expect(await labelsOfFiles(api, copyId)).toEqual({
      "a.tsv": [["label-a"]],
      "b.txt": [["label-a", "label-b"]],
    });
    const copyOfA = copies.find((d) => d.name === "a.tsv").datasetId;
    await expectLabelShown(page, copyId, copyOfA, "label-a");

    // the original is unchanged
    expect(await labelsOfFiles(api, sessionId)).toEqual({
      "a.tsv": [["label-a"]],
      "b.txt": [["label-a", "label-b"]],
      "c.txt": [["label-c"]],
    });
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () =>
      (await findSessions(api, copyName)).map((s) => s.sessionId),
    );
  }
});

test("a file is copied with its label to an existing session twice from the graph's right-click menu", async ({
  page,
  pageErrors,
  api,
  sessionId,
}) => {
  const targetName = `e2e copy target ${randomUUID()}`;
  const content = "gene\tvalue\ng1\t1\n";
  const labelA = await createLabel(api, sessionId, "label-a", "#ff0000");
  const aId = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100, labelIds: [labelA] }, content);
  await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "not copied\n");
  const targetId = await createSession(api, targetName);

  try {
    // the target has a file and a label of its own, which stay as they are
    const targetLabel = await createLabel(api, targetId, "target-label", "#00ff00");
    await createDataset(api, targetId, { name: "t.txt", x: 100, y: 100, labelIds: [targetLabel] }, "target\n");

    await openSession(page, sessionId, aId);
    await contextMenuAction(page, aId, "Copy to existing session…");
    await copyToExistingSession(page, targetName);

    await expect.poll(async () => (await getDatasets(api, targetId)).length, { timeout: 30_000 }).toBe(2);
    const firstCopy = (await getDatasets(api, targetId)).find((d) => d.name === "a.tsv");
    // a new file, not the original moved
    expect(firstCopy.datasetId).not.toBe(aId);
    expect(await getDatasetContent(api, targetId, firstCopy.datasetId)).toBe(content);
    expect(await labelNamesAndColors(api, targetId)).toEqual([
      { name: "label-a", color: "#ff0000" },
      { name: "target-label", color: "#00ff00" },
    ]);
    expect(await labelsOfFiles(api, targetId)).toEqual({
      "a.tsv": [["label-a"]],
      "t.txt": [["target-label"]],
    });
    await expectLabelShown(page, targetId, firstCopy.datasetId, "label-a");

    // a second copy of the same file uses the label that the first copy created, not a new one
    await openSession(page, sessionId, aId);
    await contextMenuAction(page, aId, "Copy to existing session…");
    await copyToExistingSession(page, targetName);

    await expect.poll(async () => (await getDatasets(api, targetId)).length, { timeout: 30_000 }).toBe(3);
    const copies = (await getDatasets(api, targetId)).filter((d) => d.name === "a.tsv");
    expect(new Set(copies.map((d) => d.datasetId)).size).toBe(2);
    expect(await labelNamesAndColors(api, targetId)).toEqual([
      { name: "label-a", color: "#ff0000" },
      { name: "target-label", color: "#00ff00" },
    ]);
    expect(await labelsOfFiles(api, targetId)).toEqual({
      "a.tsv": [["label-a"], ["label-a"]],
      "t.txt": [["target-label"]],
    });
    const secondCopy = copies.find((d) => d.datasetId !== firstCopy.datasetId);
    await expectLabelShown(page, targetId, secondCopy.datasetId, "label-a");

    // the original is unchanged
    expect(await labelsOfFiles(api, sessionId)).toEqual({ "a.tsv": [["label-a"]], "b.txt": [[]] });
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () => [targetId]);
  }
});

test("a label applied in the app after selecting the file goes along to the new session", async ({
  page,
  pageErrors,
  api,
  sessionId,
}, testInfo) => {
  /*
   * The dataset events don't update the datasets of the selection, so the copy has to take the
   * latest copy of each selected file, with the label that the user has just added.
   */
  const name = `e2e ${testInfo.title}`;
  const copyName = `e2e copy ${randomUUID()}`;
  await createLabel(api, sessionId, "my-label");
  const aId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");

  try {
    await openSession(page, sessionId, aId);
    await datasetNode(page, aId).click();
    await visualizationTab(page, "Details").click();
    await page.locator("ch-session-panel").getByTitle("Labels menu").click();
    await page.locator(".dropdown-menu.show button", { hasText: "my-label" }).click();
    await expect(page.locator("ch-single-dataset ch-label-pill")).toContainText("my-label");
    await expect.poll(async () => labelsOfFiles(api, sessionId)).toEqual({ "a.txt": [["my-label"]] });

    await selectedFilesAction(page, "Copy to new session…");
    await copyToNewSession(page, `${name}_part`, copyName);

    await expect
      .poll(async () => (await findSessions(api, copyName)).map((s) => s.state), { timeout: 30_000 })
      .toEqual(["READY"]);
    const copyId = (await findSessions(api, copyName))[0].sessionId;
    expect(await labelsOfFiles(api, copyId)).toEqual({ "a.txt": [["my-label"]] });
    const copyOfA = (await getDatasets(api, copyId))[0].datasetId;
    await expectLabelShown(page, copyId, copyOfA, "my-label");
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () =>
      (await findSessions(api, copyName)).map((s) => s.sessionId),
    );
  }
});

test("a file whose job is gone is copied to a new session without the job", async ({
  page,
  pageErrors,
  api,
  sessionId,
}, testInfo) => {
  const name = `e2e ${testInfo.title}`;
  const copyName = `e2e copy ${randomUUID()}`;
  const labelId = await createLabel(api, sessionId, "label-a", "#ff0000");
  const { madeId, orphanId, runningId } = await createFilesWithJobs(api, sessionId, labelId);

  try {
    await openSession(page, sessionId, madeId);
    await datasetNode(page, madeId).click();
    await datasetNode(page, orphanId).click({ modifiers: ["ControlOrMeta"] });
    await datasetNode(page, runningId).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files .h6")).toHaveText("3 files");
    await selectedFilesAction(page, "Copy to new session…");
    await copyToNewSession(page, `${name}_part`, copyName);

    // the copy is finished and set READY, not left half-made in IMPORT
    await expect
      .poll(async () => (await findSessions(api, copyName)).map((s) => s.state), { timeout: 30_000 })
      .toEqual(["READY"]);
    const copyId = (await findSessions(api, copyName))[0].sessionId;
    expect(await jobsOfFiles(api, copyId)).toEqual({
      "made.txt": ["Kept tool"],
      "orphan.txt": [null],
      "running.txt": [null],
    });
    expect(await labelsOfFiles(api, copyId)).toEqual({
      "made.txt": [[]],
      "orphan.txt": [["label-a"]],
      "running.txt": [[]],
    });
    const copyOfOrphan = (await getDatasets(api, copyId)).find((d) => d.name === "orphan.txt").datasetId;
    await expectLabelShown(page, copyId, copyOfOrphan, "label-a");
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () =>
      (await findSessions(api, copyName)).map((s) => s.sessionId),
    );
  }
});

test("a file whose job is gone is copied to an existing session without the job", async ({
  page,
  pageErrors,
  api,
  sessionId,
}) => {
  const targetName = `e2e copy target ${randomUUID()}`;
  const labelId = await createLabel(api, sessionId, "label-a", "#ff0000");
  const { madeId, orphanId, runningId } = await createFilesWithJobs(api, sessionId, labelId);
  const targetId = await createSession(api, targetName);

  try {
    await openSession(page, sessionId, madeId);
    await datasetNode(page, madeId).click();
    await datasetNode(page, orphanId).click({ modifiers: ["ControlOrMeta"] });
    await datasetNode(page, runningId).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files .h6")).toHaveText("3 files");
    await contextMenuAction(page, orphanId, "Copy to existing session…");
    await copyToExistingSession(page, targetName);

    // the app creates the jobs in a request of their own after the files
    await expect
      .poll(async () => jobsOfFiles(api, targetId), { timeout: 30_000 })
      .toEqual({ "made.txt": ["Kept tool"], "orphan.txt": [null], "running.txt": [null] });
    expect(await labelsOfFiles(api, targetId)).toEqual({
      "made.txt": [[]],
      "orphan.txt": [["label-a"]],
      "running.txt": [[]],
    });
    const copyOfOrphan = (await getDatasets(api, targetId)).find((d) => d.name === "orphan.txt").datasetId;
    await expectLabelShown(page, targetId, copyOfOrphan, "label-a");
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () => [targetId]);
  }
});

/*
 * A job made two files, and only one of them is selected. The copy of the job lists both outputs,
 * but refers only to the copied file: the other output doesn't point at the file of the source
 * session, which the target doesn't have.
 */
test("the copy of a job refers only to the outputs that are copied with it", async ({
  page,
  pageErrors,
  api,
  sessionId,
}) => {
  const targetName = `e2e copy target ${randomUUID()}`;
  // the outputs need the files' ids, and a finished job can't be changed: the job finishes last
  const jobId = await createJob(api, sessionId, { ...TEST_JOB, toolName: "Two outputs" });
  const out1Id = await createDataset(api, sessionId, { name: "out1.txt", x: 100, y: 100, sourceJob: jobId }, "1\n");
  const out2Id = await createDataset(api, sessionId, { name: "out2.txt", x: 300, y: 100, sourceJob: jobId }, "2\n");
  await updateJob(api, sessionId, jobId, {
    state: "COMPLETED",
    outputs: [
      { outputId: "out1", displayName: "out1.txt", datasetId: out1Id },
      { outputId: "out2", displayName: "out2.txt", datasetId: out2Id },
    ],
  });
  const targetId = await createSession(api, targetName);

  try {
    await openSession(page, sessionId, out1Id);
    await datasetNode(page, out1Id).click();
    await expect(page.locator("ch-selected-files .h6")).toHaveText("out1.txt");
    await contextMenuAction(page, out1Id, "Copy to existing session…");
    await copyToExistingSession(page, targetName);

    await expect
      .poll(async () => jobsOfFiles(api, targetId), { timeout: 30_000 })
      .toEqual({ "out1.txt": ["Two outputs"] });
    const copyOfOut1 = (await getDatasets(api, targetId)).find((d) => d.name === "out1.txt").datasetId;
    expect((await getJobs(api, targetId)).map((j) => j.outputs)).toEqual([
      [
        { outputId: "out1", displayName: "out1.txt", datasetId: copyOfOut1 },
        { outputId: "out2", displayName: "out2.txt", datasetId: null },
      ],
    ]);
    await expect(page).toHaveURL(new RegExp(`/analyze/${targetId}$`), { timeout: 30_000 });
    await expect(datasetNode(page, copyOfOut1)).toBeVisible({ timeout: 30_000 });
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () => [targetId]);
  }
});

/*
 * A selected file that is deleted while the session list of Copy to existing session is open,
 * e.g. by a collaborator, is left out of the copy, whose file would be gone.
 */
test("a file deleted while the copy modal is open is left out of the copy", async ({
  page,
  pageErrors,
  api,
  sessionId,
}) => {
  const targetName = `e2e copy target ${randomUUID()}`;
  const aId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  const bId = await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "b\n");
  const targetId = await createSession(api, targetName);

  try {
    await openSession(page, sessionId, aId);
    await datasetNode(page, aId).click();
    await datasetNode(page, bId).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files .h6")).toHaveText("2 files");
    await contextMenuAction(page, bId, "Copy to existing session…");
    await expect(page.getByRole("dialog")).toContainText("Copy selected files to an existing session");
    await deleteDataset(api, sessionId, bId);
    // the app has heard of the deletion
    await expect(datasetNode(page, bId)).toBeHidden();
    await copyToExistingSession(page, targetName);

    await expect(page).toHaveURL(new RegExp(`/analyze/${targetId}$`), { timeout: 30_000 });
    expect((await getDatasets(api, targetId)).map((d) => d.name)).toEqual(["a.txt"]);
    const copyOfA = (await getDatasets(api, targetId))[0].datasetId;
    await expect(datasetNode(page, copyOfA)).toBeVisible({ timeout: 30_000 });
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () => [targetId]);
  }
});
