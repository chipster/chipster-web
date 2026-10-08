import { expect, Page, test } from "@playwright/test";

import { ADMIN_STATE } from "./login";
import {
  Api,
  createDataset,
  createSession,
  datasetNode,
  deleteSession,
  getApi,
  getDatasets,
  openSession,
  url,
} from "./session-api";

/*
 * Smoke tests for the screens built on third-party Angular components:
 * angular-split, ng-bootstrap, ng-select, ngx-toastr, ng2-pdf-viewer and
 * ag-grid. The unit tests don't render components, so these are what catches
 * a library upgrade that breaks one of them. Each test checks that the
 * component renders and does its basic job, not the app logic around it.
 */

test.describe.configure({ timeout: 90_000 });

let api: Api;
let sessionId: string | undefined;

test.beforeEach(async ({ request }) => {
  api = await getApi(request);
  sessionId = await createSession(api, "e2e third-party components");
});

test.afterEach(async () => {
  // cleared right away, so that a later test whose setup fails before
  // creating its own session doesn't delete this one again
  const sessionToDelete = sessionId;
  sessionId = undefined;
  if (sessionToDelete) {
    await deleteSession(api, sessionToDelete);
  }
});

// the dataset Actions menu of the Selected Files panel
async function openDatasetMenu(page: Page) {
  await page.locator("#fileDropdownMenuButton").click();
  return page.locator("[aria-labelledby=fileDropdownMenuButton]");
}

test("the split panes of the session view can be resized (angular-split)", async ({ page }) => {
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

test("a dropdown menu opens a modal that renames a file (ng-bootstrap)", async ({ page }) => {
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

test("deleting a file shows a toast that can undo it (ngx-toastr)", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "text\n");
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();

  const menu = await openDatasetMenu(page);
  await menu.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();

  // the app's own toast component, with the action buttons
  const toast = page.locator("#toast-container ch-action-toast-component");
  await expect(toast).toBeVisible();
  await expect(datasetNode(page, datasetId)).toBeHidden();

  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(toast).toBeHidden();
  await expect(datasetNode(page, datasetId)).toBeVisible();
  // the dataset is deleted from the server only when the toast times out
  expect((await getDatasets(api, sessionId)).map((d) => d.datasetId)).toEqual([datasetId]);
});

test("tools can be chosen from the module dropdown and the search (ng-select)", async ({ page }) => {
  /*
   * the tool names come from the toolbox, so that the test doesn't depend on
   * which tools a deployment has: the second module for the dropdown, and for
   * the search the second tool of the first module, because the first one is
   * selected already when the module is opened
   */
  const modulesResponse = await api.request.get(url(api, "toolbox", "/modules"));
  expect(modulesResponse.ok()).toBe(true);
  const modules = await modulesResponse.json();
  expect(modules.length).toBeGreaterThan(1);
  const otherModule = modules[1];
  const [, searchedTool] = modules[0].categories.flatMap((category) => category.tools);
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

test("a pdf file is rendered and paged (ng2-pdf-viewer)", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.pdf", x: 100, y: 100 }, blankPdf(2));
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();

  const pdf = page.locator("ch-pdf-visualization");
  await expect(pdf.getByText("Page 1 / 2")).toBeVisible();
  // the viewer renders the visible page to a canvas
  await expect(pdf.locator("pdf-viewer .page[data-page-number='1'] canvas")).toBeVisible();

  await pdf.getByTitle("Next page").click();
  await expect(pdf.getByText("Page 2 / 2")).toBeVisible();
  await expect(pdf.locator("pdf-viewer .page[data-page-number='2'] canvas")).toBeVisible();
});

test("a text file can be converted in the wrangle modal (ag-grid, ng-select)", async ({ page }) => {
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
  await expect
    .poll(async () => (await getDatasets(api, sessionId)).map((d) => d.name).sort())
    .toEqual(["table-converted.tsv", "table.tsv"]);
});

test("the admin storage grid lists users and opens their sessions (ag-grid)", async ({ browser }) => {
  // the user's id with the auth prefix, e.g. jaas/chipster, from the owner rule of the session
  const sessionResponse = await api.request.get(url(api, "session-db", `/sessions/${sessionId}`), {
    headers: api.headers,
  });
  expect(sessionResponse.ok()).toBe(true);
  const userId: string = (await sessionResponse.json()).rules[0].username;

  // a separate browser context for the admin, the user's session stays in the default one
  const adminContext = await browser.newContext({ storageState: ADMIN_STATE });
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
    await adminContext.close();
  }
});
