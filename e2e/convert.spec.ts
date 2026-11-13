import { Locator, Page } from "@playwright/test";

import { expect, test, waitForDevCheck } from "./fixtures";
import { Api, createDataset, datasetNode, getDatasetContent, getDatasets, openSession } from "./session-api";

/*
 * Convert to Chipster format: the wrangle modal makes a table of the user's own
 * into the format of the expression tools, the identifier column first and the
 * sample columns with the prefix "chip.", and creates a phenodata for it.
 * third-party-components.spec.ts checks that the modal's grid and dropdowns
 * work; these check what the conversion makes of the file.
 */

async function openConvertModal(page: Page, sessionId: string, datasetId: string) {
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await page.locator("#fileDropdownMenuButton").click();
  await page
    .locator("[aria-labelledby=fileDropdownMenuButton]")
    .getByRole("button", { name: "Convert to Chipster format…" })
    .click();
  /*
   * Convert closes this modal and opens a spinner modal with the same title,
   * so the two can be open at the same time while this one fades out
   */
  const modal = page.getByRole("dialog").filter({ hasText: "Source file preview" });
  await expect(modal.locator("ag-grid-angular .ag-row").first()).toBeVisible({ timeout: 30_000 });
  return modal;
}

// the dropdowns of the modal, in its order
function dropdowns(modal: Locator) {
  const all = modal.locator("ch-multi-dropdown");
  return { identifier: all.nth(0), samples: all.nth(1), others: all.nth(2) };
}

// an option by its whole name, so that "a" doesn't match "chip.a"
function option(page: Page, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.locator("ng-dropdown-panel .ng-option").filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) });
}

async function selectIdentifier(page: Page, dropdown: Locator, name: string) {
  await dropdown.locator("ng-select").click();
  await option(page, name).click();
  await expect(dropdown.locator(".ng-value-label")).toHaveText(name);
}

// a column that has the same name as another is given by its position among those
async function selectColumns(page: Page, dropdown: Locator, columns: (string | [string, number])[]) {
  await dropdown.locator("ng-select").click();
  for (const column of columns) {
    const [name, nth] = typeof column === "string" ? [column, 0] : column;
    await option(page, name).nth(nth).click();
  }
  const panel = page.locator("ng-dropdown-panel");
  await panel.getByRole("button", { name: "Done" }).click();
  await expect(panel).toBeHidden();
}

// runs the conversion and returns the new dataset, after its content has been uploaded
async function convert(modal: Locator, api: Api, sessionId: string, name: string) {
  await modal.getByRole("button", { name: "Convert" }).click();
  await expect(modal).toBeHidden();
  let converted: { datasetId: string; name: string };
  await expect
    .poll(async () => {
      converted = (await getDatasets(api, sessionId)).find((d) => d.name === name);
      return converted != null;
    })
    .toBe(true);
  // the dataset is created before its content is uploaded
  await expect
    .poll(async () => (await api.get("file-broker", `/sessions/${sessionId}/datasets/${converted.datasetId}`)).ok())
    .toBe(true);
  const dataset = await (await api.get("session-db", `/sessions/${sessionId}/datasets/${converted.datasetId}`)).json();
  return { dataset, content: await getDatasetContent(api, sessionId, converted.datasetId) };
}

const TABLE = "id\ta\tchip.b\tsymbol\tdesc\ng1\t1\t2\tA1\tfirst\ng2\t3\t4\tB2\tsecond\n";

test("the sample columns get the chip. prefix and a phenodata, the chosen other columns are included", async ({
  page,
  api,
  sessionId,
}) => {
  const datasetId = await createDataset(api, sessionId, { name: "table.tsv", x: 100, y: 100 }, TABLE);
  const modal = await openConvertModal(page, sessionId, datasetId);
  const { identifier, samples, others } = dropdowns(modal);

  await selectIdentifier(page, identifier, "id");
  // one without the prefix, one with it already
  await selectColumns(page, samples, ["a", "chip.b"]);
  // the default: the chosen other columns are included, the rest left out
  await expect(modal.locator("select")).toHaveValue("included");
  await selectColumns(page, others, ["symbol"]);

  const { dataset, content } = await convert(modal, api, sessionId, "table-converted.tsv");

  // the identifier first, without a header of its own, then the rest in their original order
  expect(content).toBe("chip.a\tchip.b\tsymbol\ng1\t1\t2\tA1\ng2\t3\t4\tB2");
  // a row per sample, named without the prefix, the groups left for the user
  expect(dataset.metadataFiles).toEqual([
    {
      name: "phenodata.tsv",
      content:
        "sample\toriginal_name\tchiptype\tgroup\tdescription\n" +
        "a\ttable.tsv\tnot applicable\t\ta\n" +
        "b\ttable.tsv\tnot applicable\t\tb\n",
    },
  ]);
});

test("the chosen other columns can be left out instead", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "table.tsv", x: 100, y: 100 }, TABLE);
  const modal = await openConvertModal(page, sessionId, datasetId);
  const { identifier, samples, others } = dropdowns(modal);

  await selectIdentifier(page, identifier, "id");
  await selectColumns(page, samples, ["a", "chip.b"]);
  await modal.locator("select").selectOption("excluded");
  await selectColumns(page, others, ["desc"]);

  const { content } = await convert(modal, api, sessionId, "table-converted.tsv");
  expect(content).toBe("chip.a\tchip.b\tsymbol\ng1\t1\t2\tA1\ng2\t3\t4\tB2");
});

test("duplicate identifiers and duplicate column names are warned about", async ({ page, api, sessionId }) => {
  const content = "id\tchip.a\tnote\tnote\ng1\t1\tx\ty\ng1\t2\tz\tw\ng2\t3\tv\tu\n";
  const datasetId = await createDataset(api, sessionId, { name: "dup.tsv", x: 100, y: 100 }, content);
  const modal = await openConvertModal(page, sessionId, datasetId);
  const { identifier, samples, others } = dropdowns(modal);
  const warnings = modal.locator(".alert-warning");
  await expect(warnings).toHaveCount(0);

  await selectIdentifier(page, identifier, "id");
  await expect(warnings).toHaveText(["Identifier column contains 1 non-unique identifiers including g1"]);

  await selectColumns(page, samples, ["chip.a"]);
  await selectColumns(page, others, [
    ["note", 0],
    ["note", 1],
  ]);
  await expect(warnings).toHaveText([
    "Selected columns have 1 non-unique names including note",
    "Identifier column contains 1 non-unique identifiers including g1",
  ]);

  // only warnings, the file can still be converted
  await expect(modal.getByRole("button", { name: "Convert" })).toBeEnabled();
});

/*
 * The limit is checked against the size of the dataset before its content is
 * downloaded, so the test makes the app see a big size rather than uploading
 * a file over 200 MB.
 */
test("a file over the size limit is not converted", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "big.tsv", x: 100, y: 100 }, TABLE);
  await page.route(
    (url) => url.pathname.endsWith(`/sessions/${sessionId}/datasets`),
    async (route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }
      const response = await route.fetch();
      const datasets = (await response.json()).map((d) =>
        d.datasetId === datasetId ? { ...d, size: 200 * 1024 * 1024 + 1 } : d,
      );
      return route.fulfill({ response, json: datasets });
    },
  );
  await openSession(page, sessionId, datasetId);
  await datasetNode(page, datasetId).click();
  await page.locator("#fileDropdownMenuButton").click();
  await page
    .locator("[aria-labelledby=fileDropdownMenuButton]")
    .getByRole("button", { name: "Convert to Chipster format…" })
    .click();

  const dialogs = page.getByRole("dialog");
  await expect(dialogs.getByText("Converting file not possible")).toBeVisible();
  await expect(dialogs).toContainText("The file is too big to be converted. The size limit is 200 MB");
  // the convert modal would open only after loading its code and the file, so give it time to show up
  await waitForDevCheck(page);
  await expect(dialogs).toHaveCount(1);
  await expect(page.getByText("Source file preview")).toHaveCount(0);
});
