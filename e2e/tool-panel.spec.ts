import { expect, test, waitForDevCheck } from "./fixtures";
import { createDataset, createJob, datasetNode, openSession, visualizationTab } from "./session-api";
import { closeParametersModal, openParametersModal, runButton, searchTool, toolButton, toolsPanel } from "./tools";

/*
 * The tool panel follows the tool and file selections made elsewhere in the session view, the
 * validation of the tool and the job events.
 */

test("the tool panel follows the selections, the validation and the jobs", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, "a\tb\n1\t2\n");
  await openSession(page, sessionId, datasetId);
  const tools = toolsPanel(page);

  // the tool search selects the tool through the store and a setTimeout
  await searchTool(page, "select_columns.R");
  await expect(tools.locator('[id^="category-button-"].active')).toContainText("Utilities");

  // validated without a file: the input is missing
  await expect(runButton(page)).toBeDisabled();
  await expect(tools.locator(".fa-exclamation-circle.text-warning")).toBeVisible();

  // a file selected in the d3 graph
  await datasetNode(page, datasetId).click();
  await expect(runButton(page)).toBeEnabled();
  await expect(tools.locator(".fa-exclamation-circle.text-warning")).toBeHidden();

  // the same tool selected again clears the validated tool in the store and is validated again, so
  // the buttons come back (at once here, the validation of this tool is synchronous)
  await toolButton(page, "select_columns.R").click();
  await expect(runButton(page)).toBeEnabled();

  // a parameter changed in the parameters modal: the button shows it after the debounce and the validation
  const modal = await openParametersModal(page);
  await modal.locator('ch-tool-parameters input[type="text"]').first().fill("1");
  await expect(tools.locator(".fa-edit.text-primary")).toBeVisible();
  // the modal shows the new validation too: Reset all is enabled
  await expect(modal.getByTitle("Reset all")).toBeEnabled();
  await modal.getByTitle("Reset all").click();
  await expect(tools.locator(".fa-edit.text-primary")).toBeHidden();
  await closeParametersModal(page);

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
  await expect(toolButton(page, "fastx-trimmer.R")).toHaveClass(/active/);
  await waitForDevCheck(page);
});
