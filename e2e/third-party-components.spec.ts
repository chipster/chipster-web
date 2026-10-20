import { Page } from "@playwright/test";
import { parse } from "yaml";

import { expect, test } from "./fixtures";
import { ADMIN_STATE } from "./login";
import { createDataset, datasetNode, getDatasets, getSession, openSession } from "./session-api";

/*
 * Smoke tests for the screens built on third-party components:
 * angular-split, ng-bootstrap, ng-select, pdf.js (pdfjs-dist) and ag-grid. The
 * unit tests don't render components, so these are what catches a library
 * upgrade that breaks one of them. Each test checks that the component
 * renders and does its basic job, not the app logic around it. The toasts
 * have tests of their own in toasts.spec.ts.
 */

// the dataset Actions menu of the Selected Files panel
async function openDatasetMenu(page: Page) {
  await page.locator("#fileDropdownMenuButton").click();
  return page.locator("[aria-labelledby=fileDropdownMenuButton]");
}

test("the split panes of the session view can be resized (angular-split)", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "text\n");
  await openSession(page, sessionId, datasetId);

  const areas = page.locator("as-split > .as-split-area");
  await expect(areas).toHaveCount(2);
  const gutter = page.locator("as-split > .as-split-gutter");
  await expect(gutter).toHaveCount(1);

  const widthBefore = (await areas.first().boundingBox()).width;
  const box = await gutter.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  // in steps, so that the drag moves through intermediate positions like a real one
  await page.mouse.move(x + 150, y, { steps: 10 });
  await page.mouse.up();

  await expect.poll(async () => (await areas.first().boundingBox()).width).toBeGreaterThan(widthBefore + 100);
});

test("a dropdown menu opens a modal that renames a file (ng-bootstrap)", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "before.txt", x: 100, y: 100 }, "text\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();

  const menu = await openDatasetMenu(page);
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Rename…" }).click();
  await expect(menu).toBeHidden();

  const modal = page.getByRole("dialog");
  await expect(modal.getByText("Rename file")).toBeVisible();
  await modal.getByRole("textbox").fill("after.txt");
  await modal.getByRole("button", { name: "Rename" }).click();
  await expect(modal).toBeHidden();

  await expect.poll(async () => (await getDatasets(api, sessionId)).map((d) => d.name)).toEqual(["after.txt"]);
  await expect(page.locator("ch-selected-files")).toContainText("after.txt");
});

test("tools can be chosen from the module dropdown and the search (ng-select)", async ({ page, api, sessionId }) => {
  /*
   * the tool names come from the toolbox, so that the test doesn't depend on
   * which tools a deployment has: the second module for the dropdown, and for
   * the search a tool of the first module other than its first tool, which is
   * selected already when the module is opened. Many tools are in more than
   * one module, and the search lists each of their modules, so the tool is one
   * that the modules list once.
   */
  const modulesResponse = await api.get("toolbox", "/modules");
  expect(modulesResponse.ok()).toBe(true);
  // only the modules that the configuration of the app enables, like ToolsService does
  const confResponse = await page.request.get("/assets/conf/chipster.yaml");
  expect(confResponse.ok()).toBe(true);
  const enabled: string[] = parse(await confResponse.text()).modules;
  const modules = (await modulesResponse.json()).filter((module) => enabled.includes(module.name));
  expect(modules.length).toBeGreaterThan(1);
  const otherModule = modules[1];
  const toolsOf = (module) => module.categories.flatMap((category) => category.tools);
  const listings = new Map<string, number>();
  for (const tool of modules.flatMap(toolsOf)) {
    listings.set(tool.name.id, (listings.get(tool.name.id) ?? 0) + 1);
  }
  const searchedTool = toolsOf(modules[0])
    .slice(1)
    .find((tool) => listings.get(tool.name.id) === 1);
  expect(searchedTool).toBeDefined();

  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "text\n");
  await openSession(page, sessionId, datasetId);
  const tools = page.locator("ch-tools");

  // single select
  const moduleSelect = tools.locator("ng-select").first();
  await moduleSelect.click();
  await page.locator("ng-dropdown-panel").getByRole("option", { name: otherModule.name, exact: true }).click();
  await expect(moduleSelect.locator(".ng-value")).toHaveText(otherModule.name);
  await expect(tools.locator("#category-list")).toContainText(otherModule.categories[0].name);

  /*
   * search with a custom filter and option template. Every word of the search
   * has to match the tool, so the id is given with the name to narrow the
   * matches down to this tool: the list is virtual-scrolled, and a wanted
   * option far down a long list wouldn't be in the DOM at all
   */
  const search = tools.locator("#searchTool");
  await search.locator("input").fill(`${searchedTool.name.displayName} ${searchedTool.name.id}`);
  const option = page.locator("ng-dropdown-panel .ng-option").filter({
    has: page.getByText(searchedTool.name.displayName, { exact: true }),
  });
  await expect(option).toHaveCount(1);
  await option.click();
  await expect(tools.locator("#tool-list .active")).toHaveText(searchedTool.name.displayName);
  await expect(moduleSelect.locator(".ng-value")).toHaveText(modules[0].name);
});

/*
 * A minimal PDF of blank pages. The byte offsets of the cross-reference table
 * are computed, because pdf.js would otherwise fall back to repairing the file,
 * which would hide a regression in the normal loading path.
 */
function blankPdf(pageCount: number): string {
  const pageIds = Array.from({ length: pageCount }, (_, i) => i + 3);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`,
    ...pageIds.map(() => "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] >>"),
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

test("a pdf file is rendered and paged (pdfjs-dist)", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.pdf", x: 100, y: 100 }, blankPdf(2));
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();

  const pdf = page.locator("ch-pdf-visualization");
  await expect(pdf.getByText("Page 1 / 2")).toBeVisible();
  // the viewer renders the visible page to a canvas
  await expect(pdf.locator("ch-pdf-viewer .page[data-page-number='1'] canvas")).toBeVisible();

  await pdf.getByTitle("Next page").click();
  await expect(pdf.getByText("Page 2 / 2")).toBeVisible();
  await expect(pdf.locator("ch-pdf-viewer .page[data-page-number='2'] canvas")).toBeVisible();
});

/*
 * The full screen, jobs and news modals import components that lead back to
 * the service that opens them. That import cycle broke the modals once
 * (NG0919), so each of them is opened here.
 */
test("a table opens in a full screen modal (Handsontable, ng-bootstrap)", async ({ page, api, sessionId }) => {
  const content = "gene\tchip.a\ng1\t1\ng2\t3\n";
  const datasetId = await createDataset(api, sessionId, { name: "table.tsv", x: 100, y: 100 }, content);
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();

  await page.locator("ch-spreadsheet-visualization").getByText("Full Screen").click();
  const modal = page.getByRole("dialog");
  await expect(modal.locator(".modal-title")).toHaveText("table.tsv");
  await expect(modal.locator("ch-spreadsheet-visualization .htCore").first()).toContainText("g2");
});

test("a text file opens in a full screen modal (ng-bootstrap)", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "first line\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();

  await page.locator("ch-text-visualization").getByText("Full Screen").click();
  const modal = page.getByRole("dialog");
  await expect(modal.locator(".modal-title")).toHaveText("a.txt");
  await expect(modal.locator("ch-text-visualization pre")).toHaveText("first line\n");
});

test("the jobs modal shows the details of a job, and selecting its file closes it (ng-bootstrap)", async ({
  page,
  api,
  sessionId,
}) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "text\n");
  // a finished job, created directly in session-db. Nothing runs it: the scheduler logs
  // "cannot schedule new job ... tool not found" for it, as for the jobs of an imported session
  const now = new Date().toISOString();
  const response = await api.post("session-db", `/sessions/${sessionId}/jobs`, {
    toolId: "e2e-tool.R",
    toolName: "E2E tool",
    toolCategory: "Tests",
    state: "COMPLETED",
    created: now,
    startTime: now,
    endTime: now,
    parameters: [],
    inputs: [{ inputId: "input", displayName: "Input file", datasetId, datasetName: "a.txt" }],
  });
  expect(response.ok()).toBe(true);
  await openSession(page, sessionId);

  await page.getByTitle("Jobs").click();
  const modal = page.getByRole("dialog");
  await expect(modal.locator(".modal-title")).toHaveText("Jobs");
  await expect(modal.locator("ch-job-list tbody tr")).toHaveCount(1);
  await expect(modal.locator("ch-job-list tbody tr").first()).toContainText("E2E tool");
  // the modal selects the first job itself
  await expect(modal.locator("ch-job")).toContainText("Tests / E2E tool");
  await expect(modal.locator("ch-job")).toContainText("Completed");

  // the file link selects the file in the session view and closes the modal
  await modal.locator("ch-job ch-link-button", { hasText: "a.txt" }).click();
  await expect(modal).toBeHidden();
  await expect(page.locator("ch-selected-files")).toContainText("a.txt");
});

test("the news modal opens from the navigation bar (ng-bootstrap)", async ({ page }) => {
  await page.goto("/sessions");
  // the link has no href (routerLink=""), so it has no link role
  await page.locator("ch-navigation a.nav-link").filter({ hasText: "News" }).click();

  const modal = page.getByRole("dialog");
  await expect(modal.locator(".modal-title")).toHaveText("News");
  // whatever news the backend has: the list has loaded when it shows items or says there are none
  await expect(modal.locator("ch-news-item").first().or(modal.getByText("No news yet."))).toBeVisible();
});

test("a text file can be converted in the wrangle modal (ag-grid, ng-select)", async ({ page, api, sessionId }) => {
  const content = "gene\tchip.a\tchip.b\tnote\ng1\t1\t2\tx\ng2\t3\t4\ty\n";
  const datasetId = await createDataset(api, sessionId, { name: "table.tsv", x: 100, y: 100 }, content);
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();

  const menu = await openDatasetMenu(page);
  await menu.getByRole("button", { name: "Convert to Chipster format…" }).click();
  const modal = page.getByRole("dialog");

  // the preview grid
  const grid = modal.locator("ag-grid-angular");
  await expect(grid.locator(".ag-header-cell-text")).toHaveText(["gene", "chip.a", "chip.b", "note"]);
  await expect(grid.locator(".ag-row")).toHaveCount(2);
  await expect(grid.locator(".ag-row[row-index='0'] .ag-cell")).toHaveText(["g1", "1", "2", "x"]);

  // the column selections, in the order of the modal
  const [identifiers, samples] = [modal.locator("ch-multi-dropdown").nth(0), modal.locator("ch-multi-dropdown").nth(1)];
  const convert = modal.getByRole("button", { name: "Convert" });
  await expect(convert).toBeDisabled();

  await identifiers.locator("ng-select").click();
  await page.locator("ng-dropdown-panel .ng-option").filter({ hasText: "gene" }).click();
  await expect(identifiers.locator(".ng-value-label")).toHaveText("gene");

  // multiple selection stays open until Done
  await samples.locator("ng-select").click();
  const panel = page.locator("ng-dropdown-panel");
  await panel.locator(".ng-option").filter({ hasText: "chip.a" }).click();
  await panel.locator(".ng-option").filter({ hasText: "chip.b" }).click();
  await panel.getByRole("button", { name: "Done" }).click();
  await expect(panel).toBeHidden();
  await expect(samples.locator(".ng-value-label")).toHaveText(["chip.a", "chip.b"]);

  await convert.click();
  let datasets: Awaited<ReturnType<typeof getDatasets>>;
  await expect
    .poll(async () => {
      datasets = await getDatasets(api, sessionId);
      return datasets.map((d) => d.name).sort();
    })
    .toEqual(["table-converted.tsv", "table.tsv"]);

  /*
   * the identifier first, without a header of its own, then the samples, and
   * not the other column, which wasn't selected for inclusion. The dataset is
   * created before its content is uploaded, so wait for the content too.
   */
  const converted = datasets.find((d) => d.name === "table-converted.tsv");
  await expect
    .poll(async () => (await api.get("file-broker", `/sessions/${sessionId}/datasets/${converted.datasetId}`)).text())
    .toBe("chip.a\tchip.b\ng1\t1\t2\ng2\t3\t4");
});

test("the admin storage grid lists users and opens their sessions (ag-grid)", async ({
  browser,
  pageErrors,
  api,
  sessionId,
}) => {
  // the user's id with the auth prefix, e.g. jaas/chipster, from the owner rule of the session
  const userId = (await getSession(api, sessionId)).rules[0].username;

  // a separate browser context for the admin, the user's session stays in the default one
  const adminContext = await browser.newContext({ storageState: ADMIN_STATE });
  pageErrors.watch(adminContext);
  const page = await adminContext.newPage();
  try {
    await page.goto("/admin/storage");

    const grid = page.locator("ag-grid-angular");
    await expect(grid.locator(".ag-header-cell-text").first()).toHaveText("User Id", { timeout: 30_000 });

    /*
     * filter the grid down to the user: the grid renders only the rows that
     * fit in its height, so the row couldn't be found among many users
     */
    await page.getByRole("button", { name: "Open filter list" }).click();
    await page.locator("#session-notes").fill(userId);
    await page.getByRole("button", { name: "Filter listed users" }).click();

    // the row is split between the pinned and the scrolling parts of the grid
    const row = grid.locator(".ag-pinned-left-cols-container .ag-row");
    await expect(row).toHaveCount(1);
    await expect(row).toHaveText(userId);
    const rowIndex = await row.getAttribute("row-index");

    // a cell rendered by an Angular component, which opens an ng-bootstrap modal
    await grid
      .locator(`.ag-pinned-right-cols-container .ag-row[row-index='${rowIndex}']`)
      .getByRole("button", { name: "Sessions" })
      .click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("heading", { name: `Sessions of ${userId}` })).toBeVisible();
    await expect(modal.getByRole("cell", { name: sessionId })).toBeVisible();
  } finally {
    // read the errors of the admin's pages before they are closed
    await pageErrors.settle();
    await adminContext.close();
  }
});
