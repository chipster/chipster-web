import { expect, test } from "./fixtures";
import { createJob, openSession, TEST_JOB, updateJob } from "./session-api";

/*
 * The jobs modal follows the job events while it's open. The jobs are created and changed
 * through the API, so the page learns about them only from the events.
 */

test("the jobs modal follows the job events", async ({ page, api, sessionId }) => {
  const jobId = await createJob(api, sessionId, {
    ...TEST_JOB,
    stateDetail: "running now",
    screenOutput: "first line",
  });

  await openSession(page, sessionId);
  await page.getByTitle("Jobs").click();
  const modal = page.locator("ch-jobs-modal");
  const row = modal.locator(`#job-id-${jobId}`);
  await expect(row).toContainText("RUNNING");
  await expect(modal.getByText("Jobs running: 1")).toBeVisible();
  // selected when the modal opens, and its details shown
  await expect(row).toHaveClass(/table-active/);
  await expect(modal.locator("ch-job")).toContainText("Running - running now");
  await expect(modal.locator("ch-job pre").last()).toHaveText("first line");

  // the job finishes elsewhere
  await updateJob(api, sessionId, jobId, {
    state: "COMPLETED",
    stateDetail: "",
    endTime: new Date().toISOString(),
    screenOutput: "first line\nlast line",
  });
  await expect(row).toContainText("COMPLETED");
  await expect(modal.getByText("Jobs running: 0")).toBeVisible();
  await expect(modal.locator("ch-job")).toContainText("Completed");
  await expect(modal.locator("ch-job pre").last()).toHaveText("first line\nlast line");

  // a new job appears in the list, on top
  const secondId = await createJob(api, sessionId, { ...TEST_JOB, toolName: "Second tool" });
  const secondRow = modal.locator(`#job-id-${secondId}`);
  await expect(secondRow).toContainText("Second tool");
  await expect(modal.getByText("Jobs running: 1")).toBeVisible();

  // The arrow keys move the selection: the second job is on top, so up selects it. The modal
  // focuses its close button when it opens, and the keys reach the modal's handler from there.
  // After a click on a row, they don't: the focus is then on the modal window above the handler.
  await page.keyboard.press("ArrowUp");
  await expect(secondRow).toHaveClass(/table-active/);
  await expect(row).not.toHaveClass(/table-active/);
  await expect(modal.locator("ch-job")).toContainText("Second tool");
  await page.keyboard.press("ArrowDown");
  await expect(row).toHaveClass(/table-active/);
  await expect(modal.locator("ch-job")).toContainText("Test tool");
});
