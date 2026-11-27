import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { BrowserContext, Locator, Page } from "@playwright/test";

import { expect, fillWhenRendered, test, waitForDevCheck } from "./fixtures";
import {
  Api,
  COPIED_JOBS_OF_FILES,
  COPIED_LABELS,
  COPIED_LABELS_OF_FILES,
  createDataset,
  createLabelledFilesWithJobs,
  createSession,
  datasetNode,
  deleteSessions,
  findSessions,
  getDatasetContent,
  getApi,
  getDatasets,
  getSession,
  jobsOfFiles,
  labelNamesAndColors,
  labelsOfFiles,
  renameSession,
  SOURCE_JOBS_OF_FILES,
} from "./session-api";
import { ADMIN_STATE, EXAMPLE_OWNER_STATE } from "./login";
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
  await clickButtonOfRow(sessionRow(page, name), title);
}

async function clickButtonOfRow(row: Locator, title: string) {
  await expect(async () => {
    await row.hover();
    await row.getByTitle(title, { exact: true }).click({ timeout: 2_000 });
  }).toPass();
}

/*
 * In the default mode of the list, the session under the mouse is selected and
 * its preview loaded after a while. A click on a modal or the menu leaves the
 * mouse over the list, where the rows of the other tests' sessions move, and
 * the preview of one that its test is deleting fails with an error. Move the
 * mouse off the list right after such clicks.
 */
async function moveMouseOffList(page: Page) {
  await page.mouse.move(0, 0);
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
  await fillWhenRendered(modal.getByRole("textbox"), newName);
  await modal.getByRole("button", { name: "Rename" }).click();
  await moveMouseOffList(page);
  await expect(modal).toBeHidden();
  const renamed = sessionRow(page, newName);
  await expect(renamed).toBeVisible();
  await expect.poll(async () => (await getSession(api, sessionId)).name).toBe(newName);

  await openSessionMenu(page, newName);
  await page.getByRole("button", { name: /notes…/i }).click();
  await fillWhenRendered(modal.locator("textarea"), "first line\nsecond line");
  await modal.getByRole("button", { name: "Save" }).click();
  await moveMouseOffList(page);
  await expect(modal).toBeHidden();
  // the preview of the hovered session shows the notes, and is closed when the row moves away from the mouse
  await expect(async () => {
    await renamed.hover();
    await expect(page.getByText("second line")).toBeVisible({ timeout: 2_000 });
  }).toPass();
  await moveMouseOffList(page);
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
    await moveMouseOffList(page);
    await expect(modal).toBeHidden();
    await expect(row).toBeVisible();
    expect(await sessionStatus()).toBe(200);

    await clickRowButton(page, name, "Delete");
    await modal.getByRole("button", { name: "Delete" }).click();
    await moveMouseOffList(page);
    await expect(modal).toBeHidden();
    await expect(row).toHaveCount(0);
    // the app deletes the user's rule, and session-db deletes a session that has no rules left
    await expect.poll(sessionStatus).toBe(404);
    await waitForDevCheck(page);
  });
});

/*
 * The copy gets the files with their contents and labels, and the labels once each. A file made by
 * a completed job refers to the copy of the job. A file whose job was deleted or is still running
 * has no job, like an uploaded file, because the copy doesn't have that job.
 */
test("a session is duplicated with its files, labels and jobs in the sessions list", async ({
  page,
  pageErrors,
  api,
  sessionId,
}) => {
  /*
   * Unique, so that the row matches only this session when the test runs more than once at a
   * time. The copy's name doesn't start with it, so the row of the original matches only the
   * original.
   */
  const name = `e2e duplicate source ${randomUUID()}`;
  const copyName = `e2e copy ${randomUUID()}`;
  await renameSession(api, sessionId, name);
  await createLabelledFilesWithJobs(api, sessionId);
  const originals = await getDatasets(api, sessionId);

  try {
    await page.goto("/sessions");
    await openSessionMenu(page, name);
    await page.getByRole("button", { name: "Duplicate…" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("textbox")).toHaveValue(`${name}_copy`);
    await fillWhenRendered(modal.getByRole("textbox"), copyName);
    await modal.getByRole("button", { name: "Duplicate" }).click();
    await moveMouseOffList(page);
    /*
     * The copy is created in the IMPORT state and listed right away, and the
     * spinner modal opens only after the name modal has closed, so neither the
     * row nor a hidden modal means that the files are copied. The app sets the
     * copy READY last, after its files, jobs and labels.
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
    expect(datasets.map((d) => d.name).sort()).toEqual(originals.map((d) => d.name).sort());
    for (const dataset of datasets) {
      const original = originals.find((d) => d.name === dataset.name);
      expect(await getDatasetContent(api, copyId, dataset.datasetId)).toBe(
        await getDatasetContent(api, sessionId, original.datasetId),
      );
    }
    expect(await labelNamesAndColors(api, copyId)).toEqual(COPIED_LABELS);
    expect(await labelsOfFiles(api, copyId)).toEqual(COPIED_LABELS_OF_FILES);
    expect(await jobsOfFiles(api, copyId)).toEqual(COPIED_JOBS_OF_FILES);

    // the original is unchanged
    expect((await getSession(api, sessionId)).name).toBe(name);
    expect(await labelNamesAndColors(api, sessionId)).toEqual(COPIED_LABELS);
    expect(await labelsOfFiles(api, sessionId)).toEqual(COPIED_LABELS_OF_FILES);
    expect(await jobsOfFiles(api, sessionId)).toEqual(SOURCE_JOBS_OF_FILES);
    await waitForDevCheck(page);
  } finally {
    await deleteSessions(page, pageErrors, api, async () =>
      (await findSessions(api, copyName)).map((s) => s.sessionId),
    );
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
  await moveMouseOffList(page);
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

/*
 * An example session is a session that example_session_owner shares to
 * everyone. The user can only read it, so the app opens a temporary copy of
 * it, and deletes the copy when the user leaves it without changes. The test
 * creates the example session itself, and keeps it only for a moment,
 * because it is listed in the sessions list of all the tests.
 */
test("an example session opens as a temporary copy in the sessions list", async ({
  page,
  pageErrors,
  api,
  playwright,
  baseURL,
}) => {
  // a new connection for every request, see the api fixture
  const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Connection: "close" } });
  const owner = await getApi(request, EXAMPLE_OWNER_STATE);
  // unique, so that the row and the cleanup find only the sessions of this test
  const name = `e2e example ${randomUUID()}`;
  const content = "gene\tvalue\ng1\t1\ng2\t2\n";
  const exampleId = await createSession(owner, name);

  try {
    await createDataset(owner, exampleId, { name: "a.tsv", x: 100, y: 100 }, content);
    const shared = await owner.post("session-db", `/sessions/${exampleId}/rules`, {
      username: "everyone",
      readWrite: false,
    });
    expect(shared.ok(), `share to everyone: ${shared.status()}`).toBe(true);
    const { state } = await getSession(owner, exampleId);

    await page.goto("/sessions");
    const examples = page.locator(".session-list > div", {
      has: page.getByRole("heading", { name: "Example sessions" }),
    });
    await examples.locator("tr.session-list-item", { hasText: name }).click();
    await moveMouseOffList(page);

    await page.waitForURL((url) => url.pathname.startsWith("/analyze/") && !url.pathname.endsWith(exampleId), {
      timeout: 30_000,
    });
    const copyId = new URL(page.url()).pathname.split("/").pop();
    const datasets = await getDatasets(api, copyId);
    expect(datasets.map((d) => d.name)).toEqual(["a.tsv"]);
    await expect(datasetNode(page, datasets[0].datasetId)).toBeVisible({ timeout: 30_000 });
    // still unmodified after the view has opened it, also the labels that a session without them gets
    expect(await getSession(api, copyId)).toMatchObject({ name, state: "TEMPORARY_UNMODIFIED" });
    const labels = await api.get("session-db", `/sessions/${copyId}/labels`);
    expect(labels.ok(), `get labels: ${labels.status()}`).toBe(true);
    expect(((await labels.json()) as { name: string }[]).map((l) => l.name).sort()).toEqual([
      "Label 1",
      "Label 2",
      "Label 3",
      "Label 4",
    ]);
    expect(await getDatasetContent(api, copyId, datasets[0].datasetId)).toBe(content);
    // the example session is unchanged
    expect(await getSession(owner, exampleId)).toMatchObject({ name, state });
    expect(await getDatasets(owner, exampleId)).toHaveLength(1);

    // leaving the copy without changes deletes it
    await page.locator("#navbar").getByRole("link", { name: "Sessions" }).click();
    await expect(page).toHaveURL(/\/sessions$/);
    await expect.poll(async () => (await api.get("session-db", `/sessions/${copyId}`)).status()).toBe(404);
    await waitForDevCheck(page);
  } finally {
    // close the page first, the app would react to the deletion of the sessions it lists
    await pageErrors.settle();
    await page.close();
    try {
      // first and whatever happens to the copy, because all the users see it
      const deleted = await owner.delete("session-db", `/sessions/${exampleId}`);
      expect(deleted.ok(), `delete the example session: ${deleted.status()}`).toBe(true);
      // gone also from the users that it was shared to, the rule for everyone doesn't keep it
      expect((await api.get("session-db", `/sessions/${exampleId}`)).status()).toBe(404);
    } finally {
      try {
        /*
         * The app has deleted the copy, unless the test failed before leaving
         * it. By the name, because the test may have failed before it knew the
         * id of the copy.
         */
        for (const copy of await findSessions(api, name)) {
          if (copy.sessionId !== exampleId) {
            const deleted = await api.delete("session-db", `/sessions/${copy.sessionId}`);
            expect([200, 204, 404], `delete the copy: ${deleted.status()}`).toContain(deleted.status());
          }
        }
      } finally {
        await request.dispose();
      }
    }
  }
});

/*
 * A session that another user shares to the user is listed under "Shared to
 * you by <sharer>" until the user accepts or declines it, and the sharer lists
 * it under "Sent pending shares" until then. Both lists follow the rule events
 * of the answer. The sharer is the admin, because the shares of
 * example_session_owner are example sessions, which have nothing to accept.
 *
 * A list connects to its events only after it has loaded and shown its rows,
 * and an event that comes before that is missed. So the share is made before
 * the lists are opened, and the test waits for each list's WebSocket to open
 * before it changes anything that the list has to follow.
 * All the tests run as the same user, so the lists of the other tests show the
 * shared session for a moment too.
 */
interface SharedSession {
  sharer: Api;
  name: string;
  sessionId: string;
  datasetId: string;
  sharerPage: Page;
  // the share in the sharer's "Sent pending shares"
  pendingShare: Locator;
  // the session in the user's "Shared to you by <sharer>", and in "Your sessions"
  sharedToUser: Locator;
  ownSession: Locator;
  // the session in the sharer's "Your sessions"
  sharerOwnSession: Locator;
}

const shareTest = test.extend<{ sharedSession: SharedSession; shareReadWrite: boolean; sharerLeaves: boolean }>({
  // a read-only share with test.use({ shareReadWrite: false })
  shareReadWrite: [true, { option: true }],

  /*
   * The sharer deletes the session in the list, which deletes only the
   * sharer's rule, so the user deletes the session after the test. Otherwise
   * the sharer has to be able to delete it.
   */
  sharerLeaves: [false, { option: true }],

  /*
   * The session of the share, deleted after the test. A test that deletes the
   * session itself sets sessionDeletedByTest, like for the sessionId fixture.
   */
  sharedSession: async (
    { page, pageErrors, api, browser, playwright, baseURL, shareReadWrite, sharerLeaves, sessionDeletedByTest },
    use,
  ) => {
    // the share and what the tests see of it, between the setup and the cleanup below
    let shared = false;
    async function useSharedSession(sharer: Api, sessionId: string, name: string) {
      const datasetId = await createDataset(sharer, sessionId, { name: "a.tsv", x: 100, y: 100 }, "gene\tvalue\n");
      const share = await sharer.post("session-db", `/sessions/${sessionId}/rules`, {
        username: api.userId,
        readWrite: shareReadWrite,
      });
      expect(share.ok(), `share: ${share.status()}`).toBe(true);
      shared = true;

      const sharerPage = await sharerContext.newPage();
      const sharerName = sharer.userId.replace(/^.*?\//, "");
      const section = (p: Page, heading: string) =>
        p.locator(".session-list > div", { has: p.getByRole("heading", { name: heading }) });
      await use({
        sharer,
        name,
        sessionId,
        datasetId,
        sharerPage,
        pendingShare: sharerPage
          .locator(".row", { has: sharerPage.getByRole("heading", { name: "Sent pending shares" }) })
          .locator("tr.session-list-item", { hasText: name }),
        sharedToUser: section(page, `Shared to you by ${sharerName}`).locator("tr.session-list-item", {
          hasText: name,
        }),
        ownSession: section(page, "Your sessions").locator("tr.session-list-item", { hasText: name }),
        sharerOwnSession: section(sharerPage, "Your sessions").locator("tr.session-list-item", { hasText: name }),
      });
    }

    // a new connection for every request, see the api fixture
    const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Connection: "close" } });
    let sharerContext: BrowserContext | undefined;
    try {
      const sharer = await getApi(request, ADMIN_STATE);
      sharerContext = await browser.newContext({ storageState: ADMIN_STATE });
      pageErrors.watch(sharerContext);
      // unique, so that the rows are only this test's
      const name = `e2e share ${randomUUID()}`;
      const sessionId = await createSession(sharer, name);
      try {
        await useSharedSession(sharer, sessionId, name);
      } finally {
        try {
          // close the pages first, the app would react to the deletion of the session
          await pageErrors.settle();
          await page.close();
          await sharerContext.close();
        } finally {
          // a read-write rule deletes the session from everyone, the user has one only after the share
          const deleted = await (sharerLeaves && shared ? api : sharer).delete("session-db", `/sessions/${sessionId}`);
          if (sessionDeletedByTest) {
            expect(deleted.status(), "delete the session").toBe(404);
          } else {
            expect(deleted.ok(), `delete the session: ${deleted.status()}`).toBe(true);
          }
        }
      }
    } finally {
      // closed above unless the setup failed, closing again does nothing
      await sharerContext?.close();
      await request.dispose();
    }
  },
});

/*
 * Open the sessions list and wait until it follows its events: the app logs
 * when its WebSocket has opened (WebSocketService). The wait starts with the
 * page load, and Promise.all keeps a failed load from leaving it unhandled.
 */
async function openListWithEvents(page: Page) {
  await Promise.all([
    page.waitForEvent("console", (message) => message.text().startsWith("websocket open")),
    page.goto("/sessions"),
  ]);
}

// the usernames of the rules of the session, as this user sees them
async function ruleUsernames(viewer: Api, shared: SharedSession) {
  return (await getSession(viewer, shared.sessionId)).rules.map((rule) => rule.username);
}

// the user's rule of the session, as the user sees it
async function ruleOfUser(api: Api, shared: SharedSession) {
  const rule = (await getSession(api, shared.sessionId)).rules.find((r) => r.username === api.userId);
  expect(rule, `the rule of ${api.userId}`).toBeDefined();
  return rule;
}

// both lists show the share as pending, and follow the events
async function openLists(page: Page, api: Api, shared: SharedSession) {
  await openListWithEvents(shared.sharerPage);
  await expect(shared.pendingShare).toBeVisible();
  await expect(shared.pendingShare).toContainText(api.userId);

  await openListWithEvents(page);
  await expect(shared.sharedToUser).toBeVisible();
  await expect(shared.ownSession).toHaveCount(0);
}

shareTest(
  "a session shared by another user is accepted in the sessions list",
  async ({ page, api, sharedSession: shared }) => {
    expect((await ruleOfUser(api, shared)).sharedBy).toBe(shared.sharer.userId);
    await openLists(page, api, shared);

    await clickRowButton(page, shared.name, "Accept");
    await moveMouseOffList(page);
    await expect(shared.ownSession).toBeVisible();
    await expect(shared.sharedToUser).toHaveCount(0);
    await expect.poll(async () => (await ruleOfUser(api, shared)).sharedBy ?? null).toBeNull();
    // only the pending share is gone from the sharer's list
    await expect(shared.pendingShare).toHaveCount(0);
    await expect(shared.sharerPage.locator("tr.session-list-item", { hasText: shared.name })).toHaveCount(1);
    await waitForDevCheck(shared.sharerPage);

    // the accepted session opens like the user's own
    await shared.ownSession.click();
    await page.waitForURL(`**/analyze/${shared.sessionId}`, { timeout: 30_000 });
    await expect(datasetNode(page, shared.datasetId)).toBeVisible({ timeout: 30_000 });
    await waitForDevCheck(page);
  },
);

/*
 * Declining deletes only the user's rule: the session stays with the sharer,
 * and is gone from the sharer's pending shares.
 */
shareTest(
  "a session shared by another user is declined in the sessions list",
  async ({ page, api, sharedSession: shared }) => {
    await openLists(page, api, shared);
    const modal = page.getByRole("dialog");

    // cancel keeps the share
    await clickRowButton(page, shared.name, "Decline share");
    await expect(modal).toContainText(`Decline the session '${shared.name}' shared by ${shared.sharer.userId}?`);
    await modal.getByRole("button", { name: "Cancel" }).click();
    await moveMouseOffList(page);
    await expect(modal).toBeHidden();
    await expect(shared.sharedToUser).toBeVisible();
    expect(await ruleUsernames(shared.sharer, shared)).toContain(api.userId);

    await clickRowButton(page, shared.name, "Decline share");
    await modal.getByRole("button", { name: "Decline" }).click();
    await moveMouseOffList(page);
    await expect(modal).toBeHidden();
    await expect(shared.sharedToUser).toHaveCount(0);
    await expect(shared.ownSession).toHaveCount(0);
    await expect.poll(() => ruleUsernames(shared.sharer, shared)).not.toContain(api.userId);
    expect((await api.get("session-db", `/sessions/${shared.sessionId}`)).status()).toBe(403);

    // only the pending share is gone from the sharer's list
    await expect(shared.pendingShare).toHaveCount(0);
    await expect(shared.sharerPage.locator("tr.session-list-item", { hasText: shared.name })).toHaveCount(1);
    await waitForDevCheck(shared.sharerPage);
    await waitForDevCheck(page);
  },
);

/*
 * The user can open a share before answering it: session-db gives the access
 * by the rule, whether the share is accepted or not. Opening doesn't accept
 * it, the share stays pending in both lists.
 */
shareTest(
  "a session shared by another user opens before it is accepted",
  async ({ page, api, sharedSession: shared }) => {
    await openLists(page, api, shared);

    await shared.sharedToUser.click();
    await page.waitForURL(`**/analyze/${shared.sessionId}`, { timeout: 30_000 });
    await expect(datasetNode(page, shared.datasetId)).toBeVisible({ timeout: 30_000 });

    await page.locator("#navbar").getByRole("link", { name: "Sessions" }).click();
    await expect(page).toHaveURL(/\/sessions$/);
    await expect(shared.sharedToUser).toBeVisible();
    await expect(shared.ownSession).toHaveCount(0);
    expect((await ruleOfUser(api, shared)).sharedBy).toBe(shared.sharer.userId);
    await expect(shared.pendingShare).toBeVisible();
    await waitForDevCheck(page);
  },
);

/*
 * Deleting a session in the list deletes only the user's own rule, so a
 * session that the sharer deletes after the user has accepted it stays with
 * the user.
 */
shareTest.describe(() => {
  shareTest.use({ sharerLeaves: true });

  shareTest(
    "an accepted session stays with the user when the sharer deletes it",
    async ({ page, api, sharedSession: shared }) => {
      await openLists(page, api, shared);
      await clickRowButton(page, shared.name, "Accept");
      await moveMouseOffList(page);
      await expect(shared.ownSession).toBeVisible();
      await expect(shared.pendingShare).toHaveCount(0);

      await clickButtonOfRow(shared.sharerOwnSession, "Delete");
      const modal = shared.sharerPage.getByRole("dialog");
      await expect(modal).toContainText(`Delete session ${shared.name}?`);
      await modal.getByRole("button", { name: "Delete" }).click();
      await moveMouseOffList(shared.sharerPage);
      await expect(modal).toBeHidden();
      await expect(shared.sharerOwnSession).toHaveCount(0);
      await expect.poll(() => ruleUsernames(api, shared)).toEqual([api.userId]);
      expect((await shared.sharer.get("session-db", `/sessions/${shared.sessionId}`)).status()).toBe(403);
      await waitForDevCheck(shared.sharerPage);

      // the user's list has followed the event of the sharer's rule, and the session still opens
      await expect(shared.ownSession).toBeVisible();
      await shared.ownSession.click();
      await page.waitForURL(`**/analyze/${shared.sessionId}`, { timeout: 30_000 });
      await expect(datasetNode(page, shared.datasetId)).toBeVisible({ timeout: 30_000 });
      await waitForDevCheck(page);
    },
  );
});

/*
 * session-db keeps a session only while it has a read-write rule left, pending
 * or not. So when the sharer deletes a session whose only other rule is a
 * pending read-only share, the session is deleted, and the share with it.
 */
shareTest.describe(() => {
  shareTest.use({ shareReadWrite: false, sessionDeletedByTest: true });

  shareTest(
    "a pending read-only share is gone when the sharer deletes the session",
    async ({ page, api, sharedSession: shared }) => {
      await openLists(page, api, shared);
      expect((await ruleOfUser(api, shared)).readWrite).toBe(false);

      await clickButtonOfRow(shared.sharerOwnSession, "Delete");
      const modal = shared.sharerPage.getByRole("dialog");
      await expect(modal).toContainText(`Delete session ${shared.name}?`);
      await modal.getByRole("button", { name: "Delete" }).click();
      await moveMouseOffList(shared.sharerPage);
      await expect(modal).toBeHidden();
      await expect(shared.sharerOwnSession).toHaveCount(0);
      await expect(shared.pendingShare).toHaveCount(0);
      await expect.poll(async () => (await api.get("session-db", `/sessions/${shared.sessionId}`)).status()).toBe(404);

      // the user's list has followed the event of the user's rule
      await expect(shared.sharedToUser).toHaveCount(0);
      await expect(shared.ownSession).toHaveCount(0);
      await waitForDevCheck(page);

      // and the share is gone from the sharer's list for good, not only until a reload
      await shared.sharerPage.reload();
      await expect(shared.sharerPage.getByRole("heading", { name: "Your sessions" })).toBeVisible();
      await expect(shared.pendingShare).toHaveCount(0);
      await expect(shared.sharerOwnSession).toHaveCount(0);
      await waitForDevCheck(shared.sharerPage);
    },
  );
});
