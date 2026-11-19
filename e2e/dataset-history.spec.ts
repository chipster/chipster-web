import { readFile } from "node:fs/promises";

import { expect, test } from "./fixtures";
import { createDataset, createJob, datasetNode, openSession, TEST_JOB, visualizationTab } from "./session-api";

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
    // the name of the input from the tool, and an input without one
    inputs: [
      { inputId: "input1", displayName: "First input", datasetId: aId, datasetName: "a.txt" },
      { inputId: "input2", datasetId: bId, datasetName: "b.txt" },
    ],
  });
  const cId = await createDataset(api, sessionId, { name: "c.txt", x: 150, y: 200, sourceJob: firstJobId }, "c\n");
  const secondJobId = await createJob(api, sessionId, {
    ...completed,
    toolName: "Second tool",
    parameters: [{ parameterId: "method", displayName: "Method", value: "fast" }],
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
  const stepTitle = (step: number) => steps.nth(step).locator(".step-header");

  // the uploaded files first, then each job's step after the steps of its inputs. The order of the
  // uploaded files between themselves is whatever the ancestor search gives, so it isn't checked.
  const resultFiles = await rows("Result file:").locator("td.w-100").allInnerTexts();
  expect(resultFiles.slice(0, 2).sort()).toEqual(["a.txt", "b.txt"]);
  expect(resultFiles.slice(2)).toEqual(["c.txt", "d.txt"]);

  for (const uploaded of [0, 1]) {
    await expect(rows("Tool:", uploaded)).toContainText("not available");
    await expect(rows("Input files:", uploaded).locator("td td")).toHaveCount(0);
  }
  await expect(stepTitle(2)).toHaveText("Step 3");
  await expect(rows("Tool:", 2)).toContainText("Test / First tool");
  await expect(rows("Parameters:", 2)).toContainText("Threshold");
  await expect(rows("Parameters:", 2)).toContainText("0.5");
  const firstInputs = rows("Input files:", 2).locator("td tr");
  await expect(firstInputs.nth(0).locator("td")).toHaveText(["First input", "a.txt"]);
  await expect(firstInputs.nth(1).locator("td")).toHaveText(["input2", "b.txt"]);
  // the date in the locale and time zone of the browser, formatted there like the app does
  const shownDate = await page.evaluate((date) => new Date(date).toLocaleDateString(), created);
  await expect(rows("Date:", 2)).toContainText(shownDate);
  await expect(rows("Tool:", 3)).toContainText("Test / Second tool");
  await expect(rows("Parameters:", 3)).toContainText("fast");
  await expect(rows("Input files:", 3).locator("td tr").locator("td")).toHaveText(["input", "c.txt"]);

  // a field turned off is left out of the steps and of the export
  await modal.getByLabel("Parameters").uncheck();
  await expect(rows("Parameters:")).toHaveCount(0);
  await expect(rows("Tool:", 3)).toBeVisible();
  await modal.getByLabel("Step title").uncheck();
  await expect(steps.locator(".step-header")).toHaveCount(0);
  await expect(steps).toHaveCount(4);

  await modal.getByRole("button", { name: "Export" }).click();
  const downloading = page.waitForEvent("download");
  await page.locator(".dropdown-menu.show").getByText("Download as text file").click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe(`history-d.txt-${dId}.txt`);
  const text = await readFile(await download.path(), "utf-8");

  expect(text).toMatch(/^History of d\.txt\n/);
  expect(text).not.toContain("Parameters:");
  expect(text).not.toContain("Threshold");
  // the export numbers the steps itself, the Step title option is only for the modal
  const exportedSteps = text.split(/^Step \d+\n/m).slice(1);
  expect(exportedSteps).toHaveLength(4);
  expect(exportedSteps[0]).toContain("Tool: not available\n");
  expect(exportedSteps[2]).toContain("Tool: Test / First tool\n");
  expect(exportedSteps[2]).toContain("\tFirst input: a.txt\n");
  expect(exportedSteps[2]).toContain("\tinput2: b.txt\n");
  expect(exportedSteps[2]).toContain(`Date: ${created}\n`);
  expect(exportedSteps[2]).toContain("Result file: c.txt\n");
  expect(exportedSteps[3]).toContain("Tool: Test / Second tool\n");
  expect(exportedSteps[3]).toContain("\tinput: c.txt\n");
  expect(exportedSteps[3]).toContain("Result file: d.txt\n");
});
