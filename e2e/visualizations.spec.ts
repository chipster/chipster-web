import { expect, test } from "./fixtures";
import { createDataset, datasetNode, openSession, updateDataset, visualizationTab } from "./session-api";

/*
 * The visualizations follow the events of the libraries that draw them, d3 and Handsontable,
 * and the dataset events.
 */

const EXPR =
  "identifier\tsymbol\tchip.a\tchip.b\n" + "g1\tS1\t1\t2\n" + "g2\tS2\t3\t1\n" + "g3\tS3\t5\t4\n" + "g4\tS4\t2\t5\n";

test("the plots and the Venn diagram follow their selections, and the header a rename", async ({
  page,
  api,
  sessionId,
}) => {
  const exprId = await createDataset(api, sessionId, { name: "expr.tsv", x: 100, y: 100 }, EXPR);
  const otherId = await createDataset(
    api,
    sessionId,
    { name: "other.tsv", x: 300, y: 100 },
    "identifier\tsymbol\tchip.a\ng1\tS1\t1\ng5\tS5\t2\n",
  );
  await openSession(page, sessionId, exprId);
  await datasetNode(page, exprId).click();

  // a rename elsewhere shows in the header of the selected file
  await updateDataset(api, sessionId, exprId, { name: "renamed.tsv" });
  await expect(page.locator("ch-selected-files .h6")).toHaveText("renamed.tsv");

  // a click on a data point of the scatter plot is a d3 event
  await visualizationTab(page, "Scatter Plot").click();
  const scatter = page.locator("ch-scatter-plot");
  await expect(scatter.locator(".dot").first()).toBeVisible();
  await expect(scatter.getByText("Select features by clicking")).toBeVisible();
  await scatter.locator(".dot").first().click();
  await expect(scatter.getByText("1/4 features")).toBeVisible();

  // the same in the expression profile, by drawing a rectangle over everything
  await visualizationTab(page, "Expression Profile").click();
  const profile = page.locator("ch-expression-profile");
  const svg = profile.locator("svg").first();
  await expect(svg).toBeVisible();
  const box = await svg.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + 60, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 10, box.y + box.height - 40, { steps: 5 });
  await page.mouse.up();
  await expect(profile.getByText(/\/4 features/)).toBeVisible();

  // two files: a click in a circle of the Venn diagram
  await datasetNode(page, otherId).click({ modifiers: ["ControlOrMeta"] });
  await visualizationTab(page, "Venn Diagram").click();
  const venn = page.locator("ch-venn-diagram");
  const circle = venn.locator("#circleGroup ellipse").first();
  await expect(circle).toBeVisible();
  // the left edge of the first circle, outside the other one. A locator click scrolls the diagram into view
  const c = await circle.boundingBox();
  expect(c).not.toBeNull();
  await circle.click({ position: { x: 10, y: c.height / 2 } });
  await expect(venn.getByText(/Selected: \d+/)).toBeVisible();
});

test("the phenodata warnings follow an edit in Handsontable", async ({ page, api, sessionId }) => {
  const exprId = await createDataset(
    api,
    sessionId,
    {
      name: "expr.tsv",
      x: 100,
      y: 100,
      metadataFiles: [
        {
          name: "phenodata.tsv",
          content: "sample\toriginal_name\tgroup\tdescription\nchip.a\ta.cel\t\ta\nchip.b\tb.cel\t2\tb\n",
        },
      ],
    },
    EXPR,
  );
  await openSession(page, sessionId, exprId);
  await datasetNode(page, exprId).click();
  await visualizationTab(page, "Phenodata").click();
  const pheno = page.locator("ch-phenodata-visualization");
  await expect(pheno.getByText("Group column contains empty values")).toBeVisible();

  // the empty group cell of the first row
  const cell = pheno.locator(".htCore tbody tr").first().locator("td").nth(2);
  await cell.dblclick();
  await page.keyboard.type("1");
  await page.keyboard.press("Enter");
  await expect(pheno.getByText("Group column contains empty values")).toBeHidden();
});
