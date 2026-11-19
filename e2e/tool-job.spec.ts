import { Locator, Page } from "@playwright/test";
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
  parameterOptions,
  parametersModal,
  readParametersModal,
  runButton,
  runIsMenu,
  runMenuItem,
  runOption,
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

// Merge tables, a tool with one multi input (INPUT table{...}.tsv) and one parameter
const MERGE_TABLES = "merge-tables.R";

/*
 * Average replicate chips, a tool with a phenodata input and a column parameter whose options are
 * the columns of the phenodata (METACOLUMN_SEL), with the default column group. Its input has to be
 * a table of gene expressions, i.e. have columns with the prefix chip. (type-service).
 */
const AVERAGE_REPLICATES = "average-replicates.R";
const EXPRESSIONS = "identifier\tchip.s1\tchip.s2\ng1\t1\t2\n";

// Remove duplicate genes, a tool with one input and a column parameter with a default column
const REMOVE_DUPLICATES = "remove-duplicate-genes.py";

// a tool with two required inputs of any type, and parameters that don't depend on the files
const SEQOR = "seqor.R";

// Calculate md5sum, a tool with a required and an optional input of any type and no parameters
const MD5SUM = "md5sum.R";

/*
 * Opens the parameters modal, reads what it shows, closes it and runs the tool as one job with the
 * Run button, or with Run tool in its menu, which it is when the tool could also be run for each file
 * or sample. Returns the posted job, after checking that it's what the modal showed.
 */
async function runAsShown(page: Page, captured: CapturedJobs): Promise<Job> {
  await openParametersModal(page);
  const shown = await readParametersModal(page);
  await closeParametersModal(page);
  const n = captured.posts.length + 1;
  const menu = await runIsMenu(page);
  await runButton(page).click();
  if (menu) {
    await runMenuItem(page, "Run tool").click();
  }
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
       * A changed parameter value is kept in the tool instance, so the tool list and the tool search
       * have to give the same instance. They didn't: the tool list started from a copy of the modules
       * (ToolsComponent.ngOnInit), the search took the tool from the modules map.
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

    // the page learns about the delete from the dataset event: the file is dropped from the selection
    // (SessionEventService), and the tool can't be run without it
    await deleteDataset(api, sessionId, fileId);
    await expect(runButton(page)).toBeDisabled();
    // the selected files panel is gone, or stays without the file in the layout with the tools panel
    await expect(page.locator("ch-selected-files", { hasText: "a.tsv" })).toHaveCount(0);
    await expect(toolsPanel(page).locator(".fa-exclamation-circle.text-warning")).toBeVisible();
    await waitForDevCheck(page);
  });
});

test.describe("the job is what the parameters modal shows, also with a multi input and phenodata", () => {
  test("a multi input takes every selected file, and can't run as one job with one left out", async ({
    page,
    api,
    baseURL,
    sessionId,
  }) => {
    const [a, b, c] = await Promise.all(
      ["a", "b", "c"].map((name, i) =>
        createDataset(api, sessionId, { name: `${name}.tsv`, x: 100 + 200 * i, y: 100 }, TABLE),
      ),
    );
    await openSession(page, sessionId, a);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await datasetNode(page, a).click();
    await datasetNode(page, b).click({ modifiers: ["ControlOrMeta"] });
    await searchTool(page, MERGE_TABLES);

    const input = () => inputField(page, "Tables to merge").locator("option:checked");
    await openParametersModal(page);
    await expect(input()).toHaveText(["a.tsv", "b.tsv"]);
    await closeParametersModal(page);

    // a file added to the selection is bound too
    await datasetNode(page, c).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files")).toContainText("3 files");
    await openParametersModal(page);
    await expect(input()).toHaveText(["a.tsv", "b.tsv", "c.tsv"]);

    /*
     * The user leaves b.tsv out in the modal. A tool has to take every selected file
     * (ToolSelectionService.validateInputs), so it can't be run as one job then, only for each file.
     */
    await inputField(page, "Tables to merge").selectOption([{ label: "a.tsv" }, { label: "c.tsv" }]);
    await expect(input()).toHaveText(["a.tsv", "c.tsv"]);
    await closeParametersModal(page);
    await runButton(page).click();
    await expect(runMenuItem(page, "Run tool")).toBeDisabled();
    await expect(runMenuItem(page, "Run tool for each file")).toContainText("3 jobs");
    await page.keyboard.press("Escape");
    await expect(page.locator(".dropdown-menu.show")).toBeHidden();

    // b.tsv taken out of the file selection instead: the input gets the rest of the files
    await datasetNode(page, b).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files")).toContainText("2 files");
    await openParametersModal(page);
    await expect(input()).toHaveText(["a.tsv", "c.tsv"]);
    await closeParametersModal(page);
    await setParameter(page, "Include all the rows in the result file", "yes");

    /*
     * The files of a multi input are separate inputs of the job, numbered like the tool reads them.
     * Run is a menu with several files, and runAsShown() runs the tool as one job from it.
     */
    const job = await runAsShown(page, captured);
    expect(job.inputs.map((i) => [i.inputId, i.datasetId])).toEqual([
      ["table001.tsv", a],
      ["table002.tsv", c],
    ]);
    expect(shownStateOfJob(job).parameters).toEqual({ "Include all the rows in the result file": "yes" });
    await waitForDevCheck(page);
  });

  test("the phenodata column follows the phenodata of the selected file", async ({ page, api, baseURL, sessionId }) => {
    const phenodataA = "sample\tgroup\ttreatment\nchip.s1\t1\tx\nchip.s2\t2\ty\n";
    const phenodataB = "sample\ttime\tdescription\nchip.s1\t0\tfirst\nchip.s2\t1\tsecond\n";
    const withPhenodata = (name: string, x: number, phenodata: string) => ({
      name,
      x,
      y: 100,
      metadataFiles: [{ name: "phenodata.tsv", content: phenodata }],
    });
    const a = await createDataset(api, sessionId, withPhenodata("a.tsv", 100, phenodataA), EXPRESSIONS);
    const b = await createDataset(api, sessionId, withPhenodata("b.tsv", 300, phenodataB), EXPRESSIONS);
    await openSession(page, sessionId, a);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await datasetNode(page, a).click();
    await searchTool(page, AVERAGE_REPLICATES);

    // the options are the columns of a.tsv's phenodata, and the default column is one of them
    const modal = await openParametersModal(page);
    await expect.poll(() => parameterOptions(page, "Column")).toEqual(["sample", "group", "treatment"]);
    await expect(parameterField(page, "Column")).toHaveValue("group");
    await expect(modal.locator("ch-tool-inputs")).toContainText("Using phenodata of a.tsv");
    await closeParametersModal(page);
    await setParameter(page, "Column", "treatment");

    // b.tsv's phenodata has neither the chosen column nor the default, so the user has to choose
    await datasetNode(page, b).click();
    await expect(page.locator("ch-selected-files")).toContainText("b.tsv");
    await expect(runButton(page)).toBeDisabled();
    await openParametersModal(page);
    await expect.poll(() => parameterOptions(page, "Column")).toEqual(["sample", "time", "description"]);
    await expect(parameterField(page, "Column")).toHaveValue("");
    await expect(modal.locator("ch-tool-inputs")).toContainText("Using phenodata of b.tsv");
    await closeParametersModal(page);
    await setParameter(page, "Column", "time");
    await expect(runButton(page)).toBeEnabled();

    // the job gets the phenodata of the file it runs on
    const job = await runAsShown(page, captured);
    expect(job.inputs.map((i) => i.datasetId)).toEqual([b]);
    expect(shownStateOfJob(job).parameters["Column"]).toBe("time");
    expect(job.metadataFiles).toEqual([{ name: "phenodata.tsv", content: phenodataB }]);
    await waitForDevCheck(page);
  });
});

// selects the files in the workflow graph in this order, the first one with a plain click
async function selectFiles(page: Page, datasetIds: string[]): Promise<void> {
  await datasetNode(page, datasetIds[0]).click();
  for (const datasetId of datasetIds.slice(1)) {
    await datasetNode(page, datasetId).click({ modifiers: ["ControlOrMeta"] });
  }
  if (datasetIds.length > 1) {
    await expect(page.locator("ch-selected-files")).toContainText(`${datasetIds.length} files`);
  }
}

// the selected files of the open parameters modal: the options shown as selected in each input
function boundFiles(page: Page, input: string): Locator {
  return inputField(page, input).locator("option:checked");
}

test.describe("the job is what the parameters modal shows, also when the column options follow the file", () => {
  // the column parameter of Remove duplicate genes, with the default column ensembl_id
  const ID_COLUMN = "ID column";

  test("the columns and the default column follow the selected file", async ({ page, api, baseURL, sessionId }) => {
    const files = {
      a: await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, "ensembl_id\tsymbol\ne1\ts1\n"),
      b: await createDataset(api, sessionId, { name: "b.tsv", x: 300, y: 100 }, "gene\tensembl_id\tvalue\ng\te1\t1\n"),
      c: await createDataset(api, sessionId, { name: "c.tsv", x: 500, y: 100 }, "symbol\tvalue\ns1\t1\n"),
    };
    await openSession(page, sessionId, files.a);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await datasetNode(page, files.a).click();
    await searchTool(page, REMOVE_DUPLICATES);

    const expectColumns = async (options: string[], value: string) => {
      await openParametersModal(page);
      await expect.poll(() => parameterOptions(page, ID_COLUMN)).toEqual(options);
      await expect(parameterField(page, ID_COLUMN)).toHaveValue(value);
      await closeParametersModal(page);
    };
    const select = async (name: keyof typeof files) => {
      await datasetNode(page, files[name]).click();
      await expect(page.locator("ch-selected-files")).toContainText(`${name}.tsv`);
    };

    // the columns of a.tsv, which has the default column
    await expectColumns(["ensembl_id", "symbol"], "ensembl_id");
    await setParameter(page, ID_COLUMN, "symbol");

    // b.tsv doesn't have the chosen column, so the default is used again
    await select("b");
    await expectColumns(["gene", "ensembl_id", "value"], "ensembl_id");
    await expect(runButton(page)).toBeEnabled();

    // c.tsv has neither, and the user has to choose
    await select("c");
    await expectColumns(["symbol", "value"], "");
    await expect(runButton(page)).toBeDisabled();
    await setParameter(page, ID_COLUMN, "symbol");
    await expect(runButton(page)).toBeEnabled();

    // a.tsv has the column chosen for c.tsv, and keeps it
    await select("a");
    await expectColumns(["ensembl_id", "symbol"], "symbol");

    const job = await runAsShown(page, captured);
    expect(job.inputs.map((i) => i.datasetId)).toEqual([files.a]);
    expect(shownStateOfJob(job).parameters).toEqual({ [ID_COLUMN]: "symbol" });
    await waitForDevCheck(page);
  });

  test("a file that isn't a .tsv table has no columns to choose from", async ({ page, api, baseURL, sessionId }) => {
    const table = "ensembl_id\tsymbol\ne1\ts1\n";
    const tsv = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, table);
    const txt = await createDataset(api, sessionId, { name: "a.txt", x: 300, y: 100 }, table);
    await openSession(page, sessionId, tsv);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await datasetNode(page, tsv).click();
    await searchTool(page, REMOVE_DUPLICATES);
    await setParameter(page, ID_COLUMN, "symbol");

    // the columns are read only from .tsv files, and the tool can't be run without a column
    await datasetNode(page, txt).click();
    await expect(page.locator("ch-selected-files")).toContainText("a.txt");
    await expect(runButton(page)).toBeDisabled();
    await openParametersModal(page);
    await expect.poll(() => parameterOptions(page, ID_COLUMN)).toEqual([]);
    await expect(parametersModal(page).locator("ch-tool-parameters")).toContainText(
      "Required parameter can not be empty",
    );
    await closeParametersModal(page);

    /*
     * Back on the .tsv file, the column chosen before is gone: the .txt file cleared it
     * (ToolSelectionService.populateParameter), and the default is used.
     */
    await datasetNode(page, tsv).click();
    await expect(page.locator("ch-selected-files")).toContainText("a.tsv");
    await expect(runButton(page)).toBeEnabled();
    const job = await runAsShown(page, captured);
    expect(job.inputs.map((i) => i.datasetId)).toEqual([tsv]);
    expect(shownStateOfJob(job).parameters).toEqual({ [ID_COLUMN]: "ensembl_id" });
    await waitForDevCheck(page);
  });
});

test.describe("the job is what the parameters modal shows, also when the user binds the inputs", () => {
  test("the files swapped between two inputs in the modal stay swapped", async ({ page, api, baseURL, sessionId }) => {
    const a = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "ACGT\n");
    const b = await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "TTTT\n");
    await openSession(page, sessionId, a);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await selectFiles(page, [a, b]);
    await searchTool(page, SEQOR);

    // the files are bound in the order of the selection
    await openParametersModal(page);
    await expect(boundFiles(page, "First sequence set")).toHaveText(["a.txt"]);
    await expect(boundFiles(page, "Second sequence set")).toHaveText(["b.txt"]);

    // choosing b.txt for the first input moves a.txt to the second
    await inputField(page, "First sequence set").selectOption({ label: "b.txt" });
    await expect(boundFiles(page, "First sequence set")).toHaveText(["b.txt"]);
    await expect(boundFiles(page, "Second sequence set")).toHaveText(["a.txt"]);
    // the tool takes two inputs, so it can only be run once with them
    await expect(runOption(page, "Run Tool")).toHaveText(
      "Runs the tool once. Uses all the 2 selected files as the tool inputs.",
    );
    await expect(runOption(page, "Run Tool for Each File")).toHaveText(
      "Not possible for tools that require more than one inputs.",
    );
    await closeParametersModal(page);
    expect(await runIsMenu(page)).toBe(false);

    // a parameter changed after the swap validates the tool again, and the files stay swapped
    await setParameter(page, "Logical operator for merging", "AND");

    const job = await runAsShown(page, captured);
    expect(job.inputs.map((i) => [i.inputId, i.datasetId])).toEqual([
      ["sequences1.txt", b],
      ["sequences2.txt", a],
    ]);
    expect(shownStateOfJob(job).parameters).toEqual({
      "Logical operator for merging": "AND",
      "Collect a log file": "no",
    });
    await waitForDevCheck(page);
  });

  test("an optional input without a file isn't in the job", async ({ page, api, baseURL, sessionId }) => {
    const data = await createDataset(api, sessionId, { name: "data.txt", x: 100, y: 100 }, "data\n");
    const md5 = await createDataset(api, sessionId, { name: "data.txt.md5", x: 300, y: 100 }, "0  data.txt\n");
    await openSession(page, sessionId, data);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await datasetNode(page, data).click();
    await searchTool(page, MD5SUM);

    // one file: the optional input has none, which is fine
    await openParametersModal(page);
    await expect(boundFiles(page, "File")).toHaveText(["data.txt"]);
    await expect(boundFiles(page, "MD5 file")).toHaveCount(0);
    await expect(parametersModal(page).locator("ch-tool-inputs")).not.toContainText("Input file required");
    await closeParametersModal(page);
    const job = await runAsShown(page, captured);
    expect(job.inputs.map((i) => [i.inputId, i.datasetId])).toEqual([["file", data]]);

    // with two files, the second goes to the optional input
    await datasetNode(page, md5).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files")).toContainText("2 files");
    const both = await runAsShown(page, captured);
    expect(both.inputs.map((i) => [i.inputId, i.datasetId])).toEqual([
      ["file", data],
      ["md5file", md5],
    ]);
    await waitForDevCheck(page);
  });
});

/*
 * Runs the tool with an item of the Run menu, and returns the jobs of the request. Run tool for each
 * file and for each sample post all their jobs in one request.
 */
async function runFromMenu(page: Page, captured: CapturedJobs, item: string, jobs: number): Promise<Job[]> {
  const n = captured.posts.length + 1;
  await runButton(page).click();
  await expect(runMenuItem(page, item)).toContainText(`${jobs} job`);
  await runMenuItem(page, item).click();
  const posted = await captured.waitForPost(n);
  expect(posted, `the jobs of ${item}`).toHaveLength(jobs);
  return posted;
}

test.describe("the jobs are what the Run menu and the run options say", () => {
  test("Run tool for each file runs the tool with each file and the parameters shown", async ({
    page,
    api,
    baseURL,
    sessionId,
  }) => {
    const ids = await Promise.all(
      ["a", "b", "c"].map((name, i) =>
        createDataset(api, sessionId, { name: `${name}.tsv`, x: 100 + 200 * i, y: 100 }, TABLE),
      ),
    );
    await openSession(page, sessionId, ids[0]);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await selectFiles(page, ids);
    await searchTool(page, TABLE_CONVERTER);
    await setParameter(page, "Column list", "2,1");

    // the tool takes one file, so three can only be run for each file
    await openParametersModal(page);
    await expect(runOption(page, "Run Tool")).toHaveText(
      "Too many files selected. Tool takes 1 input, 3 files selected.",
    );
    await expect(runOption(page, "Run Tool for Each File")).toHaveText(
      "Runs the tool 3 times. Each time one of the selected 3 files is used as a single input for the tool.",
    );
    await expect(runOption(page, "Run Tool for Each Sample")).toHaveText(
      "Selected files don't include any files defined as sample files.",
    );
    const shown = await readParametersModal(page);
    await closeParametersModal(page);
    await runButton(page).click();
    await expect(runMenuItem(page, "Run tool")).toBeDisabled();
    await expect(runMenuItem(page, "Run tool for each sample")).toBeDisabled();
    await page.keyboard.press("Escape");

    const jobs = await runFromMenu(page, captured, "Run tool for each file", 3);
    expect(jobs.map((job) => job.inputs.map((i) => [i.inputId, i.datasetId]))).toEqual(
      ids.map((id) => [["input", id]]),
    );
    for (const job of jobs) {
      expect(job.toolId).toBe(TABLE_CONVERTER);
      expect(shownStateOfJob(job).parameters).toEqual(shown.parameters);
    }
    expect(shown.parameters).toEqual({ ...TABLE_CONVERTER_DEFAULTS, "Column list": "2,1" });
    await waitForDevCheck(page);
  });

  test("Run tool for each file leaves the optional input out", async ({ page, api, baseURL, sessionId }) => {
    const data = await createDataset(api, sessionId, { name: "data.txt", x: 100, y: 100 }, "data\n");
    const md5 = await createDataset(api, sessionId, { name: "data.txt.md5", x: 300, y: 100 }, "0  data.txt\n");
    await openSession(page, sessionId, data);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await selectFiles(page, [data, md5]);
    await searchTool(page, MD5SUM);

    // both options are possible: the files in the two inputs, or each file in the required one
    await openParametersModal(page);
    await expect(runOption(page, "Run Tool")).toHaveText(
      "Runs the tool once. Uses all the 2 selected files as the tool inputs.",
    );
    await expect(runOption(page, "Run Tool for Each File")).toHaveText(
      "Runs the tool 2 times. Each time one of the selected 2 files is used as a single input for the tool.",
    );
    await closeParametersModal(page);

    const jobs = await runFromMenu(page, captured, "Run tool for each file", 2);
    expect(jobs.map((job) => job.inputs.map((i) => [i.inputId, i.datasetId]))).toEqual([
      [["file", data]],
      [["file", md5]],
    ]);
    await waitForDevCheck(page);
  });

  /*
   * The column options come from the first file, and the jobs for each file got the column chosen
   * from them, also the job of a file that doesn't have it.
   */
  test("Run tool for each file isn't possible when a file doesn't have the chosen column", async ({
    page,
    api,
    baseURL,
    sessionId,
  }) => {
    const a = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, "x\ty\n1\t2\n");
    const b = await createDataset(api, sessionId, { name: "b.tsv", x: 300, y: 100 }, "x\tz\n1\t2\n");
    const c = await createDataset(api, sessionId, { name: "c.txt", x: 500, y: 100 }, "x\ty\n1\t2\n");
    await openSession(page, sessionId, a);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await selectFiles(page, [a, b]);
    await searchTool(page, FILTER_BY_COLUMN);
    await setParameter(page, "Column", "y");

    // b.tsv doesn't have y, and the tool can't be run at all: two files are too many for one job
    await openParametersModal(page);
    await expect(runOption(page, "Run Tool for Each File")).toHaveText(
      "The column y chosen for Column isn't in b.tsv.",
    );
    await closeParametersModal(page);
    expect(await runIsMenu(page)).toBe(false);
    await expect(runButton(page)).toBeDisabled();

    // a column that both files have
    await setParameter(page, "Column", "x");
    const jobs = await runFromMenu(page, captured, "Run tool for each file", 2);
    expect(jobs.map((job) => [job.inputs[0].datasetId, shownStateOfJob(job).parameters["Column"]])).toEqual([
      [a, "x"],
      [b, "x"],
    ]);

    // only .tsv files have columns (ToolSelectionService.populateParameter)
    await datasetNode(page, c).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files")).toContainText("3 files");
    await openParametersModal(page);
    await expect(runOption(page, "Run Tool for Each File")).toHaveText(
      "The column x chosen for Column isn't in c.txt.",
    );
    await closeParametersModal(page);
    await expect(runButton(page)).toBeDisabled();
    await waitForDevCheck(page);
  });

  test("Run tool for each sample isn't possible when the files of a sample don't have the chosen column", async ({
    page,
    api,
    baseURL,
    sessionId,
  }) => {
    // single end samples, defined like the samples modal does (DatasetService.setSampleData)
    const sampleFile = (sample: string, x: number) => ({
      name: `${sample}.tsv`,
      x,
      y: 100,
      metadataFiles: [
        { name: "sample.json", content: JSON.stringify({ sampleName: sample, sampleId: `id-${sample}` }) },
      ],
    });
    const s1 = await createDataset(api, sessionId, sampleFile("s1", 100), "x\ty\n1\t2\n");
    const s2 = await createDataset(api, sessionId, sampleFile("s2", 300), "x\tz\n1\t2\n");
    await openSession(page, sessionId, s1);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await selectFiles(page, [s1, s2]);
    await searchTool(page, FILTER_BY_COLUMN);
    await setParameter(page, "Column", "y");

    await openParametersModal(page);
    await expect(runOption(page, "Run Tool for Each File")).toHaveText(
      "The column y chosen for Column isn't in s2.tsv.",
    );
    await expect(runOption(page, "Run Tool for Each Sample")).toHaveText(
      "The column y chosen for Column isn't in sample s2.",
    );
    await closeParametersModal(page);
    await expect(runButton(page)).toBeDisabled();

    await setParameter(page, "Column", "x");
    const jobs = await runFromMenu(page, captured, "Run tool for each sample", 2);
    expect(jobs.map((job) => [job.inputs[0].datasetId, shownStateOfJob(job).parameters["Column"]])).toEqual([
      [s1, "x"],
      [s2, "x"],
    ]);
    await waitForDevCheck(page);
  });

  test("Run tool for each file isn't possible when the columns of a file can't be read", async ({
    page,
    api,
    sessionId,
    pageErrors,
  }) => {
    const a = await createDataset(api, sessionId, { name: "a.tsv", x: 100, y: 100 }, "x\ty\n1\t2\n");
    const b = await createDataset(api, sessionId, { name: "b.tsv", x: 300, y: 100 }, "x\ty\n1\t2\n");
    await openSession(page, sessionId, a);
    await datasetNode(page, a).click();
    await searchTool(page, FILTER_BY_COLUMN);
    await setParameter(page, "Column", "y");

    // the request for the content of b.tsv, which the column headers are read from, fails
    const path = `/sessions/${sessionId}/datasets/${b}`;
    pageErrors.allowFailedRequest(500, "file-broker", path);
    await page.route(
      (url) => url.pathname.endsWith(path),
      (route) => route.fulfill({ status: 500, body: "test failure" }),
    );
    await datasetNode(page, b).click({ modifiers: ["ControlOrMeta"] });
    await expect(page.locator("ch-selected-files")).toContainText("2 files");

    // b.tsv may well have the column, but that isn't known
    await openParametersModal(page);
    await expect(runOption(page, "Run Tool for Each File")).toHaveText("The columns of b.tsv couldn't be read.");
    await closeParametersModal(page);
    await expect(runButton(page)).toBeDisabled();
    await waitForDevCheck(page);
  });

  test("Run tool for each sample runs the tool with the two files of each sample", async ({
    page,
    api,
    baseURL,
    sessionId,
  }) => {
    // paired end samples, defined like the samples modal does (DatasetService.setSampleData)
    const sampleFile = (sample: string, direction: "R1" | "R2", x: number) => ({
      name: `${sample}_${direction}.fq`,
      x,
      y: 100,
      metadataFiles: [
        {
          name: "sample.json",
          content: JSON.stringify({
            sampleName: sample,
            sampleId: `id-${sample}`,
            pairId: `pair-${sample}`,
            direction,
          }),
        },
      ],
    });
    const reads = "@r\nACGT\n+\nIIII\n";
    // R2 before R1 in the selection, the binding has to follow the direction, not the order
    const s1r2 = await createDataset(api, sessionId, sampleFile("s1", "R2", 100), reads);
    const s1r1 = await createDataset(api, sessionId, sampleFile("s1", "R1", 300), reads);
    const s2r1 = await createDataset(api, sessionId, sampleFile("s2", "R1", 500), reads);
    const s2r2 = await createDataset(api, sessionId, sampleFile("s2", "R2", 700), reads);
    await openSession(page, sessionId, s1r2);
    const captured = await captureJobs(page, api, baseURL, sessionId);
    await selectFiles(page, [s1r2, s1r1, s2r1, s2r2]);
    await searchTool(page, SEQOR);
    await setParameter(page, "Logical operator for merging", "XOR");

    await openParametersModal(page);
    await expect(runOption(page, "Run Tool")).toHaveText(
      "Too many files selected. Tool takes 2 inputs, 4 files selected.",
    );
    await expect(runOption(page, "Run Tool for Each Sample")).toHaveText(
      "Runs the tool 2 times. Each time the two paired files of a one sample are used as the tool inputs.",
    );
    const shown = await readParametersModal(page);
    await closeParametersModal(page);

    const jobs = await runFromMenu(page, captured, "Run tool for each sample", 2);
    expect(jobs.map((job) => job.inputs.map((i) => [i.inputId, i.datasetName]))).toEqual([
      [
        ["sequences1.txt", "s1_R1.fq"],
        ["sequences2.txt", "s1_R2.fq"],
      ],
      [
        ["sequences1.txt", "s2_R1.fq"],
        ["sequences2.txt", "s2_R2.fq"],
      ],
    ]);
    for (const job of jobs) {
      expect(shownStateOfJob(job).parameters).toEqual(shown.parameters);
    }
    expect(shown.parameters["Logical operator for merging"]).toBe("XOR");
    await waitForDevCheck(page);
  });
});
