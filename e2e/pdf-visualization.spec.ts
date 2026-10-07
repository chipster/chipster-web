import { expect, Page, test } from "@playwright/test";

import { login } from "./login";
import { Api, createDataset, createSession, datasetNode, deleteSession, getApi, openSession } from "./session";

/*
 * Large pdf files may take a long time to render, so the pdf visualization
 * asks first for files over 10 MB, and doesn't download the file until the
 * user chooses.
 */

interface PdfPage {
  text: string;
  width: number;
  height: number;
  // numbers of the pages that this page links to
  links?: number[];
}

/*
 * A pdf file with the given pages, each showing its text and its links. The
 * padding goes to an unreferenced stream, so that it makes the file larger
 * without making it any slower to render.
 */
function createPdfPages(pages: PdfPage[], paddingBytes = 0): Buffer {
  const padding = ("%" + "x".repeat(1000) + "\n").repeat(Math.floor(paddingBytes / 1002));
  // 1: catalog, 2: page tree, 3: font, then a page and its content for each page, then links and padding
  const pageObject = (i: number) => 4 + 2 * i;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObject(i)} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const linkObjects: string[] = [];
  pages.forEach((page, i) => {
    let content = `BT /F1 24 Tf 72 ${page.height - 72} Td (${page.text}) Tj ET`;
    const annotations: string[] = [];
    (page.links ?? []).forEach((target, j) => {
      const y = page.height - 130 - 40 * j;
      content += `\nBT /F1 18 Tf 72 ${y} Td (Go to page ${target}) Tj ET`;
      // /Fit shows the whole target page
      linkObjects.push(
        `<< /Type /Annot /Subtype /Link /Rect [70 ${y - 5} 250 ${y + 20}] /Border [0 0 0] ` +
          `/Dest [${pageObject(target - 1)} 0 R /Fit] >>`,
      );
      annotations.push(`${4 + 2 * pages.length + linkObjects.length - 1} 0 R`);
    });
    const annots = annotations.length > 0 ? ` /Annots [${annotations.join(" ")}]` : "";
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] ` +
        `/Contents ${pageObject(i) + 1} 0 R /Resources << /Font << /F1 3 0 R >> >>${annots} >>`,
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
  });
  objects.push(...linkObjects);
  objects.push(`<< /Length ${padding.length} >>\nstream\n${padding}\nendstream`);

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

// a one-page pdf file with the given text
function createPdf(text: string, paddingBytes = 0): Buffer {
  return createPdfPages([{ text, width: 612, height: 792 }], paddingBytes);
}

const SMALL_PDF = createPdf("Small test PDF");
// over the limit of 10 MB, and clearly over 11 MB so that the prompt shows 11.1 MB
const LARGE_PDF = createPdf("Large test PDF", 11 * 1024 * 1024 + 2048);

// pages of different sizes, so that the height of the viewer has to follow them, and links between them
const MULTI_PAGE_PDF = createPdfPages([
  { text: "Page 1, Letter portrait", width: 612, height: 792, links: [5] },
  { text: "Page 2, A4 portrait", width: 595, height: 842 },
  { text: "Page 3, Letter landscape", width: 792, height: 612 },
  { text: "Page 4, A5 portrait", width: 420, height: 595 },
  { text: "Page 5, Legal portrait", width: 612, height: 1008, links: [1] },
  { text: "Page 6, A4 landscape", width: 842, height: 595 },
]);

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
  // the user can still try again or open the file in a new tab
  await expect(visualization.locator("ch-status").getByRole("button")).toHaveText(["Try again", "Open in new tab"]);
  await expect(visualization.locator("progress")).toHaveCount(0);
  await expect(visualization.locator("pdf-viewer")).toHaveCount(0);
}

/*
 * The height of the pdf-viewer element and the height of the pages it shows,
 * as laid out by pdf.js. Each page has a 10px bottom margin.
 */
async function viewerAndPageHeights(page: Page) {
  return pdfVisualization(page)
    .locator("pdf-viewer")
    .evaluate((viewer) => {
      const shownPages = Array.from(viewer.querySelectorAll<HTMLElement>(".page")).filter(
        (pageDiv) => pageDiv.offsetParent !== null,
      );
      const container = viewer.querySelector<HTMLElement>(".ng2-pdf-viewer-container");
      return {
        viewer: viewer.getBoundingClientRect().height,
        pages: shownPages.reduce((sum, pageDiv) => sum + pageDiv.getBoundingClientRect().height + 10, 0),
        shownPages: shownPages.length,
        // more than 0 when the pages don't fit, so that a part of them is cut off
        overflow: container.scrollHeight - container.clientHeight,
      };
    });
}

async function expectHeightFitsPages(page: Page, shownPages: number) {
  await expect
    .poll(async () => {
      const heights = await viewerAndPageHeights(page);
      return heights.shownPages === shownPages && heights.viewer === heights.pages && heights.overflow <= 0;
    })
    .toBe(true);
  return (await viewerAndPageHeights(page)).viewer;
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

test("the height follows the pages of a pdf file with pages of different sizes", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "multipage.pdf", x: 100, y: 100 }, MULTI_PAGE_PDF);

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);
  const visualization = pdfVisualization(page);
  await expect(visualization.getByText("Page 1 / 6")).toBeVisible();

  // a single page at a time
  const heights = [await expectHeightFitsPages(page, 1)];

  // a link in the pdf changes the page too
  await visualization.locator(".linkAnnotation a").click();
  await expect(visualization.getByText("Page 5 / 6")).toBeVisible();
  expect(await expectHeightFitsPages(page, 1)).toBeGreaterThan(heights[0]);
  await visualization.locator(".linkAnnotation a").click();
  await expect(visualization.getByText("Page 1 / 6")).toBeVisible();
  expect(await expectHeightFitsPages(page, 1)).toBe(heights[0]);

  for (let pageNumber = 2; pageNumber <= 6; pageNumber++) {
    await visualization.getByTitle("Next page").click();
    await expect(visualization.getByText(`Page ${pageNumber} / 6`)).toBeVisible();
    heights.push(await expectHeightFitsPages(page, 1));
  }
  // the pages are shown at the same zoom, so the heights follow the page sizes
  expect(heights[2]).toBeLessThan(heights[0]);
  expect(heights[4]).toBeGreaterThan(heights[1]);

  // all pages, none of them cut off
  await visualization.getByTitle("Show all pages").click();
  await expect(visualization.getByText("All 6 pages")).toBeVisible();
  await expectHeightFitsPages(page, 6);
  await expect(visualization.locator(".page canvas")).toHaveCount(6, { timeout: 30_000 });
});
