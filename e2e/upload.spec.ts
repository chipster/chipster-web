import { expect, test } from "./fixtures";
import { datasetNode, getDatasetContent, getDatasets, openSession } from "./session-api";

/*
 * The other tests create their files through the API, so this is the one
 * that uploads through the app: the Add file menu, flow.js and the upload
 * modal.
 */

test("a file uploaded from the Add file menu becomes a dataset", async ({ page, api, sessionId }) => {
  // more than one line and a tab, so that a truncated or mangled upload shows
  const content = "gene\tvalue\n" + Array.from({ length: 100 }, (_, i) => `g${i}\t${i}`).join("\n") + "\n";
  await openSession(page, sessionId);

  await page.locator("#addFileDropdownMenuButton").click();
  // flow.js opens the file chooser from its own hidden input
  const fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload file(s)" }).click();
  await (
    await fileChooser
  ).setFiles({ name: "upload.tsv", mimeType: "text/tab-separated-values", buffer: Buffer.from(content) });

  const modal = page.getByRole("dialog");
  await expect(modal.getByRole("heading", { name: "Upload files" })).toBeVisible();
  await expect(modal.getByRole("cell", { name: "upload.tsv" })).toBeVisible();
  await expect(modal.locator(".fa-check-circle")).toBeVisible({ timeout: 30_000 });

  // the dataset with the same content
  let datasets: Awaited<ReturnType<typeof getDatasets>>;
  await expect
    .poll(async () => {
      datasets = await getDatasets(api, sessionId);
      return datasets.map((d) => d.name);
    })
    .toEqual(["upload.tsv"]);
  const [dataset] = datasets;
  expect(await getDatasetContent(api, sessionId, dataset.datasetId)).toBe(content);

  // and in the workflow graph, once the modal is closed
  // the text button of the footer, the header has an icon button with the same name
  await modal.getByText("Close", { exact: true }).click();
  await expect(modal).toBeHidden();
  await expect(datasetNode(page, dataset.datasetId)).toBeVisible();
});
