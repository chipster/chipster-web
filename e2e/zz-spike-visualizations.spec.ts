import { expect, test } from "./fixtures";
import { createDataset, datasetNode, openSession } from "./session-api";

// temporary spike test, not to be committed: the visualizations follow d3, Handsontable and dataset events

const EXPR =
  "identifier\tsymbol\tchip.a\tchip.b\n" + "g1\tS1\t1\t2\n" + "g2\tS2\t3\t1\n" + "g3\tS3\t5\t4\n" + "g4\tS4\t2\t5\n";

function tab(page, name: string) {
  return page.locator("ch-visualizations").getByText(name, { exact: true }).first();
}

test("plot selection, venn selection and rename", async ({ page, api, sessionId }) => {
  page.on("console", (m) => {
    if (m.type() === "error") {
      console.log("CONSOLE ERROR at step", step, m.text().slice(0, 60));
    }
  });
  let step = "start";
  const exprId = await createDataset(api, sessionId, { name: "expr.tsv", x: 100, y: 100 }, EXPR);
  const otherId = await createDataset(
    api,
    sessionId,
    { name: "other.tsv", x: 300, y: 100 },
    "identifier\tsymbol\tchip.a\ng1\tS1\t1\ng5\tS5\t2\n",
  );
  await openSession(page, sessionId, exprId);
  await datasetNode(page, exprId).click();

  step = "rename";
  // a rename elsewhere shows in the header of the selected file
  const current = await (await api.get("session-db", `/sessions/${sessionId}/datasets/${exprId}`)).json();
  expect(
    (
      await api.put("session-db", `/sessions/${sessionId}/datasets/${exprId}`, { ...current, name: "renamed.tsv" })
    ).ok(),
  ).toBe(true);
  await expect(page.locator("ch-selected-files .h6")).toHaveText("renamed.tsv");

  step = "scatter";
  // a click on a data point of the scatter plot is a d3 event
  await tab(page, "Scatter Plot").click();
  const scatter = page.locator("ch-scatter-plot");
  await expect(scatter.locator(".dot").first()).toBeVisible();
  await expect(scatter.getByText("Select features by clicking")).toBeVisible();
  await scatter.locator(".dot").first().click();
  await expect(scatter.getByText("1/4 features")).toBeVisible();

  step = "profile";
  // the same in the expression profile, by drawing a rectangle over everything
  await tab(page, "Expression Profile").click();
  const profile = page.locator("ch-expression-profile");
  const svg = profile.locator("svg").first();
  await expect(svg).toBeVisible();
  const box = await svg.boundingBox();
  await page.mouse.move(box.x + 60, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 10, box.y + box.height - 40, { steps: 5 });
  await page.mouse.up();
  await expect(profile.getByText(/\/4 features/)).toBeVisible();

  step = "venn";
  // two files: a click in a circle of the venn diagram
  await datasetNode(page, otherId).click({ modifiers: ["ControlOrMeta"] });
  await tab(page, "Venn Diagram").click();
  const venn = page.locator("ch-venn-diagram");
  const circle = venn.locator("#circleGroup ellipse").first();
  await expect(circle).toBeVisible();
  // the left edge of the first circle, outside the other one. A locator click scrolls the diagram into view
  const c = await circle.boundingBox();
  await circle.click({ position: { x: 10, y: c.height / 2 } });
  await expect(venn.getByText(/Selected: \d+/)).toBeVisible();

  await page.waitForTimeout(3000);
});

test("phenodata warnings follow an edit in Handsontable", async ({ page, api, sessionId }) => {
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
  await tab(page, "Phenodata").click();
  const pheno = page.locator("ch-phenodata-visualization");
  await expect(pheno.getByText("Group column contains empty values")).toBeVisible();

  // the empty group cell of the first row
  const cell = pheno.locator(".htCore tbody tr").first().locator("td").nth(2);
  await cell.dblclick();
  await page.keyboard.type("1");
  await page.keyboard.press("Enter");
  await expect(pheno.getByText("Group column contains empty values")).toBeHidden();

  await page.waitForTimeout(3000);
});
