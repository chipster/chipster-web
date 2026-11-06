import { Route } from "@playwright/test";

import { expect, test } from "./fixtures";
import { datasetNode, getDatasetContent, getDatasets, openSession } from "./session-api";

/*
 * The other tests create their files through the API, so these are the ones
 * that upload through the app: the Add file menu, flow.js and the upload
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

test("several files uploaded at once and more from the upload modal become datasets", async ({
  page,
  api,
  sessionId,
}) => {
  const files = {
    "a.tsv": "gene\tvalue\ng1\t1\n",
    "b.tsv": "gene\tvalue\ng2\t2\n",
    "c.txt": "some text\n",
    "d.txt": "added later\n",
  };
  const toUpload = (names: string[]) =>
    names.map((name) => ({ name, mimeType: "text/plain", buffer: Buffer.from(files[name]) }));
  await openSession(page, sessionId);

  // three files in one go
  await page.locator("#addFileDropdownMenuButton").click();
  let fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload file(s)" }).click();
  await (await fileChooser).setFiles(toUpload(["a.tsv", "b.tsv", "c.txt"]));

  const modal = page.getByRole("dialog");
  await expect(modal.getByRole("heading", { name: "Upload files" })).toBeVisible();
  await expect(modal.locator(".fa-check-circle")).toHaveCount(3, { timeout: 30_000 });

  // and one more from the menu of the modal, which has a button of the same id as the one of the page
  await modal.getByRole("button", { name: "Add more files" }).click();
  fileChooser = page.waitForEvent("filechooser");
  await modal.getByRole("button", { name: "Upload file(s)" }).click();
  await (await fileChooser).setFiles(toUpload(["d.txt"]));

  for (const name of Object.keys(files)) {
    await expect(modal.getByRole("cell", { name })).toBeVisible();
  }
  await expect(modal.locator(".fa-check-circle")).toHaveCount(4, { timeout: 30_000 });

  // a dataset of each, with the same content
  let datasets: Awaited<ReturnType<typeof getDatasets>>;
  await expect
    .poll(async () => {
      datasets = await getDatasets(api, sessionId);
      return datasets.map((d) => d.name).sort();
    })
    .toEqual(Object.keys(files));
  for (const dataset of datasets) {
    expect(await getDatasetContent(api, sessionId, dataset.datasetId)).toBe(files[dataset.name]);
  }

  await modal.getByText("Close", { exact: true }).click();
  await expect(modal).toBeHidden();
  for (const dataset of datasets) {
    await expect(datasetNode(page, dataset.datasetId)).toBeVisible();
  }
});

/*
 * flow.js adds the files to its list only after it has told about each of them, so the modal shows
 * them when flow.js tells that they were submitted, before their upload starts. The creation of the
 * datasets, which the upload waits for, is held until the files are shown and one of them is
 * cancelled. The cancelled file's dataset is deleted when it has been created.
 */
test("the upload modal shows the files before their upload starts and cancels one", async ({
  page,
  api,
  sessionId,
}) => {
  const toUpload = (name: string) => [{ name, mimeType: "text/plain", buffer: Buffer.from(`${name}\n`) }];
  await openSession(page, sessionId);
  const held: Route[] = [];
  const datasetsUrl = (url: URL) => url.pathname.endsWith(`/sessions/${sessionId}/datasets`);
  await page.route(datasetsUrl, async (route) => {
    if (route.request().method() === "POST") {
      held.push(route);
    } else {
      await route.fallback();
    }
  });

  // the file that opens the modal
  await page.locator("#addFileDropdownMenuButton").click();
  let fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload file(s)" }).click();
  await (await fileChooser).setFiles(toUpload("first.txt"));

  const modal = page.getByRole("dialog");
  await expect(modal.getByRole("cell", { name: "first.txt" })).toBeVisible();

  // and one added in the open modal
  await modal.getByRole("button", { name: "Add more files" }).click();
  fileChooser = page.waitForEvent("filechooser");
  await modal.getByRole("button", { name: "Upload file(s)" }).click();
  await (await fileChooser).setFiles(toUpload("second.txt"));
  await expect(modal.getByRole("cell", { name: "second.txt" })).toBeVisible();

  await expect.poll(() => held.length).toBe(2);
  expect(await getDatasets(api, sessionId)).toEqual([]);

  await modal.getByRole("row").filter({ hasText: "second.txt" }).locator(".fa-times").click();
  await expect(modal.getByRole("cell", { name: "second.txt" })).toBeHidden();

  const deleted = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" && response.url().includes(`/sessions/${sessionId}/datasets/`),
  );
  await Promise.all(held.map((route) => route.continue()));
  await page.unroute(datasetsUrl);
  // both datasets are created, and the cancelled one deleted
  expect((await deleted).ok()).toBe(true);
  await expect(modal.locator(".fa-check-circle")).toHaveCount(1, { timeout: 30_000 });
  await expect.poll(async () => (await getDatasets(api, sessionId)).map((d) => d.name)).toEqual(["first.txt"]);
  expect(await getDatasetContent(api, sessionId, (await getDatasets(api, sessionId))[0].datasetId)).toBe("first.txt\n");
});
