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
  // a web page that this page links to
  webLink?: string;
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
    if (page.webLink) {
      const y = page.height - 130 - 40 * annotations.length;
      content += `\nBT /F1 18 Tf 72 ${y} Td (Open web page) Tj ET`;
      linkObjects.push(
        `<< /Type /Annot /Subtype /Link /Rect [70 ${y - 5} 250 ${y + 20}] /Border [0 0 0] ` +
          `/A << /S /URI /URI (${page.webLink}) >> >>`,
      );
      annotations.push(`${4 + 2 * pages.length + linkObjects.length - 1} 0 R`);
    }
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

const WEB_PAGE = "https://example.org/linked-from-pdf";
const WEB_LINK_PDF = createPdfPages([{ text: "Web link", width: 612, height: 792, webLink: WEB_PAGE }]);

// links between pages of different widths, so that the page that a link goes to doesn't fit the viewer like the first one
const WIDE_PAGE_LINKS_PDF = createPdfPages([
  { text: "Page 1, Letter portrait", width: 612, height: 792, links: [3] },
  { text: "Page 2, A5 portrait", width: 420, height: 595 },
  { text: "Page 3, A3 landscape", width: 1191, height: 842, links: [1] },
]);

// pages of different sizes, so that the height of the viewer has to follow them, and links between them
const MULTI_PAGE_PDF = createPdfPages([
  { text: "Page 1, Letter portrait", width: 612, height: 792, links: [5] },
  { text: "Page 2, A4 portrait", width: 595, height: 842 },
  { text: "Page 3, Letter landscape", width: 792, height: 612 },
  { text: "Page 4, A5 portrait", width: 420, height: 595 },
  { text: "Page 5, Legal portrait", width: 612, height: 1008, links: [1] },
  { text: "Page 6, A4 landscape", width: 842, height: 595 },
]);

/*
 * Playwright hides the scrollbars of Chromium by default. They are shown, like
 * on Linux and Windows, where they take space from the content. The other
 * options come from the project.
 */
test.use({
  launchOptions: async ({ launchOptions }, use) => use({ ...launchOptions, ignoreDefaultArgs: ["--hide-scrollbars"] }),
});

function pdfVisualization(page: Page) {
  return page.locator("ch-pdf-visualization");
}

function viewer(page: Page) {
  return pdfVisualization(page).locator("ch-pdf-viewer");
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
  await expect(viewer(page)).toHaveCount(0);
}

/*
 * The visible height of the viewer and the height of the pages it shows, as
 * laid out by pdf.js. Each page has a 10px bottom margin.
 */
async function viewerAndPageHeights(page: Page) {
  return viewer(page).evaluate((viewerElement) => {
    const shownPages = Array.from(viewerElement.querySelectorAll<HTMLElement>(".page")).filter(
      (pageDiv) => pageDiv.offsetParent !== null,
    );
    const container = viewerElement.querySelector<HTMLElement>(".pdf-viewer-container");
    return {
      // without the horizontal scrollbar, when there is one
      viewer: container.clientHeight,
      pages: shownPages.reduce((sum, pageDiv) => sum + pageDiv.getBoundingClientRect().height + 10, 0),
      shownPages: shownPages.length,
      // more than 0 when the pages don't fit, so that a part of them is cut off
      overflow: container.scrollHeight - container.clientHeight,
      // more than 0 when the pages are wider than the viewer, so that there's a horizontal scrollbar
      overflowX: container.scrollWidth - container.clientWidth,
      pageWidth: shownPages[0]?.getBoundingClientRect().width,
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
  // the stylesheet of pdf.js is loaded with it, this margin comes from it
  await expect(viewer(page).locator(".page").first()).toHaveCSS("margin-bottom", "10px");
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

test("the height follows the pages when switching between one and all pages", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "multipage.pdf", x: 100, y: 100 }, MULTI_PAGE_PDF);

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);
  const visualization = pdfVisualization(page);
  const onePage = await expectHeightFitsPages(page, 1);

  // the pages are rendered already when they are shown the second time
  for (let i = 0; i < 2; i++) {
    await visualization.getByTitle("Show all pages").click();
    await expect(visualization.getByText("All 6 pages")).toBeVisible();
    expect(await expectHeightFitsPages(page, 6)).toBeGreaterThan(onePage);

    await visualization.getByTitle("Show single page").click();
    await expect(visualization.getByText("Page 1 / 6")).toBeVisible();
    expect(await expectHeightFitsPages(page, 1)).toBe(onePage);
  }
});

test("zooming changes the size of the page and keeps the height fitting", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "small.pdf", x: 100, y: 100 }, SMALL_PDF);

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);
  const visualization = pdfVisualization(page);
  const original = await expectHeightFitsPages(page, 1);

  await visualization.getByTitle("Zoom out").click();
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.viewer)).toBeLessThan(original);
  await expectHeightFitsPages(page, 1);

  await visualization.getByTitle("Zoom in").click();
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.viewer)).toBe(original);

  // wider than the viewer, so that there's a horizontal scrollbar, which mustn't take space from the page
  await visualization.getByTitle("Zoom in").click();
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.overflowX)).toBeGreaterThan(0);
  await expectHeightFitsPages(page, 1);

  await visualization.getByTitle("Zoom out").click();
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.overflowX)).toBe(0);
  await expectHeightFitsPages(page, 1);
});

test("the scrollbar of a wide page doesn't take space from the pages when changing the page", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "multipage.pdf", x: 100, y: 100 }, MULTI_PAGE_PDF);

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);
  const visualization = pdfVisualization(page);
  await expectHeightFitsPages(page, 1);

  // the Letter page is wider than the viewer at this zoom, but the A5 page isn't
  await visualization.getByTitle("Zoom in").click();
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.overflowX)).toBeGreaterThan(0);
  await expectHeightFitsPages(page, 1);

  for (let pageNumber = 2; pageNumber <= 4; pageNumber++) {
    await visualization.getByTitle("Next page").click();
    await expect(visualization.getByText(`Page ${pageNumber} / 6`)).toBeVisible();
  }
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.overflowX)).toBe(0);
  await expectHeightFitsPages(page, 1);

  // back to a page that was rendered already
  await visualization.getByTitle("Previous page").click();
  await expect(visualization.getByText("Page 3 / 6")).toBeVisible();
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.overflowX)).toBeGreaterThan(0);
  await expectHeightFitsPages(page, 1);
});

test("the page follows the width of the viewer", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "small.pdf", x: 100, y: 100 }, SMALL_PDF);

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);
  const visualization = pdfVisualization(page);
  const original = await viewerAndPageHeights(page);
  expect(original.pageWidth).toBeGreaterThan(400);

  // the width of the visualization changes without a window resize, like when a panel next to it opens
  await visualization.evaluate((element) => {
    // the element is inline by default, so the width needs a block
    element.style.display = "block";
    element.style.width = "400px";
  });
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.pageWidth)).toBeLessThanOrEqual(400);
  expect(await expectHeightFitsPages(page, 1)).toBeLessThan(original.viewer);

  await visualization.evaluate((element) => {
    element.style.display = "";
    element.style.width = "";
  });
  await expect.poll(() => viewerAndPageHeights(page).then((heights) => heights.pageWidth)).toBe(original.pageWidth);
  expect(await expectHeightFitsPages(page, 1)).toBe(original.viewer);

  // when the width keeps going back and forth, like when a scrollbar of the panel comes and goes
  // with the height of the page, the page stays at the narrower width after the second return
  for (let i = 0; i < 3; i++) {
    for (const width of ["400px", ""]) {
      await visualization.evaluate((element, value) => {
        element.style.display = value ? "block" : "";
        element.style.width = value;
        // the viewer notices the width before the next frame
        return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, width);
    }
  }
  await page.waitForTimeout(500);
  expect((await viewerAndPageHeights(page)).pageWidth).toBeLessThanOrEqual(400);
});

test("a link to a web page opens it in a new tab", async ({ page, context }) => {
  const datasetId = await createDataset(api, sessionId, { name: "weblink.pdf", x: 100, y: 100 }, WEB_LINK_PDF);
  // the web page isn't loaded from the internet
  await context.route(WEB_PAGE, (route) => route.fulfill({ body: "linked page" }));

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);

  const link = viewer(page).locator(".linkAnnotation a");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  const popupPromise = page.waitForEvent("popup");
  await link.click();
  const popup = await popupPromise;
  expect(popup.url()).toBe(WEB_PAGE);
  await popup.close();
});

test("the viewer requests nothing from other sites", async ({ page, baseURL }) => {
  const datasetId = await createDataset(api, sessionId, { name: "small.pdf", x: 100, y: 100 }, SMALL_PDF);
  // the worker, the fonts and the other files of pdf.js are served by the app
  const otherSites: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith("http") && url.origin !== new URL(baseURL).origin) {
      otherSites.push(request.url());
    }
  });
  const pdfjsAssets: string[] = [];
  page.on("requestfinished", (request) => {
    if (request.url().includes("/assets/pdfjs/")) {
      pdfjsAssets.push(new URL(request.url()).pathname);
    }
  });

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);
  // the text of the pdf is selectable
  await expect(viewer(page).locator(".textLayer")).toContainText("Small test PDF");

  expect(otherSites).toEqual([]);
  expect(pdfjsAssets).toContain("/assets/pdfjs/pdf.worker.min.mjs");
});

test("the viewer of the previous file is closed when another file is selected", async ({ page }) => {
  const firstId = await createDataset(api, sessionId, { name: "first.pdf", x: 100, y: 100 }, SMALL_PDF);
  const secondId = await createDataset(api, sessionId, { name: "second.pdf", x: 200, y: 100 }, createPdf("Second"));
  const workers: string[] = [];
  page.on("worker", (worker) => workers.push(worker.url()));

  await openSession(page, sessionId, firstId);
  await selectDataset(page, firstId);
  await expectRendered(page);

  await selectDataset(page, secondId);
  await expectRendered(page);
  await expect(viewer(page)).toHaveCount(1);
  await expect(viewer(page).locator(".textLayer")).toContainText("Second");
  await expect(viewer(page).locator(".page")).toHaveCount(1);
  // the same worker of pdf.js reads both files
  expect(workers.filter((url) => url.includes("pdf.worker"))).toHaveLength(1);
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

test("the links in a pdf file work when all pages are shown", async ({ page }) => {
  const datasetId = await createDataset(api, sessionId, { name: "links.pdf", x: 100, y: 100 }, WIDE_PAGE_LINKS_PDF);
  // Angular reports its errors to the console, and the app shows them in a toast too
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await openSession(page, sessionId, datasetId);
  await selectDataset(page, datasetId);
  await expectRendered(page);
  const visualization = pdfVisualization(page);
  await visualization.getByTitle("Show all pages").click();
  await expect(visualization.getByText("All 3 pages")).toBeVisible();
  const allPages = await expectHeightFitsPages(page, 3);

  // to the wide page and back
  for (const link of [0, 1]) {
    await viewer(page).locator(".linkAnnotation a").nth(link).click();
    expect(await expectHeightFitsPages(page, 3)).toBe(allPages);
  }
  // the link on a single page goes to the wide page too
  await visualization.getByTitle("Show single page").click();
  await viewer(page).locator(".linkAnnotation a").click();
  await expect(visualization.getByText("Page 3 / 3")).toBeVisible();
  await expectHeightFitsPages(page, 1);

  expect(errors).toEqual([]);
});
