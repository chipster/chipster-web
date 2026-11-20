import { readFile } from "node:fs/promises";

import { expect, test } from "./fixtures";
import {
  createDataset,
  createJob,
  datasetNode,
  getDatasets,
  openSession,
  TEST_JOB,
  visualizationTab,
} from "./session-api";

/*
 * The history of a file, from Show history in the file details: the steps from the uploaded files
 * to the selected one, through the inputs of the jobs that made each file.
 */

test("the history shows the steps oldest first and exports the chosen fields", async ({ page, api, sessionId }) => {
  // uploaded a.txt and b.txt → First tool → c.txt → Second tool → d.txt
  // as session-db returns it, which the export writes as it is
  const created = "2024-05-06T07:08:09Z";
  const completed = { ...TEST_JOB, state: "COMPLETED", created };
  const aId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  const bId = await createDataset(api, sessionId, { name: "b.txt", x: 200, y: 100 }, "b\n");
  const firstJobId = await createJob(api, sessionId, {
    ...completed,
    toolName: "First tool",
    parameters: [{ parameterId: "threshold", displayName: "Threshold", value: "0.5" }],
    // the name of the input from the tool, and an input with an empty one
    inputs: [
      { inputId: "input1", displayName: "First input", datasetId: aId, datasetName: "a.txt" },
      { inputId: "input2", displayName: "", datasetId: bId, datasetName: "b.txt" },
    ],
  });
  const cId = await createDataset(api, sessionId, { name: "c.txt", x: 150, y: 200, sourceJob: firstJobId }, "c\n");
  const secondJobId = await createJob(api, sessionId, {
    ...completed,
    toolName: "Second tool",
    // a parameter with a name, and one without
    parameters: [
      { parameterId: "method", displayName: "Method", value: "fast" },
      { parameterId: "seed", value: "42" },
    ],
    // a job from before 11/2023 has the file name in displayName and no datasetName
    inputs: [{ inputId: "input", displayName: "c.txt", datasetId: cId }],
  });
  const dId = await createDataset(api, sessionId, { name: "d.txt", x: 150, y: 300, sourceJob: secondJobId }, "d\n");

  await openSession(page, sessionId, dId);
  await datasetNode(page, dId).click();
  await visualizationTab(page, "Details").click();
  await page.locator("ch-single-dataset").getByText("Show history").click();
  const modal = page.locator("ch-dataset-history-modal");
  await expect(modal.locator(".modal-title")).toHaveText("History of d.txt");

  // the rows of a field, in one step or in all of them
  const steps = modal.locator(".step");
  const rows = (field: string, step?: number) =>
    (step == null ? steps : steps.nth(step)).locator("> table > tbody > tr", { hasText: field });
  const value = (field: string, step: number) => rows(field, step).locator("td.w-100");
  const stepTitle = (step: number) => steps.nth(step).locator(".step-header");
  // a date as the modal shows it, formatted in the browser for its locale and time zone
  const shownDate = (date: string) =>
    page.evaluate((d) => new Date(d).toLocaleDateString() + " " + new Date(d).toLocaleTimeString(), date);
  const uploadedCreated = Object.fromEntries((await getDatasets(api, sessionId)).map((d) => [d.name, d.created]));

  // the uploaded files first, then the job steps. In this chain each job's step comes after the steps
  // of its inputs, but the modal only reverses a breadth-first search of the ancestors, which doesn't
  // guarantee that in every graph. The order of the uploaded files between themselves is whatever the
  // search gives, so it isn't checked.
  await expect(rows("Result file:")).toHaveCount(4);
  const resultFiles = await rows("Result file:").locator("td.w-100").allInnerTexts();
  expect(resultFiles.slice(0, 2).sort()).toEqual(["a.txt", "b.txt"]);
  expect(resultFiles.slice(2)).toEqual(["c.txt", "d.txt"]);

  for (const uploaded of [0, 1]) {
    await expect(value("Tool:", uploaded)).toHaveText("not available");
    await expect(rows("Input files:", uploaded)).toHaveCount(1);
    await expect(rows("Input files:", uploaded).locator("td td")).toHaveCount(0);
    await expect(value("Date:", uploaded)).toHaveText(await shownDate(uploadedCreated[resultFiles[uploaded]]));
  }
  await expect(stepTitle(2)).toHaveText("Step 3");
  await expect(value("Tool:", 2)).toHaveText("Test / First tool");
  await expect(rows("Parameters:", 2)).toContainText("Threshold");
  await expect(rows("Parameters:", 2)).toContainText("0.5");
  const firstInputs = rows("Input files:", 2).locator("td tr");
  await expect(firstInputs.nth(0).locator("td")).toHaveText(["First input", "a.txt"]);
  await expect(firstInputs.nth(1).locator("td")).toHaveText(["input2", "b.txt"]);
  await expect(value("Date:", 2)).toHaveText(await shownDate(created));
  await expect(value("Tool:", 3)).toHaveText("Test / Second tool");
  await expect(rows("Parameters:", 3).locator("tr").nth(0).locator("td")).toHaveText(["Method", "fast"]);
  await expect(rows("Parameters:", 3).locator("tr").nth(1).locator("td")).toHaveText(["seed", "42"]);
  await expect(rows("Input files:", 3).locator("td tr").locator("td")).toHaveText(["input", "c.txt"]);

  const exportText = async () => {
    await modal.getByRole("button", { name: "Export" }).click();
    const downloading = page.waitForEvent("download");
    await modal.getByRole("button", { name: "Download as text file" }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(`history-d.txt-${dId}.txt`);
    return readFile(await download.path(), "utf-8");
  };
  // the steps of the export, separated by a line of dashes whether they have titles or not
  const exportedSteps = (text: string) => text.split(/^-{10,}\n/m).slice(1);

  // all the fields that are shown, with the step titles
  const text = await exportText();
  expect(text).toMatch(/^History of d\.txt\n/);
  expect(text.match(/^Step \d+$/gm)).toEqual(["Step 1", "Step 2", "Step 3", "Step 4"]);
  const exported = exportedSteps(text);
  expect(exported).toHaveLength(4);
  // the same steps in the same order as in the modal
  for (const [i, name] of resultFiles.entries()) {
    expect(exported[i]).toContain(`Result file: ${name}\n`);
  }
  for (const uploaded of [0, 1]) {
    expect(exported[uploaded]).toContain("Tool: not available\n");
    expect(exported[uploaded]).toContain("Parameters:\n\n");
    expect(exported[uploaded]).toContain(`Date: ${uploadedCreated[resultFiles[uploaded]]}\n`);
  }
  expect(exported[2]).toContain("Tool: Test / First tool\n");
  expect(exported[2]).toContain("\tFirst input: a.txt\n");
  expect(exported[2]).toContain("\tinput2: b.txt\n");
  expect(exported[2]).toContain("Parameters:\n\tThreshold: 0.5\n");
  expect(exported[2]).toContain(`Date: ${created}\n`);
  expect(exported[3]).toContain("Tool: Test / Second tool\n");
  expect(exported[3]).toContain("\tinput: c.txt\n");
  expect(exported[3]).toContain("Parameters:\n\tMethod: fast\n\tseed: 42\n");

  // fields turned off are left out of the steps and of the export
  await modal.getByLabel("Parameters").uncheck();
  await expect(rows("Parameters:")).toHaveCount(0);
  await expect(rows("Tool:", 3)).toBeVisible();
  await modal.getByLabel("Step title").uncheck();
  await expect(steps.locator(".step-header")).toHaveCount(0);
  await expect(steps).toHaveCount(4);

  const reduced = await exportText();
  expect(reduced).not.toContain("Parameters:");
  expect(reduced).not.toContain("Threshold");
  expect(reduced).not.toMatch(/^Step \d+$/m);
  expect(exportedSteps(reduced)).toHaveLength(4);
  expect(exportedSteps(reduced)[3]).toContain("Tool: Test / Second tool\n");
  expect(exportedSteps(reduced)[3]).toContain("Result file: d.txt\n");
});
