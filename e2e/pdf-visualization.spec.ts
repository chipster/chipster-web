import { expect, Page, test } from "@playwright/test";

import { login } from "./login";
import { Api, createDataset, createSession, datasetNode, deleteSession, getApi, openSession } from "./session";

/*
 * Large pdf files may take a long time to render, so the pdf visualization
 * asks first for files over 10 MB, and doesn't download the file until the
 * user chooses.
 */

/*
 * A one-page pdf file with the given text. The padding goes to an unreferenced
 * stream, so that it makes the file larger without making it any slower to
 * render.
 */
function createPdf(text: string, paddingBytes = 0): Buffer {
  const content = `BT /F1 24 Tf 72 720 Td (${text}) Tj ET`;
  const padding = ("%" + "x".repeat(1000) + "\n").repeat(Math.floor(paddingBytes / 1002));
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R " +
      "/Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${padding.length} >>\nstream\n${padding}\nendstream`,
  ];

  // all ASCII, so string lengths are byte offsets
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "ascii");
}

const SMALL_PDF = createPdf("Small test PDF");
// over the limit of 10 MB, and clearly over 11 MB so that the prompt shows 11.1 MB
const LARGE_PDF = createPdf("Large test PDF", 11 * 1024 * 1024 + 2048);

function pdfVisualization(page: Page) {
  return page.locator("ch-pdf-visualization");
}

async function selectDataset(page: Page, datasetId: string) {
  await datasetNode(page, datasetId).click();
}

async function expectRendered(page: Page) {
  // the toolbar is shown when the file is loaded, the canvas when a page is rendered
  await expect(pdfVisualization(page).locator("#pdf-view-navigation")).toBeVisible({ timeout: 30_000 });
  await expect(pdfVisualization(page).locator("canvas").first()).toBeVisible();
}

async function expectFailed(page: Page) {
  const visualization = pdfVisualization(page);
  await expect(visualization.getByText("Loading pdf file failed")).toBeVisible({ timeout: 30_000 });
  await expect(visualization.locator("progress")).toHaveCount(0);
  await expect(visualization.locator("pdf-viewer")).toHaveCount(0);
}

test.describe.configure({ timeout: 90_000 });

let api: Api;
let sessionId: string | undefined;

test.beforeEach(async ({ page }) => {
  await login(page, "chipster", "chipster");
  api = await getApi(page);
  sessionId = await createSession(api, "e2e pdf visualization");
});

test.afterEach(async () => {
  // cleared right away, so that a later test whose setup fails before
  // creating its own session doesn't delete this one again
  const sessionToDelete = sessionId;
  sessionId = undefined;
  if (sessionToDelete) {
    await deleteSession(api, sessionToDelete);
  }
});

test("a small pdf file is shown directly", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "small.pdf", x: 100, y: 100 }, SMALL_PDF);

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);

  await expectRendered(page);
  await expect(pdfVisualization(page).getByRole("button", { name: "Show here" })).toHaveCount(0);
});

test("a large pdf file is shown only when asked", async ({ page, context }) => {
  const datasetId = await createDataset(api, sessionId, { name: "large.pdf", x: 100, y: 100 }, LARGE_PDF);
  const filePath = `/file-broker/sessions/${sessionId}/datasets/${datasetId}`;

  // requests for the file's contents from this page
  const pageFileRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes(filePath)) {
      pageFileRequests.push(request.url());
    }
  });

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);

  const visualization = pdfVisualization(page);
  await expect(visualization.locator("ch-status")).toContainText(
    "This PDF is larger than 10 MB (11.1 MB). Showing it here may be slow or make the page unresponsive. " +
      "Opening it in a new tab is recommended.",
  );
  await expect(visualization.locator("ch-status").getByRole("button")).toHaveText(["Show here", "Open in new tab"]);
  await expect(visualization.locator("progress")).toHaveCount(0);
  await expect(visualization.locator("pdf-viewer")).toHaveCount(0);

  // the new tab gets the file, and the prompt stays in case the user wants to show it here too.
  // The new tab may request the file before Playwright hands it over as a popup, so the request is
  // waited for from the context, from before the click. The context sees the requests of this page
  // too, but pageFileRequests shows below that this page didn't make it.
  const popupPromise = page.waitForEvent("popup");
  const fileRequest = context.waitForEvent("request", (request) => request.url().includes(filePath));
  await visualization.getByRole("button", { name: "Open in new tab" }).click();
  const popup = await popupPromise;
  await fileRequest;
  await popup.close();
  await expect(visualization.getByRole("button", { name: "Show here" })).toBeVisible();
  // the file was requested only by the new tab
  expect(pageFileRequests).toEqual([]);

  await visualization.getByRole("button", { name: "Show here" }).click();
  await expectRendered(page);
});

test("a failing request for the file's address ends in the fail state", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "small.pdf", x: 100, y: 100 }, SMALL_PDF);
  await page.route(new RegExp(`/session-db/tokens/sessions/${sessionId}/datasets/${datasetId}`), (route) =>
    route.fulfill({ status: 500, body: "test failure" }),
  );

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);

  await expectFailed(page);
});

test("a broken pdf file ends in the fail state", async ({ page }) => {
  const datasetId = await createDataset(
    api,
    sessionId,
    { name: "broken.pdf", x: 100, y: 100 },
    "This is not a pdf file.\n",
  );

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);

  await expectFailed(page);
});
