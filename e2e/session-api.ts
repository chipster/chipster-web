import { readFileSync } from "node:fs";

import { APIRequestContext, APIResponse, expect, Page } from "@playwright/test";
import type { Session } from "chipster-js-common";

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
 * The dev server closes an idle keep-alive connection after a few seconds,
 * and a request that picks the connection up just then fails with ECONNRESET.
 * A browser sends such a request again on its own, the request context of
 * Playwright only when told to, and it retries nothing but ECONNRESET. Only
 * the idempotent methods are retried: a POST that reached the service before
 * the reset would create its object twice.
 */
const MAX_RETRIES = 2;

/*
 * The token is read from the browser state that auth.setup.ts saved, so no
 * page has to be loaded for it. The request context has to have the baseURL
 * of the app, for the relative addresses of the proxy mode.
 */
export async function getApi(request: APIRequestContext, stateFile = USER_STATE): Promise<Api> {
  const state = JSON.parse(readFileSync(stateFile, "utf8"));
  const token = state.origins
    .flatMap((origin) => origin.localStorage)
    .find((entry) => entry.name === "ch-auth-token").value;
  const headers = { Authorization: "Basic " + Buffer.from("token:" + token).toString("base64") };

  // the only address the app itself knows, see src/assets/conf/chipster.yaml
  const response = await request.get("/service-locator/services", { maxRetries: MAX_RETRIES });
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
  const send = (method: string, role: string, path: string, data?: unknown, maxRetries = MAX_RETRIES) =>
    request.fetch(address(role) + path, { method, headers, data, maxRetries });
  return {
    address,
    get: (role, path) => send("GET", role, path),
    post: (role, path, data) => send("POST", role, path, data, 0),
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

export async function createDataset(api: Api, sessionId: string, dataset: object, content: string): Promise<string> {
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
