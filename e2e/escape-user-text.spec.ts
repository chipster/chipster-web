import { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { Api, createDataset, datasetNode, openSession } from "./session-api";

/*
 * Dataset names and the headers of a file are user input, and a session can be
 * shared, so they must be shown as text, never parsed as HTML. The payload
 * counts its executions in window.xssCount, and an <img src="x"> in the
 * document means that it was parsed as HTML even if the handler didn't run.
 */

const PAYLOAD = `<img src="x" onerror="window.xssCount = (window.xssCount || 0) + 1">`;
// label names are limited to 30 characters
const SHORT_PAYLOAD = `<img src="x" onerror="z()">`;

async function getPhenodataRows(api: Api, sessionId: string, datasetId: string): Promise<string[][]> {
  const response = await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`);
  const dataset = await response.json();
  const content: string = dataset.metadataFiles.find((f) => f.name === "phenodata.tsv").content;
  // only the final newline, trimEnd() would take the empty cells of the last row too
  return content
    .replace(/\n$/, "")
    .split("\n")
    .map((line) => line.split("\t"));
}

async function expectNotParsed(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { xssCount?: number }).xssCount)).toBeUndefined();
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
}

test.describe.configure({ timeout: 90_000 });

test("a dataset name is shown as text in the workflow graph", async ({ page, api, sessionId }) => {
  const name = PAYLOAD + ".txt";
  const labelResponse = await api.post("session-db", `/sessions/${sessionId}/labels`, {
    name: SHORT_PAYLOAD,
    color: "#0d6efd",
  });
  expect(labelResponse.ok()).toBe(true);
  const labelId = (await labelResponse.json()).labelId;

  const plainId = await createDataset(api, sessionId, { name, x: 100, y: 100 }, "text\n");
  const labelledId = await createDataset(api, sessionId, { name, x: 300, y: 100, labelIds: [labelId] }, "text\n");

  await openSession(page, sessionId, plainId);

  // hover tooltip without labels
  const tooltip = page.locator("body > .dataset-tooltip");
  await datasetNode(page, plainId).hover();
  await expect(tooltip).toHaveText(name);

  // hover tooltip with labels, the only one that is still built as HTML
  await datasetNode(page, labelledId).hover();
  await expect(tooltip).toContainText(name);
  await expect(tooltip).toContainText(SHORT_PAYLOAD);

  // name tags, which are shown only while searching
  // the search box reacts to keyup, which fill() doesn't send
  const search = page.getByRole("textbox", { name: "Find file" });
  await search.pressSequentially("img");
  // full names, or "<img ..." when the tags overlap and are shortened to their first five characters
  await expect(page.locator(".dataset-node-tooltip")).toHaveText([/^<img/, /^<img/]);

  await expectNotParsed(page);
});

test("the headers of a file are shown as text in the spreadsheet", async ({ page, api, sessionId }) => {
  const content = `gene\t${PAYLOAD}\t\tvalue\ng1\t1\t2\t3\n`;
  const datasetId = await createDataset(api, sessionId, { name: "headers.tsv", x: 100, y: 100 }, content);

  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();

  const headers = page.locator(".ht_master thead th, .ht_clone_top thead th");
  await expect(headers.filter({ hasText: PAYLOAD }).first()).toBeVisible();
  await expect(headers.filter({ hasText: "<empty>" }).first()).toBeVisible();

  await expectNotParsed(page);
});

test("phenodata headers are shown as text and columns can be added and removed", async ({ page, api, sessionId }) => {
  const phenodata = `sample\toriginal_name\t${PAYLOAD}\ns1\ta.cel\tP1\ns2\tb.cel\tP2\n`;
  const datasetId = await createDataset(
    api,
    sessionId,
    { name: "phenodata.tsv", x: 100, y: 100, metadataFiles: [{ name: "phenodata.tsv", content: phenodata }] },
    "gene\tchip.a\tchip.b\ng1\t1\t2\n",
  );

  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await page.locator("#visTab").getByText("Phenodata", { exact: true }).click();

  const table = page.locator("ch-phenodata-visualization");
  await expect(table.locator("thead th").filter({ hasText: PAYLOAD }).first()).toBeVisible();
  await expectNotParsed(page);

  async function addColumn(name: string) {
    await table
      .getByRole("button", { name: /column/i })
      .first()
      .click();
    await page.locator(".modal-content input").fill(name);
    await page.locator(".modal-content").getByRole("button", { name: "Add" }).click();
  }

  // group goes right after the columns that can't be edited, others to the end
  await addColumn("group");
  await expect
    .poll(async () => (await getPhenodataRows(api, sessionId, datasetId))[0])
    .toEqual(["sample", "original_name", "group", PAYLOAD]);

  await addColumn("extra");
  await expect
    .poll(async () => (await getPhenodataRows(api, sessionId, datasetId))[0])
    .toEqual(["sample", "original_name", "group", PAYLOAD, "extra"]);

  // the table shows the same headers in the same order
  await expect(table.locator(".ht_clone_top thead th")).toHaveText([
    "sample",
    "original_name",
    "group",
    PAYLOAD,
    "extra",
  ]);

  // remove the payload column, its values must go with it
  await table
    .locator(".ht_clone_top thead th")
    .filter({ hasText: PAYLOAD })
    .locator("#phenodata-header-button")
    .click();
  await page.locator(".modal-content").getByRole("button", { name: "Delete" }).click();
  await expect
    .poll(async () => getPhenodataRows(api, sessionId, datasetId))
    .toEqual([
      ["sample", "original_name", "group", "extra"],
      ["s1", "a.cel", "", ""],
      ["s2", "b.cel", "", ""],
    ]);
  await expect(table.locator(".ht_clone_top thead th")).toHaveText(["sample", "original_name", "group", "extra"]);

  // Handsontable's own undo brings the column back, header and values alike.
  // Only the table: like any undo here, it reaches the server with the next
  // cell edit, so the dataset isn't checked.
  await table.locator(".ht_master tbody td").first().click();
  await page.keyboard.press("Control+z");
  await expect(table.locator(".ht_clone_top thead th")).toHaveText([
    "sample",
    "original_name",
    "group",
    PAYLOAD,
    "extra",
  ]);
  await expect(table.locator(".ht_master tbody tr").first().locator("td")).toHaveText(["s1", "a.cel", "", "P1", ""]);

  // reset deletes all the editable columns at once and rebuilds the table
  await table.getByRole("button", { name: "Reset" }).click();
  await page.locator(".modal-content").getByRole("button", { name: "Delete columns" }).click();
  await expect(table.locator(".ht_clone_top thead th")).toHaveText(["sample", "original_name"]);
  await expect(table.locator(".ht_master tbody tr").first().locator("td")).toHaveText(["s1", "a.cel"]);
  await expect
    .poll(async () => getPhenodataRows(api, sessionId, datasetId))
    .toEqual([
      ["sample", "original_name"],
      ["s1", "a.cel"],
      ["s2", "b.cel"],
    ]);

  await expectNotParsed(page);
});
