import { expect, test, waitForDevCheck } from "./fixtures";
import { createDataset, createLabel, datasetNode, openSession, setUserPreference, updateDataset } from "./session-api";

/*
 * The session panel follows the selection made in the workflow graph, which d3 handles, and the
 * label events. The label is applied through the API, so the page learns about it only from the
 * events.
 */

test("the session panel follows the graph selection and the label events", async ({ page, api, sessionId }) => {
  /*
   * The legend is shown only when the labels panel is, and that is a preference saved on the
   * user. This test hides the panel and shows it again, but the two saves can land in the wrong
   * order, or fail when another test updates the user at the same time, and then the panel would
   * stay hidden in later runs.
   */
  await setUserPreference(api, "labels", "showLabelPanel", true);
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
  /*
   * The app writes the whole user back when a session is opened, so another test can still
   * put the hidden panel back between setUserPreference and this page's read of it. The
   * labels menu shows what the page read: if the panel is hidden, show it as a user would.
   */
  const labelsMenuButton = panel.getByTitle("Labels menu");
  await labelsMenuButton.click();
  const panelToggle = page.locator(".dropdown-menu.show").getByText(/labels panel/);
  await expect(panelToggle).toBeVisible();
  if ((await panelToggle.innerText()) === "Show labels panel") {
    await panelToggle.click();
  } else {
    await labelsMenuButton.click();
  }
  await expect(legend.locator(".label-legend-name")).toHaveText(["remote-label"]);
  await expect(legend.locator(".label-legend-item")).toBeEnabled();

  // the panel's labels menu hides the legend of the graph, and shows it again
  await labelsMenuButton.click();
  await page.locator(".dropdown-menu.show").getByText("Hide labels panel").click();
  await expect(legend).toBeHidden();
  await labelsMenuButton.click();
  await page.locator(".dropdown-menu.show").getByText("Show labels panel").click();
  await expect(legend).toBeVisible();

  // the List tab shows the selection made in the graph
  await panel.getByRole("tab", { name: "List" }).click();
  const rows = panel.locator(".dataset-list-button");
  await expect(rows.filter({ hasText: "a.txt" })).toHaveClass(/active/);
  await expect(rows.filter({ hasText: "b.txt" })).not.toHaveClass(/active/);
  await waitForDevCheck(page);
});

/*
 * The toolbar's split button shows the label used last. The labels modal records it only after
 * its requests, so the panel learns about it from the service's signal, not from the map update
 * that comes before.
 */
test("the split button follows the label applied in the labels modal", async ({ page, api, sessionId }) => {
  const datasetId = await createDataset(api, sessionId, { name: "a.txt", x: 100, y: 100 }, "a\n");
  await openSession(page, sessionId, datasetId);
  const panel = page.locator("ch-session-panel");
  const splitButton = panel.locator('button.tool-bar-button[title^="Apply or remove"]');
  await datasetNode(page, datasetId).click();
  await expect(splitButton).toBeEnabled();
  const titleBefore = await splitButton.getAttribute("title");

  // apply the last of the default labels, which isn't the one the button shows
  await panel.getByTitle("Labels menu").click();
  await page.locator(".dropdown-menu.show").getByText("Edit labels…").click();
  const modal = page.locator("ch-labels-modal");
  const lastRow = modal.locator("tbody tr").last();
  const labelName = (await lastRow.locator("ch-label-pill").innerText()).trim();
  const titleAfter = `Apply or remove '${labelName}'`;
  expect(titleAfter).not.toBe(titleBefore);
  await lastRow.locator("input[type=checkbox]").check();
  await modal.getByRole("button", { name: "Apply" }).click();
  await expect(modal).toBeHidden();
  await expect(splitButton).toHaveAttribute("title", titleAfter);

  // the button shows the label also when the update failed, so check that the file got it
  const labels = await (await api.get("session-db", `/sessions/${sessionId}/labels`)).json();
  const labelId = labels.find((label) => label.name === labelName).labelId;
  await expect
    .poll(
      async () => (await (await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`)).json()).labelIds,
    )
    .toContain(labelId);
  await waitForDevCheck(page);
});
