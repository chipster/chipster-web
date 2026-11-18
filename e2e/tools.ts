import { randomUUID } from "node:crypto";

import { expect, Locator, Page } from "@playwright/test";
import type { Job } from "chipster-js-common";

import { Api } from "./session-api";

/*
 * Helpers for the tests of the tool panel and its parameters modal: selecting tools and changing
 * parameters like a user, reading what the parameters modal shows, and catching the jobs that the
 * Run button posts, so that a test can check that the job is what the user saw.
 */

export function toolsPanel(page: Page): Locator {
  return page.locator("ch-tools");
}

export function runButton(page: Page): Locator {
  return toolsPanel(page).locator(".run-button");
}

export function parametersModal(page: Page): Locator {
  return page.locator("ch-parameters-modal");
}

// selects a tool with the tool search, by its id, which is unique unlike the display names
export async function searchTool(page: Page, toolId: string): Promise<void> {
  const search = toolsPanel(page).locator("#searchTool input");
  await search.fill(toolId);
  await search.press("Enter");
  await expect(toolButton(page, toolId)).toHaveClass(/active/);
}

// a tool in the tool list of the selected category
export function toolButton(page: Page, toolId: string): Locator {
  return toolsPanel(page).locator(`[id="tool-button-${toolId}"]`);
}

// a category in the category list of the selected module, e.g. "Utilities"
export function categoryButton(page: Page, category: string): Locator {
  return toolsPanel(page).locator(`[id="category-button-${category}"]`);
}

export async function openParametersModal(page: Page): Promise<Locator> {
  await toolsPanel(page).getByTitle("Edit parameters and inputs").click();
  const modal = parametersModal(page);
  await expect(modal).toBeVisible();
  return modal;
}

export async function closeParametersModal(page: Page): Promise<void> {
  // the footer button, the header has a close button with the same name
  await parametersModal(page).locator(".modal-footer").getByRole("button", { name: "Close" }).click();
  await expect(parametersModal(page)).toBeHidden();
}

/*
 * The row of a parameter or an input in the modal, by its display name. The first cell starts with
 * the name and continues with the description, so the name is matched at the start only.
 */
function row(section: Locator, name: string): Locator {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return section
    .locator("tbody > tr")
    .filter({ has: section.page().locator("td:first-child", { hasText: new RegExp(`^\\s*${escaped}`) }) });
}

// the input or select of a parameter in the open parameters modal, by its display name
export function parameterField(page: Page, name: string): Locator {
  return row(parametersModal(page).locator("ch-tool-parameters"), name).locator("input, select");
}

// the file selection of a tool input in the open parameters modal, by its display name
export function inputField(page: Page, name: string): Locator {
  return row(parametersModal(page).locator("ch-tool-inputs"), name).locator("select");
}

/*
 * ToolParametersComponent validates a change after a debounce of 500 ms. Closing the modal cancels
 * the debounce, and ToolsComponent validates the parameters when the modal closes instead, which a
 * test of tool-job.spec.ts checks. The other tests wait for the debounce, the usual way a change gets
 * validated. Nothing on the page tells when it's over: the warning icon may be there already before
 * the change, e.g. for a required column parameter without a default.
 */
export const PARAMETER_DEBOUNCE = 500;

/*
 * Changes a parameter in the parameters modal like a user who takes their time, and closes the modal
 * after the change has been validated: the tool panel then shows a changed value with the
 * highlighted edit icon, an invalid one with the warning icon.
 */
export async function setParameter(page: Page, name: string, value: string): Promise<void> {
  await openParametersModal(page);
  const field = parameterField(page, name);
  if ((await field.evaluate((element) => element.tagName)) === "SELECT") {
    await field.selectOption({ label: value });
  } else {
    await field.fill(value);
  }
  // the reset button of the row appears when the value differs from the default
  await expect(
    row(parametersModal(page).locator("ch-tool-parameters"), name).getByTitle("Reset to default"),
  ).toBeVisible();
  await page.waitForTimeout(PARAMETER_DEBOUNCE + 300);
  await expect(toolsPanel(page).locator(".fa-edit.text-primary, .fa-exclamation-circle.text-warning")).toBeVisible();
  await closeParametersModal(page);
}

/*
 * What the parameters modal shows, by the display names: the value of each parameter, and the
 * names of the files selected for each input. A parameter without a value is an empty string,
 * like in the job. The modal has to be open.
 */
export interface ShownState {
  parameters: Record<string, string>;
  inputs: Record<string, string[]>;
}

export async function readParametersModal(page: Page): Promise<ShownState> {
  const modal = parametersModal(page);
  // wait for both sections, they are rendered when the modal gets the validated tool
  await expect(modal.locator("ch-tool-parameters")).toBeVisible();
  await expect(modal.locator("ch-tool-inputs")).toBeVisible();
  return modal.evaluate((element) => {
    // the text of the cell itself, without the description element in it
    const name = (cell: Element) =>
      Array.from(cell.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join("")
        .trim();
    const rows = (selector: string) =>
      Array.from(element.querySelectorAll<HTMLTableRowElement>(`${selector} tbody > tr`));

    const parameters: Record<string, string> = {};
    for (const tr of rows("ch-tool-parameters")) {
      const field = tr.querySelector("input, select") as HTMLInputElement | HTMLSelectElement;
      parameters[name(tr.cells[0])] = field.value;
    }
    const inputs: Record<string, string[]> = {};
    for (const tr of rows("ch-tool-inputs")) {
      const select = tr.querySelector("select");
      // a disabled select only says "No files" or "No compatible files"
      inputs[name(tr.cells[0])] = select.disabled
        ? []
        : Array.from(select.selectedOptions).map((option) => option.textContent.trim());
    }
    return { parameters, inputs };
  });
}

// the same view of a job, to compare it with what the modal showed
export function shownStateOfJob(job: Job): ShownState {
  const parameters: Record<string, string> = {};
  for (const parameter of job.parameters) {
    parameters[parameter.displayName ?? parameter.parameterId] = String(parameter.value);
  }
  const inputs: Record<string, string[]> = {};
  for (const input of job.inputs) {
    const key = input.displayName ?? input.inputId;
    inputs[key] = [...(inputs[key] ?? []), input.datasetName];
  }
  return { parameters, inputs };
}

/*
 * The jobs that the page posts, caught before they reach session-db, which answers them with a
 * made-up job id: no job is created and no tool is run. posts has the jobs of each request in
 * order: one job from Run, several from Run for each file or sample.
 */
export interface CapturedJobs {
  posts: Job[][];
  // waits for the nth request, counting from 1, and returns its jobs
  waitForPost(n: number): Promise<Job[]>;
}

export async function captureJobs(page: Page, api: Api, baseURL: string, sessionId: string): Promise<CapturedJobs> {
  // the address is relative in the proxy mode and absolute in the direct mode
  const jobs = new URL(`${api.address("session-db")}/sessions/${sessionId}/jobs`, baseURL).href;
  const posts: Job[][] = [];
  await page.route(
    (url) => url.href === jobs || url.href === `${jobs}/array`,
    async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        // e.g. the preflight of the direct mode
        await route.fallback();
        return;
      }
      const body = request.postDataJSON();
      const posted: Job[] = Array.isArray(body) ? body : [body];
      posts.push(posted);
      const created = posted.map((job) => ({ ...job, jobId: randomUUID() }));
      const origin = request.headers()["origin"];
      await route.fulfill({
        contentType: "application/json",
        // the direct mode is cross-origin
        headers: origin ? { "access-control-allow-origin": origin, "access-control-allow-credentials": "true" } : {},
        body: JSON.stringify(Array.isArray(body) ? { jobs: created } : created[0]),
      });
    },
  );
  return {
    posts,
    waitForPost: async (n) => {
      await expect.poll(() => posts.length, { message: `job request ${n}` }).toBeGreaterThanOrEqual(n);
      return posts[n - 1];
    },
  };
}

/*
 * Delays the requests of a file's content, e.g. the one that reads the column headers of a table
 * for the column parameters, until release() is called. The other requests go through.
 */
export async function delayFile(
  page: Page,
  api: Api,
  baseURL: string,
  sessionId: string,
  datasetId: string,
): Promise<{ held: Promise<void>; release: () => void }> {
  const file = new URL(`${api.address("file-broker")}/sessions/${sessionId}/datasets/${datasetId}`, baseURL).href;
  let release: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  // resolved when a request is being held back, so that a test knows that it tests what it should
  let hold: () => void;
  const held = new Promise<void>((resolve) => {
    hold = resolve;
  });
  await page.route(
    (url) => url.href.split("?")[0] === file,
    async (route) => {
      hold();
      await released;
      // the page may be gone if the test ended first
      await route.continue().catch(() => undefined);
    },
  );
  return { held, release: () => release() };
}
