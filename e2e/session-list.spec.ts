import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { Page } from "@playwright/test";

import { expect, test, waitForDevCheck } from "./fixtures";
import { Api, createDataset, getDatasetContent, getDatasets, getSession } from "./session-api";
import { readZip } from "./zip";

/*
 * The sessions list: the actions of a session's row, i.e. the modals of its
 * menu and its delete button.
 */

function sessionRow(page: Page, name: string) {
  return page.locator("tr.session-list-item", { hasText: name });
}

/*
 * The buttons of a row are shown only while the mouse is on it. The tests run
 * in parallel as the same user, so the rows of the other tests' sessions come
 * and go in the same list, and a row can move away from under the mouse, which
 * hides its buttons again. Then the button is hovered again and clicked.
 */
async function clickRowButton(page: Page, name: string, title: string) {
  const row = sessionRow(page, name);
  await expect(async () => {
    await row.hover();
    await row.getByTitle(title, { exact: true }).click({ timeout: 2_000 });
  }).toPass();
}

async function openSessionMenu(page: Page, name: string) {
  await clickRowButton(page, name, "Actions");
}

test("a session is renamed and its notes edited in the sessions list", async ({ page, api, sessionId }, testInfo) => {
  // with the title, so that a session left behind by an interrupted run doesn't match
  const name = `e2e ${testInfo.title}`;
  const newName = `${name} (renamed)`;

  await page.goto("/sessions");
  await openSessionMenu(page, name);
  await page.getByRole("button", { name: "Rename…" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("textbox").fill(newName);
  await modal.getByRole("button", { name: "Rename" }).click();
  await expect(modal).toBeHidden();
  const renamed = sessionRow(page, newName);
  await expect(renamed).toBeVisible();
  await expect.poll(async () => (await getSession(api, sessionId)).name).toBe(newName);

  await openSessionMenu(page, newName);
  await page.getByRole("button", { name: /notes…/i }).click();
  await modal.locator("textarea").fill("first line\nsecond line");
  await modal.getByRole("button", { name: "Save" }).click();
  await expect(modal).toBeHidden();
  // the preview of the hovered session shows the notes, and is closed when the row moves away from the mouse
  await expect(async () => {
    await renamed.hover();
    await expect(page.getByText("second line")).toBeVisible({ timeout: 2_000 });
  }).toPass();
  await expect.poll(async () => (await getSession(api, sessionId)).notes).toBe("first line\nsecond line");
  await waitForDevCheck(page);
});

test.describe(() => {
  test.use({ sessionDeletedByTest: true });

  test("a session is deleted in the sessions list after a confirmation", async ({ page, api, sessionId }, testInfo) => {
    const name = `e2e ${testInfo.title}`;
    const sessionStatus = async () => (await api.get("session-db", `/sessions/${sessionId}`)).status();

    await page.goto("/sessions");
    const row = sessionRow(page, name);
    const modal = page.getByRole("dialog");

    // cancel keeps the session
    await clickRowButton(page, name, "Delete");
    await expect(modal).toContainText(`Delete session ${name}?`);
    await modal.getByRole("button", { name: "Cancel" }).click();
    await expect(modal).toBeHidden();
    await expect(row).toBeVisible();
    expect(await sessionStatus()).toBe(200);

    await clickRowButton(page, name, "Delete");
    await modal.getByRole("button", { name: "Delete" }).click();
    await expect(modal).toBeHidden();
    await expect(row).toHaveCount(0);
    // the app deletes the user's rule, and session-db deletes a session that has no rules left
    await expect.poll(sessionStatus).toBe(404);
    await waitForDevCheck(page);
  });
});

/*
 * The app creates the copy, so the test deletes it, by its name. The name is
 * unique, so that the cleanup finds only the copy of this test.
 */
async function findSessions(api: Api, name: string) {
  const response = await api.get("session-db", "/sessions/");
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { sessionId: string; name: string; state: string }[]).filter(
    (s) => s.name === name,
  );
}

test("a session is duplicated with its files in the sessions list", async ({
  page,
  pageErrors,
  api,
  sessionId,
}, testInfo) => {
  const name = `e2e ${testInfo.title}`;
  // not starting with the name of the original, so that the row of the original matches only the original
  const copyName = `e2e copy ${randomUUID()}`;
  const files = { "a.tsv": "gene\tvalue\ng1\t1\ng2\t2\n", "b.txt": "some text\n" };
  for (const [datasetName, content] of Object.entries(files)) {
    await createDataset(api, sessionId, { name: datasetName }, content);
  }

  try {
    await page.goto("/sessions");
    await openSessionMenu(page, name);
    await page.getByRole("button", { name: "Duplicate…" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("textbox")).toHaveValue(`${name}_copy`);
    await modal.getByRole("textbox").fill(copyName);
    await modal.getByRole("button", { name: "Duplicate" }).click();
    /*
     * The copy is created in the IMPORT state and listed right away, and the
     * spinner modal opens only after the name modal has closed, so neither the
     * row nor a hidden modal means that the files are copied. The app sets the
     * copy READY last, after its files.
     */
    await expect
      .poll(async () => (await findSessions(api, copyName)).map((s) => s.state), { timeout: 30_000 })
      .toEqual(["READY"]);
    // the spinner closes once the copy is done
    await expect(modal).toHaveCount(0);
    await expect(sessionRow(page, copyName)).toBeVisible();

    const copyId = (await findSessions(api, copyName))[0].sessionId;
    expect(copyId).not.toBe(sessionId);
    const datasets = await getDatasets(api, copyId);
    expect(datasets.map((d) => d.name).sort()).toEqual(Object.keys(files));
    for (const dataset of datasets) {
      expect(await getDatasetContent(api, copyId, dataset.datasetId)).toBe(files[dataset.name]);
    }
    // the original is unchanged
    expect((await getSession(api, sessionId)).name).toBe(name);
    expect(await getDatasets(api, sessionId)).toHaveLength(2);
    await waitForDevCheck(page);
  } finally {
    // close the page first, the app would react to the deletion of the session it lists
    await pageErrors.settle();
    await page.close();
    for (const copy of await findSessions(api, copyName)) {
      const deleted = await api.delete("session-db", `/sessions/${copy.sessionId}`);
      expect(deleted.ok(), `delete session: ${deleted.status()}`).toBe(true);
    }
  }
});

test("a session is downloaded as a session file in the sessions list", async ({ page, api, sessionId }, testInfo) => {
  const name = `e2e ${testInfo.title}`;
  const content = "gene\tvalue\ng1\t1\ng2\t2\n";
  const datasetId = await createDataset(api, sessionId, { name: "a.tsv" }, content);

  await page.goto("/sessions");
  await openSessionMenu(page, name);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadEvent;

  expect(download.suggestedFilename()).toBe(`${name}.zip`);
  const zip = readZip(await readFile(await download.path()));
  const paths = [...zip.keys()];
  // the session and its file, in a directory of the session's name
  const sessionJson = paths.find((p) => p.endsWith("/session.json"));
  expect(sessionJson, `session.json in ${paths}`).toBeDefined();
  expect(sessionJson.startsWith(`${name}/`)).toBe(true);
  expect(JSON.parse(zip.get(sessionJson).toString("utf8")).name).toBe(name);
  const file = paths.find((p) => p.endsWith(`/${datasetId}`));
  expect(file, `${datasetId} in ${paths}`).toBeDefined();
  expect(zip.get(file).toString("utf8")).toBe(content);
  await waitForDevCheck(page);
});
