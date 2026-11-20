import { Locator, Page } from "@playwright/test";

import { expect, test, waitForDevCheck } from "./fixtures";
import {
  Api,
  createDataset,
  datasetNode,
  getPhenodataRows,
  openSession,
  updateDataset,
  visualizationTab,
} from "./session-api";

/*
 * The phenodata editor: a Handsontable table of the phenodata.tsv of the selected
 * dataset. Each edit is saved to the dataset on the server, and the table follows
 * the changes that others make to it. The column headers, adding and removing
 * columns and Reset's "Delete columns" are tested in escape-user-text.spec.ts.
 */

const EXPR = "identifier\tchip.a\tchip.b\ng1\t1\t2\ng2\t3\t4\n";

const PHENODATA = "sample\toriginal_name\tgroup\tdescription\nchip.a\ta.cel\t\tfirst\nchip.b\tb.cel\t\tsecond\n";

async function openPhenodata(page: Page, api: Api, sessionId: string, phenodata: string): Promise<[string, Locator]> {
  const datasetId = await createDataset(
    api,
    sessionId,
    { name: "expr.tsv", x: 100, y: 100, metadataFiles: [{ name: "phenodata.tsv", content: phenodata }] },
    EXPR,
  );
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Phenodata").click();
  const table = page.locator("ch-phenodata-visualization");
  await expect(rows(table).first()).toBeVisible();
  return [datasetId, table];
}

function rows(table: Locator): Locator {
  return table.locator(".ht_master tbody tr");
}

function cell(table: Locator, row: number, col: number): Locator {
  return rows(table).nth(row).locator("td").nth(col);
}

async function expectTable(table: Locator, expected: string[][]) {
  await expect(rows(table)).toHaveCount(expected.length);
  for (const [i, row] of expected.entries()) {
    await expect(rows(table).nth(i).locator("td")).toHaveText(row);
  }
}

test("phenodata cell edits are saved to the dataset", async ({ page, api, sessionId }) => {
  const [datasetId, table] = await openPhenodata(page, api, sessionId, PHENODATA);

  // typing in a selected cell replaces its value, Enter saves it and moves down
  await cell(table, 0, 2).click();
  await page.keyboard.type("ctrl");
  await page.keyboard.press("Enter");
  await page.keyboard.type("treated");
  await page.keyboard.press("Enter");

  // an existing value is replaced too. The editor stays open past the second
  // after the last edit when the component would rebuild the table if it took
  // the events of its own saves above for someone else's change
  await cell(table, 1, 3).dblclick();
  await page.waitForTimeout(1500);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("changed");
  await page.keyboard.press("Enter");

  await expect
    .poll(async () => getPhenodataRows(api, sessionId, datasetId))
    .toEqual([
      ["sample", "original_name", "group", "description"],
      ["chip.a", "a.cel", "ctrl", "first"],
      ["chip.b", "b.cel", "treated", "changed"],
    ]);
  await expect(table.getByText("Group column contains empty values")).toBeHidden();
  await waitForDevCheck(page);
});

test("phenodata reset clears the values and resets to the phenodata of when the view was opened", async ({
  page,
  api,
  sessionId,
}) => {
  const filled = "sample\toriginal_name\tgroup\tdescription\nchip.a\ta.cel\t1\tfirst\nchip.b\tb.cel\t2\tsecond\n";
  const [datasetId, table] = await openPhenodata(page, api, sessionId, filled);
  const modal = page.locator(".modal-content");

  // nothing has changed yet, so there's nothing to reset to
  await table.getByRole("button", { name: "Reset" }).click();
  await expect(modal.getByRole("button", { name: "Reset to previous" })).toBeDisabled();
  await expect(modal.getByRole("button", { name: "Delete columns" })).toBeEnabled();

  // clear the values of the editable columns, the columns stay
  await modal.getByRole("button", { name: "Clear values" }).click();
  await expect
    .poll(async () => getPhenodataRows(api, sessionId, datasetId))
    .toEqual([
      ["sample", "original_name", "group", "description"],
      ["chip.a", "a.cel", "", ""],
      ["chip.b", "b.cel", "", ""],
    ]);
  await expectTable(table, [
    ["chip.a", "a.cel", "", ""],
    ["chip.b", "b.cel", "", ""],
  ]);
  await expect(table.getByText("Group column contains empty values")).toBeVisible();

  // no values left to clear, but now there's a change to undo
  await table.getByRole("button", { name: "Reset" }).click();
  await expect(modal.getByRole("button", { name: "Clear values" })).toBeDisabled();
  await modal.getByRole("button", { name: "Reset to previous" }).click();
  await expect
    .poll(async () => getPhenodataRows(api, sessionId, datasetId))
    .toEqual([
      ["sample", "original_name", "group", "description"],
      ["chip.a", "a.cel", "1", "first"],
      ["chip.b", "b.cel", "2", "second"],
    ]);
  await expectTable(table, [
    ["chip.a", "a.cel", "1", "first"],
    ["chip.b", "b.cel", "2", "second"],
  ]);
  await expect(table.getByText("Group column contains empty values")).toBeHidden();
  await waitForDevCheck(page);
});

test("the phenodata table follows a change that someone else makes", async ({ page, api, sessionId }) => {
  const [datasetId, table] = await openPhenodata(page, api, sessionId, PHENODATA);
  await expect(table.getByText("Group column contains empty values")).toBeVisible();

  // like another browser with the same session open
  const changed =
    "sample\toriginal_name\tgroup\tdescription\textra\nchip.a\ta.cel\t1\tfirst\tx\nchip.b\tb.cel\t2\tsecond\ty\n";
  await updateDataset(api, sessionId, datasetId, {
    metadataFiles: [{ name: "phenodata.tsv", content: changed }],
  });

  await expect(table.locator(".ht_clone_top thead th")).toHaveText([
    "sample",
    "original_name",
    "group",
    "description",
    "extra",
  ]);
  await expectTable(table, [
    ["chip.a", "a.cel", "1", "first", "x"],
    ["chip.b", "b.cel", "2", "second", "y"],
  ]);
  await expect(table.getByText("Group column contains empty values")).toBeHidden();
  await waitForDevCheck(page);
});
