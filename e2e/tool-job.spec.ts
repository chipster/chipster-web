import { Page } from "@playwright/test";
import type { Job } from "chipster-js-common";

import { expect, test, waitForDevCheck } from "./fixtures";
import { createDataset, datasetNode, deleteDataset, openSession, updateDataset } from "./session-api";
import {
  CapturedJobs,
  captureJobs,
  categoryButton,
  closeParametersModal,
  delayFile,
  inputField,
  openParametersModal,
  parameterField,
  parametersModal,
  readParametersModal,
  runButton,
  searchTool,
  setParameter,
  shownStateOfJob,
  toolButton,
  toolsPanel,
} from "./tools";

/*
 * The job that the Run button posts is what the tool panel and the parameters modal show, whatever
 * the order of the tool selection, the file selection and the parameter changes, and however
 * quickly they follow each other. The jobs are caught before they reach session-db, see
 * captureJobs(). Each test checks the job against what the parameters modal shows just before Run,
 * and against the values the test chose, in case the modal is wrong the same way.
 */

const TABLE = "x\ty\n1\t2\n";

// Table converter, a tool with one input of any type and parameters that don't depend on the file
const TABLE_CONVERTER = "select_columns.R";
const TABLE_CONVERTER_DEFAULTS = {
  "Column list": "1,2",
  "New column names": "",
  "Column separator in input file": "tab",
  "First row to read": "1",
  "Number of rows to remove from the end of the file": "0",
  "Does the first column of the input file have a title": "yes",
};

// a tool with a column parameter, whose options are the column headers of the input file
const FILTER_BY_COLUMN = "filter-by-column-value.R";

/*
 * Opens the parameters modal, reads what it shows, closes it and runs the tool with the Run button.
 * Returns the posted job, after checking that it's what the modal showed.
 */
async function runAsShown(page: Page, captured: CapturedJobs, n = captured.posts.length + 1): Promise<Job> {
  await openParametersModal(page);
  const shown = await readParametersModal(page);
  await closeParametersModal(page);
  await runButton(page).click();
  const [job] = await captured.waitForPost(n);
  expect(shownStateOfJob(job), "the job compared with the parameters modal").toEqual(shown);
  return job;
}

test.describe("the job is what the tool panel shows, whatever the order of the selections", () => {
  /*
   * Each order ends in the same state: Table converter with the file a.tsv and the column list
   * changed to 2,1. b.tsv is a file that some orders select on the way.
   */
  const orders: { name: string; steps: (s: Steps) => Promise<void> }[] = [
    {
      name: "file, tool, parameter",
      steps: async (s) => {
        await s.selectFile("a");
        await s.searchTool(TABLE_CONVERTER);
        await s.setColumnList();
      },
    },
    {
      name: "tool, parameter, file",
      steps: async (s) => {
        await s.searchTool(TABLE_CONVERTER);
        await s.setColumnList();
        await s.selectFile("a");
      },
    },
    {
      name: "parameter, then another tool and back with the search",
      steps: async (s) => {
        await s.searchTool(TABLE_CONVERTER);
        await s.selectFile("a");
        await s.setColumnList();
        await s.searchTool(FILTER_BY_COLUMN);
        await s.searchTool(TABLE_CONVERTER);
      },
    },
    {
      name: "parameter with another file, then the file",
      steps: async (s) => {
        await s.searchTool(TABLE_CONVERTER);
        await s.selectFile("b");
        await s.setColumnList();
        await s.selectFile("a");
      },
    },
    {
      /*
       * The tool list and the tool search can give different instances of the same tool: the tool
       * list starts from a copy of the modules (ToolsComponent.ngOnInit), the search takes the tool
       * from the modules map. A changed parameter value is kept in the tool instance.
       */
      name: "parameter with the tool from the tool list, then the tool again with the search",
      steps: async (s) => {
        // the session opens in the first module, NGS, which has Table converter in Utilities
        await categoryButton(s.page, "Utilities").click();
        await toolButton(s.page, TABLE_CONVERTER).click();
        await expect(toolButton(s.page, TABLE_CONVERTER)).toHaveClass(/active/);
        await s.selectFile("a");
        await s.setColumnList();
        await s.searchTool(TABLE_CONVERTER);
      },
    },
  ];

  interface Steps {
    page: Page;
    selectFile(name: "a" | "b"): Promise<void>;
    searchTool(toolId: string): Promise<void>;
    setColumnList(): Promise<void>;
  }

  for (const order of orders) {
    test(order.name, async ({ page, api, baseURL, sessionId }) => {
      const files = {
        a: await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, TABLE),
        b: await createDataset(api, sessionId, { name: "b.tsv", x: 300, y: 100 }, TABLE),
      };
      await openSession(page, sessionId, files.a);
      const captured = await captureJobs(page, api, baseURL, sessionId);

      await order.steps({
        page,
        selectFile: async (name) => {
          await datasetNode(page, files[name]).click();
          await expect(page.locator("ch-selected-files")).toContainText(`${name}.tsv`);
        },
        searchTool: (toolId) => searchTool(page, toolId),
        setColumnList: () => setParameter(page, "Column list", "2,1"),
      });

      // the panel shows a changed, valid parameter
      await expect(toolsPanel(page).locator(".fa-edit.text-primary")).toBeVisible();
      await expect(runButton(page)).toBeEnabled();

      const job = await runAsShown(page, captured);
      expect(job.toolId).toBe(TABLE_CONVERTER);
      expect(job.inputs.map((input) => [input.inputId, input.datasetId])).toEqual([["input", files.a]]);
      expect(shownStateOfJob(job).parameters).toEqual({ ...TABLE_CONVERTER_DEFAULTS, "Column list": "2,1" });
      await waitForDevCheck(page);
    });
  }
});

/*
 * Changes a text parameter in the parameters modal and closes the modal in one go in the page, so
 * that the modal is closed well within the debounce of the change (500 ms in ToolParametersComponent,
 * which signals the pending change when the modal destroys it). Separate Playwright actions can take
 * longer than that.
 */
async function changeAndClose(page: Page, name: string, value: string): Promise<void> {
  await openParametersModal(page);
  await parameterField(page, name).evaluate((field: HTMLInputElement, newValue) => {
    field.value = newValue;
    // what ngModel listens to
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.closest("ch-parameters-modal").querySelector<HTMLButtonElement>(".modal-footer button").click();
  }, value);
  await expect(parametersModal(page)).toBeHidden();
}

// fails the test if the request that a test holds back never came
async function expectHeld(held: Promise<void>, what: string): Promise<void> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} wasn't requested, the test didn't test the delay`)), 10_000);
  });
  await Promise.race([held, timeout]).finally(() => clearTimeout(timer));
}

test.describe("the job is what the tool panel shows, also right after a change", () => {
  test("a parameter changed just before the modal is closed is validated", async ({
    page,
    api,
    baseURL,
    sessionId,
  }) => {
    const fileId = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, TABLE);
    await openSession(page, sessionId, fileId);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await searchTool(page, TABLE_CONVERTER);
    await datasetNode(page, fileId).click();
    await expect(runButton(page)).toBeEnabled();

    // a required parameter emptied, and the modal closed before the debounce of the change is over
    await changeAndClose(page, "Column list", "");

    // the tool can't be run with it: the job would get an empty column list
    await expect(toolsPanel(page).locator(".fa-exclamation-circle.text-warning")).toBeVisible();
    await expect(runButton(page)).toBeDisabled();

    // a valid change closed as quickly: the panel shows it as changed, and the job gets it
    await changeAndClose(page, "Column list", "2,1");
    await expect(toolsPanel(page).locator(".fa-edit.text-primary")).toBeVisible();
    const job = await runAsShown(page, captured);
    expect(shownStateOfJob(job).parameters["Column list"]).toBe("2,1");
    expect(captured.posts).toHaveLength(1);
    await waitForDevCheck(page);
  });

  test("Run right after a file selection sends the new file", async ({ page, api, baseURL, sessionId }) => {
    // the same columns, so that the column chosen for a.tsv stays valid for b.tsv
    const a = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, TABLE);
    const b = await createDataset(api, sessionId, { name: "b.tsv", x: 300, y: 100 }, TABLE);
    await openSession(page, sessionId, a);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await searchTool(page, FILTER_BY_COLUMN);
    await datasetNode(page, a).click();
    await setParameter(page, "Column", "y");
    await expect(runButton(page)).toBeEnabled();

    /*
     * The column headers of b.tsv are read for the column parameter when it's selected. They are
     * held back until the job is posted, which makes the time before them as long as it can be.
     */
    const headers = await delayFile(page, api, baseURL, sessionId, b);
    await datasetNode(page, b).click();
    await expect(page.locator("ch-selected-files")).toContainText("b.tsv");
    await expectHeld(headers.held, "the content of b.tsv");
    // whether the user could run the tool before the headers came, for the report of the test
    test.info().annotations.push({
      type: "Run before the headers",
      description: (await runButton(page).isEnabled()) ? "enabled" : "disabled",
    });
    // the click waits for the button to be enabled, if it isn't already, which may take the headers
    const click = runButton(page).click();
    await page.waitForTimeout(1000);
    headers.release();
    await click;

    const [job] = await captured.waitForPost(1);
    expect(
      job.inputs.map((input) => input.datasetId),
      "the input of the job",
    ).toEqual([b]);
    await waitForDevCheck(page);
  });

  test("a tool selected while the previous one reads the column headers is the one that runs", async ({
    page,
    api,
    baseURL,
    sessionId,
  }) => {
    const fileId = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, TABLE);
    await openSession(page, sessionId, fileId);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    const headers = await delayFile(page, api, baseURL, sessionId, fileId);
    await datasetNode(page, fileId).click();

    // the column parameter waits for the headers, Table converter has nothing to wait for
    await searchTool(page, FILTER_BY_COLUMN);
    await expectHeld(headers.held, "the content of a.tsv");
    await searchTool(page, TABLE_CONVERTER);
    await expect(runButton(page)).toBeEnabled();
    headers.release();
    // time for the held back requests to finish, and the panel still shows Table converter
    await page.waitForTimeout(1000);
    await expect(toolButton(page, TABLE_CONVERTER)).toHaveClass(/active/);

    const job = await runAsShown(page, captured);
    expect(job.toolId).toBe(TABLE_CONVERTER);
    expect(job.inputs.map((input) => input.datasetId)).toEqual([fileId]);
    await waitForDevCheck(page);
  });

  test("a file renamed elsewhere stays selected as the input", async ({ page, api, baseURL, sessionId }) => {
    const fileId = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, TABLE);
    await openSession(page, sessionId, fileId);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await searchTool(page, TABLE_CONVERTER);
    await datasetNode(page, fileId).click();

    await openParametersModal(page);
    const input = inputField(page, "Query sequences");
    await expect(input.locator("option:checked")).toHaveText("a.tsv");

    // the page learns about the rename from the dataset event
    await updateDataset(api, sessionId, fileId, { name: "renamed.tsv" });
    // the selection and the bindings have to be the same dataset objects, see ToolsComponent
    await expect(input.locator("option:checked")).toHaveText("renamed.tsv");
    await closeParametersModal(page);

    const job = await runAsShown(page, captured);
    expect(job.inputs.map((i) => [i.datasetId, i.datasetName])).toEqual([[fileId, "renamed.tsv"]]);
    await waitForDevCheck(page);
  });

  test("a file deleted elsewhere is no longer the input", async ({ page, api, sessionId }) => {
    const fileId = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, TABLE);
    await openSession(page, sessionId, fileId);
    await searchTool(page, TABLE_CONVERTER);
    await datasetNode(page, fileId).click();
    await expect(runButton(page)).toBeEnabled();

    // the page learns about the delete from the dataset event: the file stays in the selection, but
    // the tool can't be run with it (ToolsComponent binds the inputs again from the session data)
    await deleteDataset(api, sessionId, fileId);
    await expect(runButton(page)).toBeDisabled();
    await expect(toolsPanel(page).locator(".fa-exclamation-circle.text-warning")).toBeVisible();
    await waitForDevCheck(page);
  });
});
