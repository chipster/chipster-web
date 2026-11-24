import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { Locator, Page } from "@playwright/test";

import { expect, test, waitForDevCheck } from "./fixtures";
import {
  Api,
  createDataset,
  createSession,
  datasetNode,
  getDatasetContent,
  getApi,
  getDatasets,
  getSession,
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
  const row = sessionRow(page, name);
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
  await modal.getByRole("textbox").fill(newName);
  await modal.getByRole("button", { name: "Rename" }).click();
  await moveMouseOffList(page);
  await expect(modal).toBeHidden();
  const renamed = sessionRow(page, newName);
  await expect(renamed).toBeVisible();
  await expect.poll(async () => (await getSession(api, sessionId)).name).toBe(newName);

  await openSessionMenu(page, newName);
  await page.getByRole("button", { name: /notes…/i }).click();
  await modal.locator("textarea").fill("first line\nsecond line");
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
    await moveMouseOffList(page);
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
}

const shareTest = test.extend<{ sharedSession: SharedSession }>({
  sharedSession: async ({ page, pageErrors, api, browser, playwright, baseURL }, use) => {
    // a new connection for every request, see the api fixture
    const request = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Connection: "close" } });
    const sharer = await getApi(request, ADMIN_STATE);
    // unique, so that the rows are only this test's
    const name = `e2e share ${randomUUID()}`;
    const sharerContext = await browser.newContext({ storageState: ADMIN_STATE });
    pageErrors.watch(sharerContext);
    // last before the try, whose finally deletes it
    const sessionId = await createSession(sharer, name);

    try {
      const datasetId = await createDataset(sharer, sessionId, { name: "a.tsv", x: 100, y: 100 }, "gene\tvalue\n");
      const shared = await sharer.post("session-db", `/sessions/${sessionId}/rules`, {
        username: api.userId,
        readWrite: true,
      });
      expect(shared.ok(), `share: ${shared.status()}`).toBe(true);

      const sharerPage = await sharerContext.newPage();
      const sharerName = sharer.userId.replace(/^.*?\//, "");
      const section = (heading: string) =>
        page.locator(".session-list > div", { has: page.getByRole("heading", { name: heading }) });
      await use({
        sharer,
        name,
        sessionId,
        datasetId,
        sharerPage,
        pendingShare: sharerPage
          .locator(".row", { has: sharerPage.getByRole("heading", { name: "Sent pending shares" }) })
          .locator("tr.session-list-item", { hasText: name }),
        sharedToUser: section(`Shared to you by ${sharerName}`).locator("tr.session-list-item", { hasText: name }),
        ownSession: section("Your sessions").locator("tr.session-list-item", { hasText: name }),
      });
    } finally {
      // close the pages first, the app would react to the deletion of the session
      await pageErrors.settle();
      await page.close();
      await sharerContext.close();
      try {
        // the sharer's read-write rule deletes the session from the user too
        const deleted = await sharer.delete("session-db", `/sessions/${sessionId}`);
        expect(deleted.ok(), `delete the session: ${deleted.status()}`).toBe(true);
      } finally {
        await request.dispose();
      }
    }
  },
});

// the app logs when its WebSocket has opened, start waiting before the page is loaded
function eventsOpened(page: Page) {
  return page.waitForEvent("console", (message) => message.text().startsWith("websocket open"));
}

// the usernames of the rules of the session, as the sharer sees them
async function ruleUsernames(shared: SharedSession) {
  return (await getSession(shared.sharer, shared.sessionId)).rules.map((rule) => rule.username);
}

// both lists show the share as pending, and follow the events
async function openLists(page: Page, api: Api, shared: SharedSession) {
  const sharerEvents = eventsOpened(shared.sharerPage);
  await shared.sharerPage.goto("/sessions");
  await sharerEvents;
  await expect(shared.pendingShare).toBeVisible();
  await expect(shared.pendingShare).toContainText(api.userId);

  const userEvents = eventsOpened(page);
  await page.goto("/sessions");
  await userEvents;
  await expect(shared.sharedToUser).toBeVisible();
  await expect(shared.ownSession).toHaveCount(0);
}

shareTest(
  "a session shared by another user is accepted in the sessions list",
  async ({ page, api, sharedSession: shared }) => {
    const ruleOfUser = async () => {
      const rule = (await getSession(api, shared.sessionId)).rules.find((r) => r.username === api.userId);
      expect(rule, `the rule of ${api.userId}`).toBeDefined();
      return rule;
    };
    expect((await ruleOfUser()).sharedBy).toBe(shared.sharer.userId);
    await openLists(page, api, shared);

    await clickRowButton(page, shared.name, "Accept");
    await moveMouseOffList(page);
    await expect(shared.ownSession).toBeVisible();
    await expect(shared.sharedToUser).toHaveCount(0);
    await expect.poll(async () => (await ruleOfUser()).sharedBy ?? null).toBeNull();
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
    expect(await ruleUsernames(shared)).toContain(api.userId);

    await clickRowButton(page, shared.name, "Decline share");
    await modal.getByRole("button", { name: "Decline" }).click();
    await moveMouseOffList(page);
    await expect(modal).toBeHidden();
    await expect(shared.sharedToUser).toHaveCount(0);
    await expect(shared.ownSession).toHaveCount(0);
    await expect.poll(() => ruleUsernames(shared)).not.toContain(api.userId);
    expect((await api.get("session-db", `/sessions/${shared.sessionId}`)).status()).toBe(403);

    // only the pending share is gone from the sharer's list
    await expect(shared.pendingShare).toHaveCount(0);
    await expect(shared.sharerPage.locator("tr.session-list-item", { hasText: shared.name })).toHaveCount(1);
    await waitForDevCheck(shared.sharerPage);
    await waitForDevCheck(page);
  },
);
