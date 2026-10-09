import { test as base, BrowserContext, expect, Page } from "@playwright/test";

import { Api, createSession, getApi } from "./session-api";

/*
 * The test function of all the specs.
 *
 * api gives a test the REST API, and sessionId a session of its own, which is
 * deleted after the test. A spec sets the state of the session with
 * test.use({ sessionState }), e.g. to "TEMPORARY_UNMODIFIED".
 *
 * pageErrors fails a test if a page logged an error in the console or threw
 * an uncaught exception, even when everything the test checked was right: an
 * upgrade of Angular or of a library often shows only there at first, while
 * the page still looks fine. A test allows the errors that it causes on
 * purpose, like a failed login, with pageErrors.allowFailedRequest() and
 * pageErrors.allowErrorMessage(). The errors that the app logs regardless of
 * the test are in KNOWN_FAILED_REQUESTS, each with the reason it isn't a
 * failure of the test.
 */

interface FailedRequest {
  status: number;
  // the service and the start of the path, so that it matches in both the proxy and the direct mode
  role: string;
  path: string;
}

const KNOWN_FAILED_REQUESTS: FailedRequest[] = [
  /*
   * The tests run in parallel as the same user, and when two of them update
   * the user at the same time, the auth service fails the other update with
   * an OptimisticLockException (UserTable.update). The app ignores it.
   */
  { status: 500, role: "auth", path: "/users?userId=" },
];

export interface PageErrors {
  // allow the console error of a failed request in the current test
  allowFailedRequest(status: number, role: string, path: string): void;
  // allow the error that the app shows with this title, see ErrorService.showError()
  allowErrorMessage(title: string): void;
  // check the pages of a context that the test created itself too
  watch(context: BrowserContext): void;
}

interface PageError {
  text: string;
  // the address of the failed request for "Failed to load resource"
  url?: string;
  // the title of an ErrorMessage that the app logged
  title?: string;
}

interface TestFixtures {
  pageErrors: PageErrors;
  sessionState: string | undefined;
  sessionId: string;
}

interface WorkerFixtures {
  api: Api;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  /*
   * One per worker: the token and the service addresses don't change during a
   * run, and the setup project has saved the token before any worker starts.
   */
  api: [
    async ({ playwright }, use, workerInfo) => {
      const request = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL });
      await use(await getApi(request));
      await request.dispose();
    },
    { scope: "worker" },
  ],

  // a SessionState of chipster-js-common, the default is a normal session
  sessionState: [undefined, { option: true }],

  sessionId: async ({ api, context, sessionState }, use, testInfo) => {
    const sessionId = await createSession(api, `e2e ${testInfo.title}`, sessionState);
    await use(sessionId);

    /*
     * close the pages first, the app would react to the deletion otherwise,
     * and its requests for the session that is gone would show up as errors
     */
    for (const page of context.pages()) {
      await page.close();
    }
    const response = await api.delete("session-db", `/sessions/${sessionId}`);
    // 404 if the test deleted it through the app
    expect(response.ok() || response.status() === 404, `delete session: ${response.status()}`).toBe(true);
  },

  pageErrors: [
    async ({ api, baseURL, context }, use) => {
      const errors: Promise<PageError>[] = [];
      const allowedRequests = [...KNOWN_FAILED_REQUESTS];
      const allowedTitles: string[] = [];

      const listen = (page: Page) => {
        page.on("pageerror", (error) => errors.push(Promise.resolve({ text: `uncaught: ${error.message}` })));
        page.on("console", (message) => {
          if (message.type() !== "error") {
            return;
          }
          const url = message.location().url;
          if (message.text() === "ErrorMessage") {
            // the console shows only the class name of the object, read its title from the page
            const title = message
              .args()[0]
              .evaluate((m: { title: string }) => m.title)
              .catch(() => undefined);
            errors.push(title.then((t) => ({ text: `console: ErrorMessage "${t}"`, title: t })));
          } else {
            errors.push(Promise.resolve({ text: `console: ${message.text()} (${url})`, url }));
          }
        });
      };
      // every page of the context, including those opened in new tabs
      const watch = (watched: BrowserContext) => {
        watched.pages().forEach(listen);
        watched.on("page", listen);
      };
      watch(context);

      await use({
        allowFailedRequest: (status, role, path) => allowedRequests.push({ status, role, path }),
        allowErrorMessage: (title) => allowedTitles.push(title),
        watch,
      });

      // the address is relative in the proxy mode and absolute in the direct mode
      const isAllowedRequest = (error: PageError) =>
        allowedRequests.some(
          (r) =>
            error.text.includes(`status of ${r.status} `) &&
            error.url?.startsWith(new URL(api.address(r.role) + r.path, baseURL).href),
        );
      const unexpected = (await Promise.all(errors))
        .filter((error) => !isAllowedRequest(error) && !allowedTitles.includes(error.title))
        .map((error) => error.text);
      expect(unexpected, "errors on the page").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
