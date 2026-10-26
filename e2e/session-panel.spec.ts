import { expect, test } from "./fixtures";
import { createDataset, createLabel, datasetNode, openSession, updateDataset } from "./session-api";

/*
 * The session panel follows the selection made in the workflow graph, which d3 handles, and the
 * label events. The label is applied through the API, so the page learns about it only from the
 * events.
 */

test("the session panel follows the graph selection and the label events", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "b\n");
  await openSession(page, sessionId, datasetId);
  const panel = page.locator("ch-session-panel");

  // The default labels are added when the session is opened, so the split button has a label,
  // but it's disabled until a file is selected. The legend of the graph gets buttons with the
  // same title below, so the toolbar's class tells them apart.
  const splitButton = panel.locator('button.tool-bar-button[title^="Apply or remove"]');
  await expect(splitButton).toBeDisabled();
  // a click in the d3 graph isn't an Angular event of the panel
  await datasetNode(page, datasetId).click();
  await expect(splitButton).toBeEnabled();

  // the label legend follows a label applied elsewhere
  const legend = page.locator("ch-workflow-graph .label-legend");
  await expect(legend).toBeHidden();
  const labelId = await createLabel(api, sessionId, "remote-label");
  await updateDataset(api, sessionId, datasetId, { labelIds: [labelId] });
  await expect(legend.locator(".label-legend-name")).toHaveText(["remote-label"]);
  await expect(legend.locator(".label-legend-item")).toBeEnabled();

  // the panel's labels menu hides the legend of the graph, and shows it again
  await panel.getByTitle("Labels menu").click();
  await page.locator(".dropdown-menu.show").getByText("Hide labels panel").click();
  await expect(legend).toBeHidden();
  await panel.getByTitle("Labels menu").click();
  await page.locator(".dropdown-menu.show").getByText("Show labels panel").click();
  await expect(legend).toBeVisible();

  // the List tab shows the selection made in the graph
  await panel.getByRole("tab", { name: "List" }).click();
  const rows = panel.locator(".dataset-list-button");
  await expect(rows.filter({ hasText: "a.txt" })).toHaveClass(/active/);
  await expect(rows.filter({ hasText: "b.txt" })).not.toHaveClass(/active/);
});
