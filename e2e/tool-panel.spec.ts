import { expect, test } from "./fixtures";
import { createDataset, createJob, datasetNode, openSession, visualizationTab } from "./session-api";

/*
 * The tool panel follows the tool and file selections made elsewhere in the session view, the
 * validation of the tool and the job events.
 */

test("the tool panel follows the selections, the validation and the jobs", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, "a\tb\n1\t2\n");
  await openSession(page, sessionId, datasetId);
  const tools = page.locator("ch-tools");

  // the tool search selects the tool through the store and a setTimeout
  await tools.locator("#searchTool input").fill("Table converter");
  await tools.locator("#searchTool input").press("Enter");
  await expect(tools.locator('[id="tool-button-select_columns.R"]')).toHaveClass(/active/);
  await expect(tools.locator('[id^="category-button-"].active')).toContainText("Utilities");

  // validated without a file: the input is missing
  const runButton = tools.locator(".run-button");
  await expect(runButton).toBeDisabled();
  await expect(tools.locator(".fa-exclamation-circle.text-warning")).toBeVisible();

  // a file selected in the d3 graph
  await datasetNode(page, datasetId).click();
  await expect(runButton).toBeEnabled();
  await expect(tools.locator(".fa-exclamation-circle.text-warning")).toBeHidden();

  // a parameter changed in the parameters modal: the button shows it after the debounce and the validation
  await tools.getByTitle("Edit parameters and inputs").click();
  const modal = page.locator("ch-parameters-modal");
  await modal.locator('ch-tool-parameters input[type="text"]').first().fill("1");
  await expect(tools.locator(".fa-edit.text-primary")).toBeVisible();
  // the modal shows the new validation too: Reset all is enabled
  await expect(modal.getByTitle("Reset all")).toBeEnabled();
  await modal.getByTitle("Reset all").click();
  await expect(tools.locator(".fa-edit.text-primary")).toBeHidden();
  await modal.getByRole("button", { name: "Close" }).first().click();

  // the running job counter follows the job events
  const jobId = await createJob(api, sessionId, {
    toolId: "fastx-trimmer.R",
    toolName: "Trim reads with FastX",
    toolCategory: "Preprocessing",
    module: "ngs",
    state: "RUNNING",
    parameters: [],
    inputs: [],
    outputs: [],
  });
  await expect(tools.locator("ch-counter-spinner")).toHaveText("1");

  // "Select tool" in the file details selects the tool of the file's source job
  const derivedId = await createDataset(
    api,
    sessionId,
    { name: "trimmed.fq", x: 300, y: 100, sourceJob: jobId },
    "@r\nACGT\n+\nIIII\n",
  );
  await datasetNode(page, derivedId).click();
  await visualizationTab(page, "Details").click();
  await page.locator("ch-single-dataset").getByTitle("Actions").click();
  await page.locator(".dropdown-menu.show").getByText("Select tool").click();
  await expect(tools.locator('[id="tool-button-fastx-trimmer.R"]')).toHaveClass(/active/);
});
