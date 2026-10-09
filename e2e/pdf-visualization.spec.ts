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
  // a link to another page of the pdf, by its number
  pageLink?: number;
  // a link to a web page
  webLink?: string;
}

// pages are Letter size, in points from the bottom left corner
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
// the areas of the links on a page, from the left and the bottom, so that the test can click them
const PAGE_LINK = { x: 70, y: 657, width: 180, height: 25 };
const WEB_LINK = { x: 70, y: 595, width: 180, height: 25 };

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
  const addLink = (area: typeof PAGE_LINK, text: string, action: string): string => {
    const rect = `${area.x} ${area.y} ${area.x + area.width} ${area.y + area.height}`;
    linkObjects.push(`<< /Type /Annot /Subtype /Link /Rect [${rect}] /Border [0 0 0] ${action} >>`);
    return `\nBT /F1 18 Tf ${area.x + 2} ${area.y + 5} Td (${text}) Tj ET`;
  };
  const annotations = pages.map(() => [] as string[]);
  pages.forEach((page, i) => {
    let content = `BT /F1 24 Tf 72 ${PAGE_HEIGHT - 72} Td (${page.text}) Tj ET`;
    if (page.pageLink) {
      // /Fit shows the whole target page
      content += addLink(PAGE_LINK, `Go to page ${page.pageLink}`, `/Dest [${pageObject(page.pageLink - 1)} 0 R /Fit]`);
      annotations[i].push(`${4 + 2 * pages.length + linkObjects.length - 1} 0 R`);
    }
    if (page.webLink) {
      content += addLink(WEB_LINK, "Open web page", `/A << /S /URI /URI (${page.webLink}) >>`);
      annotations[i].push(`${4 + 2 * pages.length + linkObjects.length - 1} 0 R`);
    }
    const annots = annotations[i].length > 0 ? ` /Annots [${annotations[i].join(" ")}]` : "";
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
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
  return createPdfPages([{ text }], paddingBytes);
}

const SMALL_PDF = createPdf("Small test PDF");
// over the limit of 10 MB, and clearly over 11 MB so that the prompt shows 11.1 MB
const LARGE_PDF = createPdf("Large test PDF", 11 * 1024 * 1024 + 2048);

const WEB_PAGE = "https://example.org/linked-from-pdf";
const LINKS_PDF = createPdfPages([
  { text: "Page 1", pageLink: 3, webLink: WEB_PAGE },
  { text: "Page 2" },
  { text: "Page 3" },
]);

function pdfVisualization(page: Page) {
  return page.locator("ch-pdf-visualization");
}

async function selectDataset(page: Page, datasetId: string) {
  await datasetNode(page, datasetId).click();
}

// the EmbedPDF viewer, its shadow root is open so that the locators find what's inside it
function viewer(page: Page) {
  return pdfVisualization(page).locator("embedpdf-container");
}

async function expectRendered(page: Page) {
  // the toolbar is shown when the viewer is ready, the image when a page is rendered
  await expect(viewer(page).getByRole("button", { name: "Zoom In" })).toBeVisible({ timeout: 30_000 });
  await expect(viewer(page).locator("img").first()).toBeVisible();
}

// click the middle of an area of the first page, given in pdf points from the bottom left corner
async function clickOnFirstPage(page: Page, area: typeof PAGE_LINK) {
  const firstPage = viewer(page).locator("img").first();
  // a click at a position doesn't scroll to it like a click on an element
  await firstPage.scrollIntoViewIfNeeded();
  const box = await firstPage.boundingBox();
  const scale = box.width / PAGE_WIDTH;
  await page.mouse.click(
    box.x + (area.x + area.width / 2) * scale,
    box.y + (PAGE_HEIGHT - area.y - area.height / 2) * scale,
  );
}

async function expectFailed(page: Page) {
  const visualization = pdfVisualization(page);
  await expect(visualization.getByText("Loading pdf file failed")).toBeVisible({ timeout: 30_000 });
  // the user can still try again or open the file in a new tab
  await expect(visualization.locator("ch-status").getByRole("button")).toHaveText(["Try again", "Open in new tab"]);
  await expect(visualization.locator("progress")).toHaveCount(0);
  await expect(viewer(page)).toHaveCount(0);
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
  await expect(viewer(page)).toHaveCount(0);

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

test("the viewer requests nothing from other sites", async ({ page, baseURL }) => {
  const datasetId = await createDataset(api, sessionId, { name: "small.pdf", x: 100, y: 100 }, SMALL_PDF);
  // fonts, stamps and the PDFium binary would come from Google Fonts and jsDelivr by default
  const otherSites: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.origin !== new URL(baseURL).origin) {
      otherSites.push(request.url());
    }
  });

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);
  // open the panels that load more of the viewer
  await viewer(page).getByRole("button", { name: "Sidebar" }).click();
  await viewer(page).getByRole("button", { name: "Document Menu" }).click();

  expect(otherSites).toEqual([]);
});

test("the viewer of the previous file is closed when another file is selected", async ({ page }) => {
  const firstId = await createDataset(api, sessionId, { name: "first.pdf", x: 100, y: 100 }, SMALL_PDF);
  const secondId = await createDataset(api, sessionId, { name: "second.pdf", x: 200, y: 100 }, createPdf("Second"));

  await openSession(page, sessionId, firstId);
  await selectDataset(page, firstId);
  await expectRendered(page);

  await selectDataset(page, secondId);
  await expectRendered(page);
  await expect(viewer(page)).toHaveCount(1);
});

test("the links in a pdf file go to their page or open their web page", async ({ page, context }) => {
  const datasetId = await createDataset(api, sessionId, { name: "links.pdf", x: 100, y: 100 }, LINKS_PDF);
  // the web page isn't loaded from the internet
  await context.route(WEB_PAGE, (route) => route.fulfill({ body: "linked page" }));

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);

  const popupPromise = page.waitForEvent("popup");
  await clickOnFirstPage(page, WEB_LINK);
  const popup = await popupPromise;
  expect(popup.url()).toBe(WEB_PAGE);
  await popup.close();

  await clickOnFirstPage(page, PAGE_LINK);
  // the number of the shown page, next to the buttons for the previous and the next page
  await expect(viewer(page).locator('input[pattern="[0-9]*"]')).toHaveValue("3");
});

test("the progress of the download is shown", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "large.pdf", x: 100, y: 100 }, LARGE_PDF);

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  // slow enough to see the download progressing, the file is about 11 MB
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: 4 * 1024 * 1024,
    uploadThroughput: -1,
  });
  await pdfVisualization(page).getByRole("button", { name: "Show here" }).click();

  const progress = pdfVisualization(page).locator("progress");
  await expect(progress).toHaveAttribute("max", String(LARGE_PDF.length));
  // somewhere between the start and the end
  await expect
    .poll(async () => {
      const value = Number(await progress.getAttribute("value"));
      return value > 0 && value < LARGE_PDF.length;
    })
    .toBe(true);
  await expectRendered(page);
});
