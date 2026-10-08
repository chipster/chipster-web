import { APIRequestContext, expect, Page } from "@playwright/test";

/*
 * Helpers for the specs that need a session of their own, created through the
 * REST APIs that the dev server proxies.
 */

export interface Api {
  request: APIRequestContext;
  headers: { Authorization: string };
}

export async function getApi(page: Page): Promise<Api> {
  await expect(page).toHaveURL(/\/sessions$/);
  const token = await page.evaluate(() => localStorage.getItem("ch-auth-token"));
  return {
    request: page.request,
    headers: { Authorization: "Basic " + Buffer.from("token:" + token).toString("base64") },
  };
}

export async function createSession(api: Api, name: string): Promise<string> {
  const response = await api.request.post("/session-db/sessions/", { headers: api.headers, data: { name } });
  expect(response.ok()).toBe(true);
  return (await response.json()).sessionId;
}

export async function createDataset(api: Api, sessionId: string, dataset: object, content: string): Promise<string> {
  const response = await api.request.post(`/session-db/sessions/${sessionId}/datasets`, {
    headers: api.headers,
    data: dataset,
  });
  expect(response.ok()).toBe(true);
  const datasetId = (await response.json()).datasetId;

  const upload = await api.request.put(
    `/file-broker/sessions/${sessionId}/datasets/${datasetId}?flowTotalSize=${Buffer.byteLength(content)}`,
    { headers: api.headers, data: content },
  );
  expect(upload.ok()).toBe(true);
  return datasetId;
}

/*
 * The analyze view waits for the tool modules of toolbox, which take a few
 * seconds in the dev setup, before it draws anything
 */
export async function openSession(page: Page, sessionId: string, datasetId: string) {
  await page.goto(`/analyze/${sessionId}`);
  await expect(datasetNode(page, datasetId)).toBeVisible({ timeout: 30_000 });
}

export function datasetNode(page: Page, datasetId: string) {
  return page.locator(`#d3DatasetNodesGroup rect[id$="_${datasetId}"]`);
}
