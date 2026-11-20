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
  selectedInGraph,
  TEST_JOB,
  updateDataset,
  visualizationTab,
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

// the names of the files that the graph shows as selected, in the order of FILES
async function selectedNames(page: Page, datasets: Record<FileName, string>): Promise<FileName[]> {
  const selected = new Set(await selectedInGraph(page));
  return FILES.filter((name) => selected.has(datasets[name]));
}

async function expectSelected(page: Page, datasets: Record<FileName, string>, expected: FileName[]) {
  await expect.poll(() => selectedNames(page, datasets)).toEqual(expected);
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

  // a right-click on a file that isn't selected selects it, and the menu is for it alone, with the single-file
  // items. Their titles are HTML, e.g. "Rename&hellip;", which the menu draws as such
  await datasetNode(page, datasets["pca.tsv"]).click({ button: "right" });
  await expectSelected(page, datasets, ["pca.tsv"]);
  await expect(page.locator(".d3-context-menu").getByText("Rename…", { exact: true })).toBeVisible();
  await contextMenuAction(page, "Show job");

  const modal = page.locator("ch-jobs-modal");
  await expect(modal.locator(`#job-id-${pcaJobId}`)).toHaveClass(/table-active/);
  await expect(modal.locator("ch-job")).toContainText("PCA");
});

test("the right-click menu of a selected file is for all selected files, and Ctrl+right-click adds the file", async ({
  page,
  api,
  sessionId,
}) => {
  const { datasets } = await createAnalysis(api, sessionId, true);
  await openSession(page, sessionId, datasets["two-sample.tsv"]);
  const menu = page.locator(".d3-context-menu");

  // a right-click on one of the selected files keeps them all selected, and the menu has only the items for many
  await datasetNode(page, datasets["a.cel"]).click();
  await datasetNode(page, datasets["b.cel"]).click({ modifiers: ["ControlOrMeta"] });
  await datasetNode(page, datasets["b.cel"]).click({ button: "right" });
  await expect(menu).toBeVisible();
  await expectSelected(page, datasets, ["a.cel", "b.cel"]);
  await expect(menu.getByText("Delete 2 files", { exact: true })).toBeVisible();
  // the single-file items are left out: the show job test checks that this text finds Rename in that menu
  await expect(menu.getByText("Rename…", { exact: true })).toHaveCount(0);

  // a click on the empty background below the files closes the menu and keeps the selection. The menu opens
  // right of and below a right-click in the top left quarter of the page, like here, so the background below
  // two-sample.tsv, left of b.cel, is clear of it
  const twoSample = await nodeCenter(page, datasets["two-sample.tsv"]);
  await page.mouse.click(twoSample.x, twoSample.y + 60);
  await expect(menu).toBeHidden();
  await expectSelected(page, datasets, ["a.cel", "b.cel"]);

  // Ctrl+right-click on a file that isn't selected adds it, and the menu is for all three
  const three: FileName[] = ["a.cel", "b.cel", "normalized.tsv"];
  await datasetNode(page, datasets["normalized.tsv"]).click({ button: "right", modifiers: ["ControlOrMeta"] });
  await expectSelected(page, datasets, three);
  await contextMenuAction(page, "Delete 3 files");

  // the confirmation lists the same three files. Cancel leaves them in the graph and selected. A delete would
  // clear the selection and hide the files right away, before the modal is gone, and delete them on the
  // server only after the undo time
  const modal = page.locator(".modal-content");
  await expect(modal).toContainText("Are you sure you want to delete 3 files?");
  for (const name of three) {
    await expect(modal.getByText(name, { exact: true })).toBeVisible();
  }
  await modal.getByRole("button", { name: "Cancel" }).click();
  await expect(modal).toBeHidden();
  await expectSelected(page, datasets, three);
  for (const name of three) {
    await expect(datasetNode(page, datasets[name])).toBeVisible();
  }
});

test("rename in the graph's right-click menu renames the file and keeps its notes changed elsewhere", async ({
  page,
  api,
  sessionId,
}) => {
  const { datasets } = await createAnalysis(api, sessionId, true);
  await openSession(page, sessionId, datasets["pca.tsv"]);
  const datasetOnServer = async () => {
    const response = await api.get("session-db", `/sessions/${sessionId}/datasets/${datasets["pca.tsv"]}`);
    expect(response.ok(), `get dataset ${response.status()}`).toBe(true);
    return response.json();
  };

  // the menu item saves a copy of the whole dataset, so it has to be the latest one, with the notes
  // that another client saved after the session was opened
  await datasetNode(page, datasets["pca.tsv"]).click();
  await visualizationTab(page, "Details").click();
  await updateDataset(api, sessionId, datasets["pca.tsv"], { notes: "my note" });
  await expect(page.locator("ch-single-dataset textarea")).toHaveValue("my note");

  await datasetNode(page, datasets["pca.tsv"]).click({ button: "right" });
  await contextMenuAction(page, "Rename…");
  const modal = page.locator(".modal-content");
  await expect(modal.getByText("Rename file")).toBeVisible();
  const input = modal.locator("input");
  await expect(input).toHaveValue("pca.tsv");
  await input.fill("components.tsv");
  await modal.getByRole("button", { name: "Rename" }).click();
  await expect(modal).toBeHidden();

  await expect.poll(async () => (await datasetOnServer()).name).toBe("components.tsv");
  expect((await datasetOnServer()).notes).toBe("my note");
  await expect(page.locator("ch-selected-files .h6")).toHaveText("components.tsv");
  // only the file of the menu
  const names = (await getDatasets(api, sessionId)).map(({ name }) => name).sort();
  expect(names).toEqual(FILES.map((name) => (name === "pca.tsv" ? "components.tsv" : name)).sort());
});

test("the zoom buttons scale the graph within their limits, and reset view restores the scale", async ({
  page,
  api,
  sessionId,
}) => {
  const { datasets } = await createAnalysis(api, sessionId, true);
  await openSession(page, sessionId, datasets["pca.tsv"]);
  const panel = page.locator("ch-session-panel");
  const zoomGroup = page.locator("#workflowvisualization svg > g").first();
  // the drawn width of a file, its border included, relative to the default scale 1
  const width = async () => {
    const box = await datasetNode(page, datasets["pca.tsv"]).boundingBox();
    expect(box, "pca.tsv has no bounding box").not.toBeNull();
    return box.width;
  };
  await expect(zoomGroup).toHaveAttribute("transform", "translate(0, 0) scale(1)");
  const defaultWidth = await width();

  // each step is 20 %, up to twice the size
  await panel.getByTitle("Zoom in").click();
  await expect(zoomGroup).toHaveAttribute("transform", "translate(0, 0) scale(1.2)");
  for (let i = 0; i < 5; i++) {
    await panel.getByTitle("Zoom in").click();
  }
  await expect(zoomGroup).toHaveAttribute("transform", "translate(0, 0) scale(2)");
  expect((await width()) / defaultWidth).toBeCloseTo(2, 1);

  // and down to a fifth
  for (let i = 0; i < 12; i++) {
    await panel.getByTitle("Zoom out").click();
  }
  await expect(zoomGroup).toHaveAttribute("transform", "translate(0, 0) scale(0.2)");
  expect((await width()) / defaultWidth).toBeCloseTo(0.2, 1);

  await graphAction(page, "Reset view");
  await expect(zoomGroup).toHaveAttribute("transform", "translate(0, 0) scale(1)");
  expect(await width()).toBeCloseTo(defaultWidth, 1);
});
