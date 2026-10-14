import { randomUUID } from "node:crypto";

import { expect, test } from "./fixtures";
import {
  Api,
  createDataset,
  datasetNode,
  getDatasetContent,
  getDatasets,
  getSession,
  packageSession,
} from "./session-api";

/*
 * Importing a session file from the session list: flow.js uploads the zip to
 * a new session, and session-worker extracts it there. The file is packaged
 * from the session of the test, the same way as the app's Download session,
 * so that it's always in the format of the current session-worker.
 *
 * The app creates the imported session, so the test deletes it, by its name:
 * the session is named after the file until session-worker gives it the name
 * from the file's contents.
 */

async function deleteImportedSessions(api: Api, names: string[], originalId: string) {
  const response = await api.get("session-db", "/sessions/");
  expect(response.ok()).toBe(true);
  for (const session of await response.json()) {
    if (names.includes(session.name) && session.sessionId !== originalId) {
      const deleted = await api.delete("session-db", `/sessions/${session.sessionId}`);
      expect(deleted.ok(), `delete session: ${deleted.status()}`).toBe(true);
    }
  }
}

test("an imported session file opens as a session with the same files", async ({
  page,
  pageErrors,
  api,
  sessionId,
}) => {
  // unique, so that the cleanup finds only the session of this test
  const name = `e2e import ${randomUUID()}`;
  const fileName = `${name} downloaded`;
  const original = await getSession(api, sessionId);
  expect((await api.put("session-db", `/sessions/${sessionId}`, { ...original, name })).ok()).toBe(true);

  const files = { "a.tsv": "gene\tvalue\ng1\t1\ng2\t2\n", "b.txt": "some text\n" };
  for (const [datasetName, content] of Object.entries(files)) {
    await createDataset(api, sessionId, { name: datasetName }, content);
  }
  const zip = await packageSession(api, sessionId);

  try {
    await page.goto("/sessions");
    // flow.js opens the file chooser from its own hidden input
    const fileChooser = page.waitForEvent("filechooser");
    await page.getByText("Import session file").click();
    await (await fileChooser).setFiles({ name: `${fileName}.zip`, mimeType: "application/zip", buffer: zip });

    // with a single file, the app opens the session once it's extracted, and closes the modal
    await expect(page).toHaveURL(/\/analyze\/[0-9a-f-]+$/, { timeout: 60_000 });
    await expect(page.getByRole("dialog")).toBeHidden();
    const importedId = new URL(page.url()).pathname.split("/").pop();
    expect(importedId).not.toBe(sessionId);

    // the name of the original from the contents of the file, not the name of the file
    const session = await getSession(api, importedId);
    expect(session.name).toBe(name);
    expect(session.state).toBe("READY");

    // the files of the original, without the zip, neither the one in the original nor the uploaded one
    const datasets = await getDatasets(api, importedId);
    expect(datasets.map((d) => d.name).sort()).toEqual(Object.keys(files));
    for (const dataset of datasets) {
      expect(await getDatasetContent(api, importedId, dataset.datasetId)).toBe(files[dataset.name]);
      await expect(datasetNode(page, dataset.datasetId)).toBeVisible({ timeout: 30_000 });
    }
  } finally {
    // close the page first, the app would react to the deletion of the session it shows
    await pageErrors.settle();
    await page.close();
    await deleteImportedSessions(api, [name, fileName], sessionId);
  }
});
