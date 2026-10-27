import { expect, test } from "./fixtures";
import { openSession } from "./session-api";

// temporary spike test, not to be committed: the jobs modal follows job events
test("jobs modal follows job events", async ({ page, api, sessionId }) => {
  const job = {
    toolId: "spike.R",
    toolName: "Spike tool",
    toolCategory: "Spike",
    module: "misc",
    state: "RUNNING",
    stateDetail: "running now",
    parameters: [],
    inputs: [],
    outputs: [],
    screenOutput: "first line",
  };
  const created = await api.post("session-db", `/sessions/${sessionId}/jobs`, job);
  expect(created.ok(), `create job ${created.status()} ${await created.text()}`).toBe(true);
  const jobId = (await created.json()).jobId;

  await openSession(page, sessionId);
  await page.getByTitle("Jobs").click();
  const modal = page.locator("ch-jobs-modal");
  const row = modal.locator(`#job-id-${jobId}`);
  await expect(row).toContainText("RUNNING");
  await expect(modal.getByText("Jobs running: 1")).toBeVisible();
  // auto-selected, and its details shown
  await expect(row).toHaveClass(/table-active/);
  await expect(modal.locator("ch-job")).toContainText("Running - running now");
  await expect(modal.locator("ch-job pre").last()).toHaveText("first line");

  // the job finishes elsewhere
  const update = await api.put("session-db", `/sessions/${sessionId}/jobs/${jobId}`, {
    ...job,
    jobId,
    state: "COMPLETED",
    stateDetail: "",
    endTime: new Date().toISOString(),
    screenOutput: "first line\nlast line",
  });
  expect(update.ok(), `update job ${update.status()}`).toBe(true);
  await expect(row).toContainText("COMPLETED");
  await expect(modal.getByText("Jobs running: 0")).toBeVisible();
  await expect(modal.locator("ch-job")).toContainText("Completed");
  await expect(modal.locator("ch-job pre").last()).toHaveText("first line\nlast line");

  // a new job appears in the list, on top
  const second = await api.post("session-db", `/sessions/${sessionId}/jobs`, {
    ...job,
    toolName: "Second tool",
  });
  expect(second.ok()).toBe(true);
  const secondId = (await second.json()).jobId;
  const secondRow = modal.locator(`#job-id-${secondId}`);
  await expect(secondRow).toContainText("Second tool");
  await expect(modal.getByText("Jobs running: 1")).toBeVisible();

  // the arrow keys move the selection: the second job is on top, so up selects it
  await modal.press("ArrowUp");
  await expect(secondRow).toHaveClass(/table-active/);
  await expect(row).not.toHaveClass(/table-active/);
  await expect(modal.locator("ch-job")).toContainText("Second tool");
  await modal.press("ArrowDown");
  await expect(row).toHaveClass(/table-active/);
  await expect(modal.locator("ch-job")).toContainText("Spike tool");

  // wait for a few runs of the dev check's interval
  await page.waitForTimeout(3000);
});
