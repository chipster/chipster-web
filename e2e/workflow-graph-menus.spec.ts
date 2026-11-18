import { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  Api,
  createDataset,
  createJob,
  datasetNode,
  getDatasets,
  nodeCenter,
  openSession,
  pressMoveRelease,
  TEST_JOB,
} from "./session-api";

/*
 * The menus of the workflow graph: the selection and layout actions of its Actions menu, and its
 * own right-click menu, which d3-context-menu draws outside Angular.
 *
 * The session is a small microarray analysis: two CEL files normalized, and the normalized file
 * used by two jobs, PCA and a two-group test. The PCA output pca.tsv is a leaf, and in the
 * positions given here it lies on the line from normalized.tsv to two-sample.tsv, like in a real
 * session where it looked as if "Select descendants" of pca.tsv were broken.
 */

const FILES = ["a.cel", "b.cel", "normalized.tsv", "pca.tsv", "variance.tsv", "two-sample.tsv"] as const;
type FileName = (typeof FILES)[number];

// the datasets by name, and the PCA job for the Show job test
interface Analysis {
  datasets: Record<FileName, string>;
  pcaJobId: string;
}

const POSITIONS: Record<FileName, { x: number; y: number }> = {
  "a.cel": { x: 10, y: 2 },
  "b.cel": { x: 70, y: 2 },
  "normalized.tsv": { x: 10, y: 51 },
  "pca.tsv": { x: 10, y: 102 },
  "variance.tsv": { x: 70, y: 102 },
  "two-sample.tsv": { x: 10, y: 152 },
};

/*
 * The jobs are completed jobs of real tools, but nothing runs: the graph draws the links from the
 * inputs of the job that made each file. Without positions, the app lays the files out when it
 * opens the session.
 */
async function createAnalysis(api: Api, sessionId: string, positioned: boolean): Promise<Analysis> {
  const datasets = {} as Record<FileName, string>;
  const dataset = async (name: FileName, sourceJob?: string) => {
    const position = positioned ? POSITIONS[name] : {};
    datasets[name] = await createDataset(api, sessionId, { name, sourceJob, ...position }, `${name}\n`);
  };
  const job = (toolId: string, toolName: string, inputs: FileName[]) =>
    createJob(api, sessionId, {
      ...TEST_JOB,
      toolId,
      toolName,
      module: "microarray",
      state: "COMPLETED",
      inputs: inputs.map((name, i) => ({ inputId: `input${i}`, displayName: name, datasetId: datasets[name] })),
    });

  await dataset("a.cel");
  await dataset("b.cel");
  await dataset("normalized.tsv", await job("norm-affy.R", "Affymetrix normalization", ["a.cel", "b.cel"]));
  const pcaJobId = await job("ordination-pca.R", "PCA", ["normalized.tsv"]);
  await dataset("pca.tsv", pcaJobId);
  await dataset("variance.tsv", pcaJobId);
  await dataset("two-sample.tsv", await job("stat-two-groups.R", "Two-group test", ["normalized.tsv"]));
  return { datasets, pcaJobId };
}

// the graph draws a selected file with the primary color as its border, other files with the color of their tool
const SELECTED_STROKE = "#006fe6";

// the names of the files that the graph shows as selected, in the order of FILES, read in one go
async function selectedInGraph(page: Page, datasets: Record<FileName, string>): Promise<FileName[]> {
  const strokes = await page
    .locator("#d3DatasetNodesGroup rect")
    .evaluateAll((rects) => rects.map((rect): [string, string] => [rect.id, rect.getAttribute("stroke")]));
  const strokeById = new Map(strokes);
  return FILES.filter((name) => strokeById.get(`node_${datasets[name]}`) === SELECTED_STROKE);
}

async function expectSelected(page: Page, datasets: Record<FileName, string>, expected: FileName[]) {
  await expect.poll(() => selectedInGraph(page, datasets)).toEqual(expected);
  // the panel of the selected files agrees
  const header = page.locator("ch-selected-files .h6");
  if (expected.length === 0) {
    await expect(header).toBeHidden();
  } else {
    await expect(header).toHaveText(expected.length === 1 ? expected[0] : `${expected.length} files`);
  }
}

/*
 * An item of the graph's Actions menu, above the graph. A file's details have another button with
 * the same id. A disabled item doesn't take clicks, which would show as a timeout.
 */
async function graphAction(page: Page, item: string) {
  await page.locator("ch-session-panel #viewDropdownMenuButton").click();
  const button = page.locator(".dropdown-menu.show").getByText(item, { exact: true });
  await expect(button).not.toHaveClass(/disabled/);
  await button.click();
}

// an item of the graph's right-click menu, which a test has opened
async function contextMenuAction(page: Page, item: string) {
  const menu = page.locator(".d3-context-menu");
  await expect(menu).toBeVisible();
  const li = menu.getByText(item, { exact: true });
  await expect(li).not.toHaveClass(/is-disabled/);
  await li.click();
  await expect(menu).toBeHidden();
}

async function savedPositions(api: Api, sessionId: string): Promise<Record<string, { x: number; y: number }>> {
  const positions: Record<string, { x: number; y: number }> = {};
  for (const { name, x, y } of await getDatasets(api, sessionId)) {
    positions[name] = { x, y };
  }
  return positions;
}

test("select descendants follows the jobs, and select all selects every file", async ({ page, api, sessionId }) => {
  const { datasets } = await createAnalysis(api, sessionId, true);
  await openSession(page, sessionId, datasets["two-sample.tsv"]);

  // the outputs of both jobs that used normalized.tsv, but not the file itself
  await datasetNode(page, datasets["normalized.tsv"]).click();
  await expectSelected(page, datasets, ["normalized.tsv"]);
  await graphAction(page, "Select descendants of selected files");
  await expectSelected(page, datasets, ["pca.tsv", "variance.tsv", "two-sample.tsv"]);

  // descendants of descendants too, from either input of the first job, also from the right-click menu
  await datasetNode(page, datasets["b.cel"]).click({ button: "right" });
  await expectSelected(page, datasets, ["b.cel"]);
  await contextMenuAction(page, "Select descendants");
  await expectSelected(page, datasets, ["normalized.tsv", "pca.tsv", "variance.tsv", "two-sample.tsv"]);

  // a leaf has none, although the line to two-sample.tsv goes through it, so nothing is left selected
  await datasetNode(page, datasets["pca.tsv"]).click();
  await expectSelected(page, datasets, ["pca.tsv"]);
  await graphAction(page, "Select descendants of selected files");
  await expectSelected(page, datasets, []);

  await graphAction(page, "Select all files");
  await expectSelected(page, datasets, [...FILES]);
});

test("the resets of positions lay out the selected files, or all of them, again", async ({ page, api, sessionId }) => {
  const { datasets } = await createAnalysis(api, sessionId, false);
  await openSession(page, sessionId, datasets["two-sample.tsv"]);

  // the app lays out the files that have no position, and saves the positions
  await expect
    .poll(async () => Object.values(await savedPositions(api, sessionId)).every(({ x, y }) => x != null && y != null))
    .toBe(true);
  const layout = await savedPositions(api, sessionId);

  // a drag far enough to be a drag, not a click, moves the file (the drag itself is tested in workflow-graph.spec.ts)
  const drag = async (name: FileName) => {
    await datasetNode(page, datasets[name]).click();
    await pressMoveRelease(page, await nodeCenter(page, datasets[name]), 100, 60);
    await expect.poll(async () => (await savedPositions(api, sessionId))[name]).not.toEqual(layout[name]);
    return (await savedPositions(api, sessionId))[name];
  };
  await drag("pca.tsv");
  const movedTwoSample = await drag("two-sample.tsv");

  // the reset of the selected files lays out only them, around the others: here pca.tsv gets its old spot back
  const pca = datasetNode(page, datasets["pca.tsv"]);
  await pca.click();
  await graphAction(page, "Reset positions of selected files");
  await expect.poll(() => savedPositions(api, sessionId)).toEqual({ ...layout, "two-sample.tsv": movedTwoSample });
  await expect(pca).toHaveAttribute("x", String(layout["pca.tsv"].x));
  await expect(pca).toHaveAttribute("y", String(layout["pca.tsv"].y));

  // the reset of all positions lays out every file from scratch, not only the selected one
  const twoSample = datasetNode(page, datasets["two-sample.tsv"]);
  await graphAction(page, "Reset all positions");
  await expect.poll(() => savedPositions(api, sessionId)).toEqual(layout);
  await expect(twoSample).toHaveAttribute("x", String(layout["two-sample.tsv"].x));
  await expect(twoSample).toHaveAttribute("y", String(layout["two-sample.tsv"].y));
});

test("show job in the graph's right-click menu opens the job that made the file", async ({ page, api, sessionId }) => {
  const { datasets, pcaJobId } = await createAnalysis(api, sessionId, true);
  await openSession(page, sessionId, datasets["pca.tsv"]);

  // a right-click on a file that isn't selected selects it, and the menu is for it alone
  await datasetNode(page, datasets["pca.tsv"]).click({ button: "right" });
  await expectSelected(page, datasets, ["pca.tsv"]);
  await contextMenuAction(page, "Show job");

  const modal = page.locator("ch-jobs-modal");
  await expect(modal.locator(`#job-id-${pcaJobId}`)).toHaveClass(/table-active/);
  await expect(modal.locator("ch-job")).toContainText("PCA");
});
