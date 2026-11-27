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
 * Not every backend can run jobs, e.g. one without the runtimes, so a probe job of each tool tries
 * first and the test of a tool is skipped if its probe doesn't complete, with the reason in the
 * report. The probe gets the same time as the job of a test, so that a skip means the test couldn't
 * have passed either. In the dev container the backend runs the jobs as processes with its own
 * classpath, see chipster-web-server/CLAUDE.md.
 */

const CONTENT = "real job\n";

// the python one runs on the python3 of the comp image, the R one on the R of tools-bin
const TOOLS = ["test-data-in-out-without-tools-bin.py", "test-data-in-out.R"];
// how long a job may take, in the probe and in the tests
const JOB_TIMEOUT = 150_000;
// the rest of a test: an upload, the session view (openSession allows 30 s), the tool search, the
// output's content and node, and the dev check
const TEST_TIMEOUT = JOB_TIMEOUT + 60_000;
const FINAL_STATES = ["COMPLETED", "FAILED", "FAILED_USER_ERROR", "ERROR", "EXPIRED_WAITING", "CANCELLED", "TIMEOUT"];

function isFinal(job: Job): boolean {
  return FINAL_STATES.includes(job.state);
}

function isFailed(job: Job): boolean {
  return isFinal(job) && job.state !== "COMPLETED";
}

function describeFailure(job: Job): string {
  const detail = job.stateDetail ? `: ${job.stateDetail}` : "";
  const output = job.screenOutput ? `\n${job.screenOutput}` : "";
  return `the job is ${job.state}${detail}${output}`;
}

/*
 * Posts a probe job of the tool in the session, with the tool's name and module from toolbox.
 * Returns why it couldn't, or the id of the job.
 */
async function postProbeJob(api: Api, sessionId: string, toolId: string): Promise<{ jobId?: string; reason?: string }> {
  const response = await api.get("toolbox", `/tools/${toolId}`);
  if (!response.ok()) {
    return { reason: `toolbox doesn't have ${toolId} (${response.status()})` };
  }
  const tool = await response.json();
  const datasetName = `probe-${toolId}.txt`;
  const datasetId = await createDataset(api, sessionId, { name: datasetName }, CONTENT);
  const jobId = await createJob(api, sessionId, {
    toolId,
    toolName: tool.sadlDescription.name.displayName,
    toolCategory: "Tests",
    module: tool.module,
    state: "NEW",
    parameters: [{ parameterId: "delay", displayName: "Delay", type: "INTEGER", value: "0" }],
    inputs: [{ inputId: "input", displayName: "input", datasetId, datasetName }],
  });
  return { jobId };
}

/*
 * Runs a probe job of each tool in the session, at the same time, and returns why the jobs of a
 * tool can't run, by tool, leaving out the tools whose probe completed.
 */
async function probeJobs(api: Api, sessionId: string): Promise<Map<string, string>> {
  const reasons = new Map<string, string>();
  const jobIds = new Map<string, string>();
  for (const toolId of TOOLS) {
    const { jobId, reason } = await postProbeJob(api, sessionId, toolId);
    if (jobId) {
      jobIds.set(toolId, jobId);
    } else {
      reasons.set(toolId, reason!);
    }
  }
  let jobs: Job[] = [];
  const end = Date.now() + JOB_TIMEOUT;
  while (Date.now() < end) {
    jobs = await getJobs(api, sessionId);
    if (jobs.length === jobIds.size && jobs.every(isFinal)) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  for (const [toolId, jobId] of jobIds) {
    const job = jobs.find((j) => j.jobId === jobId);
    if (!job) {
      reasons.set(toolId, `a probe job of ${toolId} wasn't found in the session`);
    } else if (isFailed(job)) {
      reasons.set(toolId, `a probe job of ${toolId}: ${describeFailure(job)}`);
    } else if (!isFinal(job)) {
      reasons.set(toolId, `a probe job of ${toolId} is ${job.state} after ${JOB_TIMEOUT / 1000} s`);
    }
  }
  return reasons;
}

/*
 * Runs the probe jobs in a session of their own, see probeJobs.
 */
async function whyJobsCantRun(api: Api): Promise<Map<string, string>> {
  const sessionId = await createSession(api, "e2e real job probe");
  let reasons: Map<string, string>;
  try {
    reasons = await probeJobs(api, sessionId);
  } catch (error) {
    // the error of the probe is the one to see, not one of the delete
    await api.delete("session-db", `/sessions/${sessionId}`).catch(() => undefined);
    throw error;
  }
  const deleted = await api.delete("session-db", `/sessions/${sessionId}`);
  expect(deleted.ok(), `delete the probe session: ${deleted.status()}`).toBe(true);
  return reasons;
}

// one worker for both tests, so that the probe runs once
test.describe.configure({ mode: "default", timeout: TEST_TIMEOUT });

let reasons: Map<string, string>;

test.beforeAll(async ({ api }) => {
  // the timeout of describe.configure covers only the tests, a hook gets the project's
  test.setTimeout(TEST_TIMEOUT);
  reasons = await whyJobsCantRun(api);
});

for (const tool of TOOLS) {
  test(`a real job of ${tool} creates its output file`, async ({ page, api, sessionId }) => {
    test.skip(reasons.has(tool), `jobs can't run: ${reasons.get(tool)}`);

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
