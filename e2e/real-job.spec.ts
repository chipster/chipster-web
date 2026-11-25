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
  getJobs,
  openSession,
} from "./session-api";
import { runButton, searchTool } from "./tools";

/*
 * A job that really runs: Run posts it, the scheduler starts it, comp runs the tool script and
 * uploads the result. Uses the test tools of the Tests category, which copy the input file to the
 * output and need nothing but the runtime itself (python3 or R).
 *
 * Not every backend can run jobs, e.g. one without the runtimes, so a probe job tries first and the
 * tests are skipped if it doesn't complete, with the reason in the report. The probe gets the same
 * time as the job of a test, so that a skip means the tests couldn't have passed either. In the dev
 * container the backend needs the process-classpath scripts, see chipster-web-server/CLAUDE.md:
 * with the default process scripts, the probe would start a "./gradlew clean" under the running
 * backend.
 */

const CONTENT = "real job\n";

const PROBE_TOOL = "test-data-in-out-without-tools-bin.py";
// how long a job may take, in the probe and in the tests
const JOB_TIMEOUT = 150_000;
// the job and the rest of a test or of the probe: an upload, the session view, the session delete
const TEST_TIMEOUT = 180_000;
const FINAL_STATES = ["COMPLETED", "FAILED", "FAILED_USER_ERROR", "ERROR", "EXPIRED_WAITING", "CANCELLED", "TIMEOUT"];

function isFailed(job: Job): boolean {
  return FINAL_STATES.includes(job.state) && job.state !== "COMPLETED";
}

function describeFailure(job: Job): string {
  const detail = job.stateDetail ? `: ${job.stateDetail}` : "";
  const output = job.screenOutput ? `\n${job.screenOutput}` : "";
  return `the job is ${job.state}${detail}${output}`;
}

/*
 * Runs a job of the probe tool in the session, and returns why jobs can't run, or undefined if
 * the job completed.
 */
async function probeJob(api: Api, sessionId: string): Promise<string | undefined> {
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
  const end = Date.now() + JOB_TIMEOUT;
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
  const final = FINAL_STATES.includes(job?.state ?? "") ? "" : ` after ${JOB_TIMEOUT / 1000} s`;
  return `a probe job of ${PROBE_TOOL} is ${job?.state}${final}${detail}`;
}

/*
 * Runs the probe job in a session of its own, and returns why jobs can't run, or undefined if
 * the job completed.
 */
async function whyJobsCantRun(api: Api): Promise<string | undefined> {
  const tool = await api.get("toolbox", `/tools/${PROBE_TOOL}`);
  if (!tool.ok()) {
    return `toolbox doesn't have ${PROBE_TOOL} (${tool.status()})`;
  }
  const sessionId = await createSession(api, "e2e real job probe");
  let reason: string | undefined;
  try {
    reason = await probeJob(api, sessionId);
  } catch (error) {
    // the error of the probe is the one to see, not one of the delete
    await api.delete("session-db", `/sessions/${sessionId}`).catch(() => undefined);
    throw error;
  }
  const deleted = await api.delete("session-db", `/sessions/${sessionId}`);
  expect(deleted.ok(), `delete the probe session: ${deleted.status()}`).toBe(true);
  return reason;
}

// one worker for both tests, so that the probe runs once
test.describe.configure({ mode: "default", timeout: TEST_TIMEOUT });

test.beforeAll(async ({ api }) => {
  // the timeout of describe.configure covers only the tests, a hook gets the project's
  test.setTimeout(TEST_TIMEOUT);
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
      .poll(
        async () => {
          // a failed job wouldn't produce it, say right away why
          const failed = (await getJobs(api, sessionId)).find(isFailed);
          if (failed) {
            throw new Error(describeFailure(failed));
          }
          return (await getDatasets(api, sessionId)).filter((d) => d.datasetId !== input).length;
        },
        { message: "the output file", timeout: JOB_TIMEOUT },
      )
      .toBe(1);
    const output = (await getDatasets(api, sessionId)).find((d) => d.datasetId !== input)!;
    expect(await getDatasetContent(api, sessionId, output.datasetId)).toBe(CONTENT);
    await expect(datasetNode(page, output.datasetId)).toBeVisible();
    await waitForDevCheck(page);
  });
}
