import { readFileSync } from "node:fs";

import { APIRequestContext, APIResponse, expect, Page } from "@playwright/test";
import type { Session } from "chipster-js-common";
import { parse } from "yaml";

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
  // the public address of a service, e.g. "/session-db" in the proxy mode or "http://localhost:8004"
  address(role: string): string;
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
  const headers = { Authorization: "Basic " + Buffer.from("token:" + token).toString("base64") };

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
  // the public address of each service, e.g. "/session-db" or "http://localhost:8004"
  const services = new Map<string, string>();
  for (const service of await response.json()) {
    if (service.publicUri) {
      services.set(service.role, service.publicUri.replace(/\/$/, ""));
    }
  }

  const address = (role: string) => {
    const service = services.get(role);
    expect(service, `service-locator has no public address for ${role}`).toBeDefined();
    return service;
  };
  const send = (method: string, role: string, path: string, data?: unknown) =>
    request.fetch(address(role) + path, { method, headers, data });
  return {
    address,
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

export async function getSession(api: Api, sessionId: string): Promise<Session> {
  const response = await api.get("session-db", `/sessions/${sessionId}`);
  expect(response.ok()).toBe(true);
  return response.json();
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

export async function getDatasets(api: Api, sessionId: string): Promise<{ datasetId: string; name: string }[]> {
  const response = await api.get("session-db", `/sessions/${sessionId}/datasets`);
  expect(response.ok()).toBe(true);
  return response.json();
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

export async function createLabel(api: Api, sessionId: string, name: string, color = "#ff0000"): Promise<string> {
  const response = await api.post("session-db", `/sessions/${sessionId}/labels`, { sessionId, name, color });
  expect(response.ok(), `create label ${response.status()}`).toBe(true);
  return (await response.json()).labelId;
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
