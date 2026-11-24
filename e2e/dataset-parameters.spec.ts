import { Locator, Page } from "@playwright/test";
import type { Job, JobParameter } from "chipster-js-common";

import { expect, test } from "./fixtures";
import { Api, createDataset, createJob, datasetNode, openSession, TEST_JOB, visualizationTab } from "./session-api";

/*
 * The parameters of the job that made a file, in the file details: the names and the values of the
 * choices come from the current version of the tool, and the values that differ from the tool's
 * default are in bold. All the places that show the list show every parameter, so its default limit
 * of three and its Show all button aren't tested.
 */

// the fields of a job that the test sets, parameters with only some of their fields like old jobs
type TestJob = Omit<Partial<Job>, "parameters"> & { parameters: Partial<JobParameter>[] };

// a file made by a finished job, which nothing runs: the page only shows the job
async function fileOfJob(api: Api, sessionId: string, job: TestJob): Promise<string> {
  const now = new Date().toISOString();
  const jobId = await createJob(api, sessionId, { ...TEST_JOB, state: "COMPLETED", created: now, ...job });
  return createDataset(api, sessionId, { name: "result.tsv", x: 100, y: 100, sourceJob: jobId }, "a\tb\n");
}

async function openDetails(page: Page, datasetId: string): Promise<Locator> {
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  return page.locator("ch-single-dataset #parameters-container ch-dataset-parameter-list");
}

/*
 * The rows of a parameter list as [name, value, bold], polled until they are as expected, because
 * the list is drawn again when the tool or the parameters change.
 */
async function expectParameters(list: Locator, expected: [string, string, boolean][]) {
  const read = () =>
    list.locator("tbody tr").evaluateAll((trs) =>
      trs.map((tr) => {
        const [name, value] = Array.from(tr.querySelectorAll("td"));
        // the list sets the weight to bold or normal, the computed weights are 700 and 400
        return [name.innerText.trim(), value.innerText.trim(), Number(getComputedStyle(value).fontWeight) >= 600];
      }),
    );
  await expect.poll(read).toEqual(expected);
}

test("the parameters show the tool's names and choices, the changed values in bold", async ({
  page,
  api,
  sessionId,
}) => {
  // the job saves the names that the tool had when it was run, the list shows the current ones
  const datasetId = await fileOfJob(api, sessionId, {
    toolId: "norm-affy.R",
    toolName: "Affymetrix",
    toolCategory: "Normalisation",
    module: "microarray",
    parameters: [
      // a choice that isn't the default, shown with the tool's name of the option
      { parameterId: "normalization.method", displayName: "Method", value: "mas5" },
      // the default
      { parameterId: "stabilize.variance", displayName: "Variance", value: "no" },
      // a choice that the tool doesn't have anymore is shown as it was saved
      { parameterId: "custom.chiptype", displayName: "Custom CDF", value: "removed-cdf" },
      { parameterId: "mas5.scale", displayName: "Scale", value: "1000" },
      // a parameter that the tool doesn't have anymore
      { parameterId: "old.parameter", displayName: "Old parameter", value: "x" },
    ],
  });
  await openSession(page, sessionId, datasetId);

  const names = [
    ["Normalization method", "MAS5"],
    ["Stabilize variance", "no"],
    ["Custom CDF annotation to be used", "removed-cdf"],
    ["MAS5 Scale", "1000"],
    ["Old parameter", "x"],
  ];
  const bold = [true, false, true, true, true];
  await expectParameters(
    await openDetails(page, datasetId),
    names.map(([name, value], i) => [name, value, bold[i]]),
  );

  // the history shows the same names and values, but nothing in bold
  await page.locator("ch-single-dataset").getByText("Show history").click();
  await expectParameters(
    page.locator("ch-dataset-history-modal ch-dataset-parameter-list"),
    names.map(([name, value]) => [name, value, false]),
  );
});

test("a choice without a display name in the tool is shown with its id", async ({ page, api, sessionId }) => {
  // the options yes and no of merge-tables.R have no display names
  const datasetId = await fileOfJob(api, sessionId, {
    toolId: "merge-tables.R",
    toolName: "Merge tables",
    toolCategory: "Utilities",
    module: "microarray",
    parameters: [{ parameterId: "include.everything", displayName: "Include everything", value: "yes" }],
  });
  await openSession(page, sessionId, datasetId);

  await expectParameters(await openDetails(page, datasetId), [
    ["Include all the rows in the result file", "yes", true],
  ]);
});

test("without the tool, the parameters show the names saved in the job, or the ids", async ({
  page,
  api,
  sessionId,
}) => {
  const datasetId = await fileOfJob(api, sessionId, {
    toolId: "removed-tool.R",
    toolName: "Removed tool",
    toolCategory: "Removed",
    module: "removed",
    parameters: [
      { parameterId: "method", displayName: "Method", value: "fast" },
      { parameterId: "seed", value: "42" },
    ],
  });
  await openSession(page, sessionId, datasetId);

  // without the tool, no value is known to be the default
  await expectParameters(await openDetails(page, datasetId), [
    ["Method", "fast", true],
    ["seed", "42", true],
  ]);
});
