import { readFileSync } from "node:fs";

import { APIRequestContext, expect, Page } from "@playwright/test";

import { USER_STATE } from "./login";

/*
 * Test data is created through the REST APIs rather than the UI, to keep the
 * tests about the part of the UI they are testing. The addresses of the
 * services come from service-locator like in the app, so that the tests work
 * in both the proxy and the direct mode of the dev environment.
 */

export interface Api {
  request: APIRequestContext;
  headers: { Authorization: string };
  // the public address of each service by its role, e.g. "/session-db" or "http://localhost:8004"
  services: Map<string, string>;
}

/*
 * The API as the user that auth.setup.ts logged in: the token is read from the
 * browser state it saved, so no page has to be loaded for it. The request
 * context is the test's own, so that the relative addresses of the proxy mode
 * go to the same baseURL.
 */
export async function getApi(request: APIRequestContext, stateFile = USER_STATE): Promise<Api> {
  const state = JSON.parse(readFileSync(stateFile, "utf8"));
  const token = state.origins
    .flatMap((origin) => origin.localStorage)
    .find((entry) => entry.name === "ch-auth-token").value;

  // the only address the app itself knows, see src/assets/conf/chipster.yaml
  const response = await request.get("/service-locator/services");
  expect(response.ok()).toBe(true);
  const services = new Map<string, string>();
  for (const service of await response.json()) {
    if (service.publicUri) {
      services.set(service.role, service.publicUri.replace(/\/$/, ""));
    }
  }

  return {
    request,
    headers: { Authorization: "Basic " + Buffer.from("token:" + token).toString("base64") },
    services,
  };
}

// the address of a path of a service, like "session-db" and "/sessions/"
export function url(api: Api, role: string, path: string): string {
  const service = api.services.get(role);
  expect(service, `service-locator has no public address for ${role}`).toBeDefined();
  return service + path;
}

export async function createSession(api: Api, name: string): Promise<string> {
  const response = await api.request.post(url(api, "session-db", "/sessions/"), {
    headers: api.headers,
    data: { name },
  });
  expect(response.ok()).toBe(true);
  return (await response.json()).sessionId;
}

export async function deleteSession(api: Api, sessionId: string): Promise<void> {
  const response = await api.request.delete(url(api, "session-db", `/sessions/${sessionId}`), { headers: api.headers });
  expect(response.ok()).toBe(true);
}

export async function createDataset(api: Api, sessionId: string, dataset: object, content: string): Promise<string> {
  const response = await api.request.post(url(api, "session-db", `/sessions/${sessionId}/datasets`), {
    headers: api.headers,
    data: dataset,
  });
  expect(response.ok()).toBe(true);
  const datasetId = (await response.json()).datasetId;

  const upload = await api.request.put(
    url(api, "file-broker", `/sessions/${sessionId}/datasets/${datasetId}?flowTotalSize=${Buffer.byteLength(content)}`),
    { headers: api.headers, data: content },
  );
  expect(upload.ok()).toBe(true);
  return datasetId;
}

export async function getDatasets(api: Api, sessionId: string): Promise<{ datasetId: string; name: string }[]> {
  const response = await api.request.get(url(api, "session-db", `/sessions/${sessionId}/datasets`), {
    headers: api.headers,
  });
  expect(response.ok()).toBe(true);
  return response.json();
}

export function datasetNode(page: Page, datasetId: string) {
  return page.locator(`#d3DatasetNodesGroup rect[id$="_${datasetId}"]`);
}

/*
 * The analyze view waits for the tool modules of toolbox, which take a few
 * seconds in the dev setup, before it draws anything
 */
export async function openSession(page: Page, sessionId: string, datasetId: string) {
  await page.goto(`/analyze/${sessionId}`);
  await expect(datasetNode(page, datasetId)).toBeVisible({ timeout: 30_000 });
}
