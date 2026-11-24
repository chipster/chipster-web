import type { Job } from "chipster-js-common";

import { expect, test, waitForDevCheck } from "./fixtures";
import {
  Api,
  createDataset,
  createJob,
  createSession,
  datasetNode,
  getDatasetContent,
  getDatasets,
  openSession,
} from "./session-api";
import { runButton, searchTool } from "./tools";

/*
 * A job that really runs: Run posts it, the scheduler starts it, comp runs the tool script and
 * uploads the result. Uses the test tools of the Tests category, which copy the input file to the
 * output and need nothing but the runtime itself (python3 or R).
 *
 * Not every backend can run jobs, e.g. one without the runtimes, so a probe job tries first and the
 * tests are skipped if it doesn't complete, with the reason in the report. In the dev container the
 * backend needs the process-classpath scripts, see chipster-web-server/CLAUDE.md: with the default
 * process scripts, the probe would start a "./gradlew clean" under the running backend.
 */

const CONTENT = "real job\n";

const PROBE_TOOL = "test-data-in-out-without-tools-bin.py";
const PROBE_TIMEOUT = 60_000;
const FINAL_STATES = ["COMPLETED", "FAILED", "FAILED_USER_ERROR", "ERROR", "EXPIRED_WAITING", "CANCELLED", "TIMEOUT"];

/*
 * Runs a job of the probe tool through the API, and returns why jobs can't run, or undefined if
 * the job completed.
 */
async function whyJobsCantRun(api: Api): Promise<string | undefined> {
  const tool = await api.get("toolbox", `/tools/${PROBE_TOOL}`);
  if (!tool.ok()) {
    return `toolbox doesn't have ${PROBE_TOOL} (${tool.status()})`;
  }
  const sessionId = await createSession(api, "e2e real job probe");
  try {
    const datasetId = await createDataset(api, sessionId, { name: "probe.txt" }, CONTENT);
    const jobId = await createJob(api, sessionId, {
      toolId: PROBE_TOOL,
      toolName: "Test data input and output without tools-bin",
      toolCategory: "Tests",
      module: "misc",
      state: "NEW",
      parameters: [{ parameterId: "delay", displayName: "Delay", type: "INTEGER", value: "0" }],
      inputs: [{ inputId: "input", displayName: "input", datasetId, datasetName: "probe.txt" }],
    });
    let job: Job | undefined;
    const end = Date.now() + PROBE_TIMEOUT;
    while (Date.now() < end) {
      const response = await api.get("session-db", `/sessions/${sessionId}/jobs/${jobId}`);
      expect(response.ok()).toBe(true);
      job = await response.json();
      if (FINAL_STATES.includes(job!.state)) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (job?.state === "COMPLETED") {
      return undefined;
    }
    const detail = job?.stateDetail ? `: ${job.stateDetail}` : "";
    const final = FINAL_STATES.includes(job?.state ?? "") ? "" : ` after ${PROBE_TIMEOUT / 1000} s`;
    return `a probe job of ${PROBE_TOOL} is ${job?.state}${final}${detail}`;
  } finally {
    await api.delete("session-db", `/sessions/${sessionId}`);
  }
}

// one worker for both tests, so that the probe runs once
test.describe.configure({ mode: "default", timeout: 180_000 });

test.beforeAll(async ({ api }) => {
  const reason = await whyJobsCantRun(api);
  test.skip(reason !== undefined, `jobs can't run: ${reason}`);
});

for (const tool of ["test-data-in-out-without-tools-bin.py", "test-data-in-out.R"]) {
  test(`a real job of ${tool} creates its output file`, async ({ page, api, sessionId }) => {
    const input = await createDataset(api, sessionId, { name: "input.txt", x: 100, y: 100 }, CONTENT);
    await openSession(page, sessionId, input);
    await searchTool(page, tool);
    await datasetNode(page, input).click();
    await runButton(page).click();

    // the output file of the job appears in the session
    await expect
      .poll(async () => (await getDatasets(api, sessionId)).filter((d) => d.datasetId !== input).length, {
        message: "the output file",
        timeout: 150_000,
      })
      .toBe(1);
    const output = (await getDatasets(api, sessionId)).find((d) => d.datasetId !== input)!;
    expect(await getDatasetContent(api, sessionId, output.datasetId)).toBe(CONTENT);
    await expect(datasetNode(page, output.datasetId)).toBeVisible();
    await waitForDevCheck(page);
  });
}
