import { readFileSync } from "node:fs";

import { APIRequestContext, APIResponse, expect, Page } from "@playwright/test";
import type { Dataset, Label, Session } from "chipster-js-common";
import { jwtDecode } from "jwt-decode";
import { parse } from "yaml";

import type { PageErrors } from "./fixtures";
import { USER_STATE } from "./login";

/*
 * Test data is created through the REST APIs rather than the UI, to keep the
 * tests about the part of the UI they are testing. The addresses of the
 * services come from service-locator like in the app, so that the tests work
 * in both the proxy and the direct mode of the dev environment.
 */

/*
 * Requests to one service by its role, e.g. api.get("session-db", "/sessions/"),
 * as the user that auth.setup.ts logged in.
 */
export interface Api {
  // the user id of the logged-in user, e.g. "jaas/chipster", the sub of the token like in the app
  userId: string;
  // the public address of a service, e.g. "/session-db" in the proxy mode or "http://localhost:8004"
  address(role: string): string;
  /*
   * The origins of the app and the services, for telling a request of the app
   * apart from a request to another site in both modes: in the proxy mode the
   * services are relative addresses of the app's own origin, in the direct
   * mode each has an origin of its own.
   */
  origins(baseURL: string): string[];
  get(role: string, path: string): Promise<APIResponse>;
  post(role: string, path: string, data: unknown): Promise<APIResponse>;
  put(role: string, path: string, data: unknown): Promise<APIResponse>;
  delete(role: string, path: string): Promise<APIResponse>;
}

/*
 * The token is read from the browser state that auth.setup.ts saved, so no
 * page has to be loaded for it. The request context has to have the baseURL
 * of the app, for the relative addresses of the proxy mode.
 */
export async function getApi(request: APIRequestContext, stateFile = USER_STATE): Promise<Api> {
  const state = JSON.parse(readFileSync(stateFile, "utf8"));
  const token = state.origins
    .flatMap((origin) => origin.localStorage)
    .find((entry) => entry.name === "ch-auth-token")?.value;
  expect(token, `no ch-auth-token in ${stateFile}`).toBeDefined();
  return apiWithToken(request, await getServices(request), token);
}

function basicAuth(username: string, password: string) {
  return { Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64") };
}

// the public address of each service, e.g. "/session-db" or "http://localhost:8004"
async function getServices(request: APIRequestContext): Promise<Map<string, string>> {
  /*
   * The only address the app itself knows, from its configuration. It's
   * relative in the dev environment and on k3s, but a deployment can have
   * service-locator on a host of its own.
   */
  const confResponse = await request.get("/assets/conf/chipster.yaml");
  expect(confResponse.ok()).toBe(true);
  const serviceLocator: string = parse(await confResponse.text())["service-locator"];
  const response = await request.get(serviceLocator.replace(/\/$/, "") + "/services");
  expect(response.ok()).toBe(true);
  const services = new Map<string, string>();
  for (const service of await response.json()) {
    if (service.publicUri) {
      services.set(service.role, service.publicUri.replace(/\/$/, ""));
    }
  }
  return services;
}

function apiWithToken(request: APIRequestContext, services: Map<string, string>, token: string): Api {
  const headers = basicAuth("token", token);
  const userId = jwtDecode(token).sub;

  const address = (role: string) => {
    const service = services.get(role);
    expect(service, `service-locator has no public address for ${role}`).toBeDefined();
    return service;
  };
  const send = (method: string, role: string, path: string, data?: unknown) =>
    request.fetch(address(role) + path, { method, headers, data });
  const origins = (baseURL: string) => [
    ...new Set([new URL(baseURL).origin, ...services.values()].map((uri) => new URL(uri, baseURL).origin)),
  ];
  return {
    userId,
    address,
    origins,
    get: (role, path) => send("GET", role, path),
    post: (role, path, data) => send("POST", role, path, data),
    put: (role, path, data) => send("PUT", role, path, data),
    delete: (role, path) => send("DELETE", role, path),
  };
}

// state is a SessionState of chipster-js-common, like "TEMPORARY_UNMODIFIED", the default is a normal session
export async function createSession(api: Api, name: string, state?: string): Promise<string> {
  const response = await api.post("session-db", "/sessions/", { name, state });
  expect(response.ok()).toBe(true);
  return (await response.json()).sessionId;
}

/*
 * The sessions of the user with this name. A session that the app creates, like a copy, is found
 * by its name for the checks and the cleanup, so the test gives it a unique name.
 */
export async function findSessions(api: Api, name: string): Promise<Session[]> {
  const response = await api.get("session-db", "/sessions/");
  expect(response.ok()).toBe(true);
  return ((await response.json()) as Session[]).filter((s) => s.name === name);
}

export async function getSession(api: Api, sessionId: string): Promise<Session> {
  const response = await api.get("session-db", `/sessions/${sessionId}`);
  expect(response.ok()).toBe(true);
  return response.json();
}

// renames the session through the API, e.g. to give the session of the sessionId fixture a unique name
export async function renameSession(api: Api, sessionId: string, name: string): Promise<void> {
  const response = await api.put("session-db", `/sessions/${sessionId}`, {
    ...(await getSession(api, sessionId)),
    name,
  });
  expect(response.ok(), `rename session ${response.status()}`).toBe(true);
}

export async function createDataset(
  api: Api,
  sessionId: string,
  dataset: object,
  content: string | Buffer,
): Promise<string> {
  const response = await api.post("session-db", `/sessions/${sessionId}/datasets`, dataset);
  expect(response.ok()).toBe(true);
  const datasetId = (await response.json()).datasetId;

  const size = Buffer.byteLength(content);
  const upload = await api.put(
    "file-broker",
    `/sessions/${sessionId}/datasets/${datasetId}?flowTotalSize=${size}`,
    content,
  );
  expect(upload.ok()).toBe(true);
  return datasetId;
}

export async function deleteDataset(api: Api, sessionId: string, datasetId: string): Promise<void> {
  const response = await api.delete("session-db", `/sessions/${sessionId}/datasets/${datasetId}`);
  expect(response.ok()).toBe(true);
}

export async function getDatasetContent(api: Api, sessionId: string, datasetId: string): Promise<string> {
  const response = await api.get("file-broker", `/sessions/${sessionId}/datasets/${datasetId}`);
  expect(response.ok()).toBe(true);
  return response.text();
}

export async function getDatasets(api: Api, sessionId: string): Promise<Dataset[]> {
  const response = await api.get("session-db", `/sessions/${sessionId}/datasets`);
  expect(response.ok()).toBe(true);
  return response.json();
}

/*
 * The rows of the own phenodata of a dataset on the server, split into cells.
 */
export async function getPhenodataRows(api: Api, sessionId: string, datasetId: string): Promise<string[][]> {
  const response = await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`);
  expect(response.ok(), `get dataset ${response.status()}`).toBe(true);
  const dataset: Dataset = await response.json();
  const phenodata = dataset.metadataFiles?.find((f) => f.name === "phenodata.tsv");
  if (phenodata == null) {
    throw new Error(`dataset ${datasetId} has no phenodata.tsv`);
  }
  // only the final newline, trimEnd() would take the empty cells of the last row too
  return phenodata.content
    .replace(/\n$/, "")
    .split("\n")
    .map((line) => line.split("\t"));
}

// changes some fields of the dataset, which the page learns about from the dataset event
export async function updateDataset(api: Api, sessionId: string, datasetId: string, changes: object): Promise<void> {
  const current = await api.get("session-db", `/sessions/${sessionId}/datasets/${datasetId}`);
  expect(current.ok()).toBe(true);
  const response = await api.put("session-db", `/sessions/${sessionId}/datasets/${datasetId}`, {
    ...(await current.json()),
    ...changes,
  });
  expect(response.ok(), `update dataset ${response.status()}`).toBe(true);
}

/*
 * Sets one preference of the user, e.g. setUserPreference(api, "labels", "showLabelPanel", true),
 * like PreferencesService of the app. The preferences are saved on the user, which all the tests
 * share, so a test that depends on one sets it itself rather than trusting what an earlier test
 * left there. The auth service fails an update made at the same time as another test's with a
 * 500 (see KNOWN_FAILED_REQUESTS in fixtures.ts), so it's tried again. Like the app, it writes back
 * the whole user, and the auth service takes the preferences and the latest session from it, so
 * an update that another test makes in between is lost. That's fine for the tests.
 */
export async function setUserPreference(api: Api, rootKey: string, leafKey: string, value: unknown): Promise<void> {
  const path = `/users?userId=${encodeURIComponent(api.userId)}`;
  await expect(async () => {
    const current = await api.get("auth", path);
    expect(current.ok(), `get user ${current.status()}`).toBe(true);
    const user = await current.json();
    // like the app, which takes an empty array for no preferences
    const preferences = user.preferences == null || user.preferences.length < 1 ? {} : user.preferences;
    preferences[rootKey] = { ...preferences[rootKey], [leafKey]: value };
    const response = await api.put("auth", path, { ...user, preferences });
    expect(response.ok(), `update user ${response.status()}`).toBe(true);
  }).toPass({ timeout: 10_000 });
}

export async function createLabel(api: Api, sessionId: string, name: string, color = "#ff0000"): Promise<string> {
  const response = await api.post("session-db", `/sessions/${sessionId}/labels`, { sessionId, name, color });
  expect(response.ok(), `create label ${response.status()}`).toBe(true);
  return (await response.json()).labelId;
}

export async function getLabels(api: Api, sessionId: string): Promise<Label[]> {
  const response = await api.get("session-db", `/sessions/${sessionId}/labels`);
  expect(response.ok(), `get labels ${response.status()}`).toBe(true);
  return response.json();
}

export async function renameLabel(api: Api, sessionId: string, labelId: string, name: string): Promise<void> {
  const current = await api.get("session-db", `/sessions/${sessionId}/labels/${labelId}`);
  expect(current.ok()).toBe(true);
  const response = await api.put("session-db", `/sessions/${sessionId}/labels/${labelId}`, {
    ...(await current.json()),
    name,
  });
  expect(response.ok(), `rename label ${response.status()}`).toBe(true);
}

// a job of a tool that doesn't have to exist: the tool is run nowhere, the page only shows the job
export const TEST_JOB = {
  toolId: "test.R",
  toolName: "Test tool",
  toolCategory: "Test",
  module: "misc",
  state: "RUNNING",
  parameters: [],
  inputs: [],
  outputs: [],
};

export async function createJob(api: Api, sessionId: string, job: object = TEST_JOB): Promise<string> {
  const response = await api.post("session-db", `/sessions/${sessionId}/jobs`, job);
  expect(response.ok(), `create job ${response.status()} ${await response.text()}`).toBe(true);
  return (await response.json()).jobId;
}

export async function updateJob(api: Api, sessionId: string, jobId: string, changes: object): Promise<void> {
  const current = await api.get("session-db", `/sessions/${sessionId}/jobs/${jobId}`);
  expect(current.ok()).toBe(true);
  const response = await api.put("session-db", `/sessions/${sessionId}/jobs/${jobId}`, {
    ...(await current.json()),
    ...changes,
  });
  expect(response.ok(), `update job ${response.status()}`).toBe(true);
}

/*
 * A session file like the one the app downloads: session-worker packages the
 * session to a zip, which it adds to the same session as a dataset.
 */
export async function packageSession(api: Api, sessionId: string): Promise<Buffer> {
  const response = await api.post("session-worker", `/sessions/${sessionId}`, {});
  expect(response.ok()).toBe(true);
  const { datasetId, errors } = await response.json();
  expect(errors).toEqual([]);
  const zip = await api.get("file-broker", `/sessions/${sessionId}/datasets/${datasetId}`);
  expect(zip.ok()).toBe(true);
  return zip.body();
}

// a tab of the visualizations of the selected files, like "Details" or "Scatter Plot"
export function visualizationTab(page: Page, name: string) {
  return page.locator("ch-visualizations").getByRole("tab", { name, exact: true });
}

export function datasetNode(page: Page, datasetId: string) {
  return page.locator(`#d3DatasetNodesGroup rect[id$="_${datasetId}"]`);
}

// the graph draws a selected file with the primary color as its border, other files with the color of their tool
const SELECTED_STROKE = "#006fe6";

// the ids of the files that the workflow graph shows as selected, read in one go
export async function selectedInGraph(page: Page): Promise<string[]> {
  const strokes = await page
    .locator("#d3DatasetNodesGroup rect")
    .evaluateAll((rects) => rects.map((rect): [string, string] => [rect.id, rect.getAttribute("stroke")]));
  return strokes.filter(([, stroke]) => stroke === SELECTED_STROKE).map(([id]) => id.replace(/^node_/, ""));
}

// the middle of the file in the page
export async function nodeCenter(page: Page, datasetId: string) {
  const box = await datasetNode(page, datasetId).boundingBox();
  expect(box, `file ${datasetId} has no bounding box`).not.toBeNull();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// a press at (x, y), a move by (dx, dy) pixels, and a release there: a click or a drag, depending on the distance
export async function pressMoveRelease(page: Page, { x, y }: { x: number; y: number }, dx: number, dy: number) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 2 });
  await page.mouse.up();
}

/*
 * The analyze view waits for the tool modules of toolbox, which take a few
 * seconds in the dev setup, before it draws anything. Without a dataset to
 * wait for, the session is ready when the Add file button is shown.
 */
export async function openSession(page: Page, sessionId: string, datasetId?: string) {
  await page.goto(`/analyze/${sessionId}`);
  const ready = datasetId ? datasetNode(page, datasetId) : page.locator("#addFileDropdownMenuButton");
  await expect(ready).toBeVisible({ timeout: 30_000 });
}

/*
 * Delete a file the way a user does, from the Selected Files menu. The file
 * disappears right away, but it's deleted on the server only when the undo
 * toast closes.
 */
export async function deleteDatasetFromMenu(page: Page, datasetId: string) {
  await datasetNode(page, datasetId).click();
  await page.locator("ch-selected-files").getByTitle("Actions").locator("visible=true").first().click();
  await page.locator(".dropdown-menu.show").getByText("Delete", { exact: true }).click();
  await page.locator(".modal-footer").getByRole("button", { name: "Delete" }).click();
}

/*
 * Helpers of the specs that copy files from one session to another: copying the selected files,
 * Duplicate and Merge session.
 */

// the label names of each file of the session, by file name, one array per file of that name, e.g.
// { "a.tsv": [["label-a"]] }
export async function labelsOfFiles(api: Api, sessionId: string): Promise<Record<string, (string | undefined)[][]>> {
  const labels = new Map((await getLabels(api, sessionId)).map((l) => [l.labelId, l.name]));
  const files: Record<string, (string | undefined)[][]> = {};
  for (const dataset of await getDatasets(api, sessionId)) {
    // a label id that the session doesn't have shows as undefined, so that a broken copy fails the check
    const names = (dataset.labelIds ?? []).map((id) => labels.get(id)).sort();
    (files[dataset.name] ??= []).push(names);
  }
  return files;
}

// the labels of the session, without the ids and times
export async function labelNamesAndColors(api: Api, sessionId: string) {
  return (await getLabels(api, sessionId))
    .map(({ name, color }) => ({ name, color }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface TestJob {
  jobId: string;
  toolName: string;
  outputs: { outputId: string; datasetId: string }[];
}

export async function getJobs(api: Api, sessionId: string): Promise<TestJob[]> {
  const response = await api.get("session-db", `/sessions/${sessionId}/jobs`);
  expect(response.ok()).toBe(true);
  return response.json();
}

// the tool name of the job of each file in the session, one per file of that name, null for a file without one
export async function jobsOfFiles(api: Api, sessionId: string): Promise<Record<string, (string | null | undefined)[]>> {
  const jobs = new Map((await getJobs(api, sessionId)).map((j) => [j.jobId, j]));
  const files: Record<string, (string | null | undefined)[]> = {};
  for (const dataset of await getDatasets(api, sessionId)) {
    // a job id that the session doesn't have shows as undefined
    const toolName = dataset.sourceJob == null ? null : jobs.get(dataset.sourceJob)?.toolName;
    (files[dataset.name] ??= []).push(toolName);
  }
  return files;
}

/*
 * Three files made by jobs: the job of made.txt is in the session, the one of orphan.txt has
 * been deleted, e.g. through the API, and the one of running.txt is still running, which a copy
 * leaves out too. A copy takes the completed job, and leaves the other two files without one,
 * like uploaded files. orphan.txt has the label labelId, and made.txt and orphan.txt share the
 * label sharedLabelId, if it's given.
 */
export async function createFilesWithJobs(api: Api, sessionId: string, labelId: string, sharedLabelId?: string) {
  const shared = sharedLabelId == null ? [] : [sharedLabelId];
  const job = { ...TEST_JOB, toolName: "Kept tool", state: "COMPLETED" };
  const keptJob = await createJob(api, sessionId, job);
  const madeId = await createDataset(
    api,
    sessionId,
    { name: "made.txt", x: 100, y: 100, sourceJob: keptJob, labelIds: shared },
    "m\n",
  );
  const goneJob = await createJob(api, sessionId, { ...job, toolName: "Gone tool" });
  const orphanId = await createDataset(
    api,
    sessionId,
    { name: "orphan.txt", x: 300, y: 100, sourceJob: goneJob, labelIds: [labelId, ...shared] },
    "o\n",
  );
  const deleted = await api.delete("session-db", `/sessions/${sessionId}/jobs/${goneJob}`);
  expect(deleted.ok(), `delete job: ${deleted.status()}`).toBe(true);
  // TEST_JOB is RUNNING, and the tool is run nowhere
  const runningJob = await createJob(api, sessionId, { ...TEST_JOB, toolName: "Running tool" });
  const runningId = await createDataset(
    api,
    sessionId,
    { name: "running.txt", x: 500, y: 100, sourceJob: runningJob },
    "r\n",
  );
  return { madeId, orphanId, runningId };
}

/*
 * The source session of the Duplicate and Merge tests: the files of createFilesWithJobs() with two
 * labels, label-a on orphan.txt, and label-b on made.txt and orphan.txt. The checks of a copy of
 * it, and of the source after the copy, are below.
 */
export async function createLabelledFilesWithJobs(api: Api, sessionId: string) {
  const labelA = await createLabel(api, sessionId, "label-a", "#ff0000");
  const labelB = await createLabel(api, sessionId, "label-b", "#00ff00");
  return createFilesWithJobs(api, sessionId, labelA, labelB);
}

export const COPIED_LABELS = [
  { name: "label-a", color: "#ff0000" },
  { name: "label-b", color: "#00ff00" },
];
export const COPIED_LABELS_OF_FILES = {
  "made.txt": [["label-b"]],
  "orphan.txt": [["label-a", "label-b"]],
  "running.txt": [[]],
};
// the completed job is copied, the other two files have no job
export const COPIED_JOBS_OF_FILES = { "made.txt": ["Kept tool"], "orphan.txt": [null], "running.txt": [null] };
// the source still refers to the deleted job, which shows as undefined
export const SOURCE_JOBS_OF_FILES = {
  "made.txt": ["Kept tool"],
  "orphan.txt": [undefined],
  "running.txt": ["Running tool"],
};

/*
 * The session list modal of Copy to existing session and Merge session: picks the session by its
 * name, which has to be unique, because the tests run in parallel as the same user and the list
 * has the sessions of all of them, and then clicks the button.
 */
export async function pickSession(page: Page, title: string, sessionName: string, button: string) {
  const modal = page.getByRole("dialog");
  await expect(modal).toContainText(title);
  await modal.locator("#value").click();
  await modal.getByRole("button", { name: sessionName, exact: true }).click();
  await modal.getByRole("button", { name: button, exact: true }).click();
}

// a copied file shows its label in the details, in the session that the app opened after the copy
export async function expectLabelShown(page: Page, sessionId: string, datasetId: string, label: string) {
  await expect(page).toHaveURL(new RegExp(`/analyze/${sessionId}$`), { timeout: 30_000 });
  await expect(datasetNode(page, datasetId)).toBeVisible({ timeout: 30_000 });
  await datasetNode(page, datasetId).click();
  await visualizationTab(page, "Details").click();
  await expect(page.locator("ch-single-dataset ch-label-pill").filter({ hasText: label })).toHaveCount(1);
}

/*
 * Close the page first, the app would react to the deletion of the session it shows. The sessions
 * are looked up only after that: if the test failed during a copy, the app may still have been
 * creating the copy.
 */
export async function deleteSessions(
  page: Page,
  pageErrors: PageErrors,
  api: Api,
  sessionIds: () => Promise<string[]>,
) {
  await pageErrors.settle();
  await page.close();
  for (const sessionId of await sessionIds()) {
    const deleted = await api.delete("session-db", `/sessions/${sessionId}`);
    expect(deleted.ok(), `delete session: ${deleted.status()}`).toBe(true);
  }
}
