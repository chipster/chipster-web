import { expect, test } from "./fixtures";
import { createDataset, datasetNode, openSession } from "./session-api";

// temporary spike test, not to be committed: the session panel follows the graph and the events
test("session panel follows the graph selection and label events", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await createDataset(api, sessionId, { name: "b.txt", x: 300, y: 100 }, "b\n");
  await openSession(page, sessionId, datasetId);
  const panel = page.locator("ch-session-panel");

  // the default labels are seeded when the session is opened, so the split button has a label,
  // but it's disabled until a file is selected
  const splitButton = panel.getByTitle(/^Apply or remove/);
  await expect(splitButton).toBeDisabled();
  // a click in the d3 graph isn't an Angular event of the panel
  await datasetNode(page, datasetId).click();
  await expect(splitButton).toBeEnabled();

  // the label legend follows a label applied elsewhere
  const legend = page.locator("ch-workflow-graph .label-legend");
  await expect(legend).toBeHidden();
  const label = await api.post("session-db", `/sessions/${sessionId}/labels`, {
    sessionId,
    name: "spike-label",
    color: "#ff0000",
  });
  expect(label.ok()).toBe(true);
  const labelId = (await label.json()).labelId;
  const current = await (await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`)).json();
  const update = await api.put("session-db", `/sessions/${sessionId}/datasets/${datasetId}`, {
    ...current,
    labelIds: [labelId],
  });
  expect(update.ok()).toBe(true);
  await expect(legend.locator(".label-legend-name")).toHaveText(["spike-label"]);
  await expect(legend.locator(".label-legend-item")).toBeEnabled();

  // the panel's labels menu hides the legend of the graph, and shows it again
  await panel.getByTitle("Labels menu").click();
  await page.locator(".dropdown-menu.show").getByText("Hide labels panel").click();
  await expect(legend).toBeHidden();
  await panel.getByTitle("Labels menu").click();
  await page.locator(".dropdown-menu.show").getByText("Show labels panel").click();
  await expect(legend).toBeVisible();

  // the List tab shows the selection made in the graph
  await panel.getByText("List", { exact: true }).click();
  const rows = panel.locator(".dataset-list-button");
  await expect(rows.filter({ hasText: "a.txt" })).toHaveClass(/active/);
  await expect(rows.filter({ hasText: "b.txt" })).not.toHaveClass(/active/);

  await page.waitForTimeout(3000);
});
