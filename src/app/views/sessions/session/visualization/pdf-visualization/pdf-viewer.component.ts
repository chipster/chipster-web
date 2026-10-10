import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import type {
  OnProgressParameters,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFWorker,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFViewer } from "pdfjs-dist/legacy/web/pdf_viewer.mjs";

type PdfjsLib = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
type PdfjsViewer = typeof import("pdfjs-dist/legacy/web/pdf_viewer.mjs");

interface Pdfjs {
  lib: PdfjsLib;
  viewer: PdfjsViewer;
}

// the worker, the stylesheet and the files that pdf.js loads when a pdf needs them, copied to the assets in angular.json
const pdfjsAssets = "assets/pdfjs/";

let pdfjsPromise: Promise<Pdfjs>;
let stylesheetPromise: Promise<void>;
let sharedWorker: PDFWorker;

/*
 * pdf.js is loaded only when a pdf file is shown, its stylesheet too, so that
 * the other views don't get it. The legacy build has the polyfills for the
 * browsers that don't have the newest JavaScript features. The viewer finds
 * the library from globalThis.pdfjsLib, so the library has to be loaded first.
 */
function loadPdfjs(): Promise<Pdfjs> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const lib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      // the version keeps a cached worker or stylesheet of another version from being used
      const version = "?v=" + lib.version;
      lib.GlobalWorkerOptions.workerSrc = assetUrl("pdf.worker.min.mjs") + version;
      const [viewer] = await Promise.all([
        import("pdfjs-dist/legacy/web/pdf_viewer.mjs"),
        loadStylesheet(assetUrl("pdf_viewer.css") + version),
      ]);
      return { lib, viewer };
    })();
    // try again next time, for example when the chunk failed to download
    pdfjsPromise.catch(() => {
      pdfjsPromise = undefined;
    });
  }
  return pdfjsPromise;
}

/*
 * One worker for all pdf files, so that its script isn't downloaded and
 * started again for each file.
 *
 * When the worker fails to start, pdf.js parses the files on the main thread
 * instead, until the page is reloaded. Only when that fails too, for example
 * because the script couldn't be downloaded at all, the worker fails, and it
 * would fail every file after it, so the next file gets a new one.
 */
function getWorker(lib: PdfjsLib): PDFWorker {
  if (!sharedWorker || sharedWorker.destroyed) {
    const worker = new lib.PDFWorker();
    worker.promise.catch(() => {
      worker.destroy();
      if (sharedWorker === worker) {
        sharedWorker = undefined;
      }
    });
    sharedWorker = worker;
  }
  return sharedWorker;
}

// relative to the app, not to the address of the current view
function assetUrl(path: string): string {
  return new URL(pdfjsAssets + path, document.baseURI).href;
}

/*
 * The images of the stylesheet are next to it in the assets. Loaded once,
 * also when loading the viewer failed after it and is tried again, but again
 * when the stylesheet itself failed.
 */
function loadStylesheet(href: string): Promise<void> {
  stylesheetPromise ??= new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => {
      link.remove();
      reject(new Error("Loading the stylesheet " + href + " failed"));
    };
    document.head.append(link);
  });
  stylesheetPromise.catch(() => {
    stylesheetPromise = undefined;
  });
  return stylesheetPromise;
}

/*
 * Shows a pdf file with the viewer of pdf.js, either one page at a time or all
 * pages at once.
 *
 * pdf.js requires an absolutely positioned container, so this element doesn't
 * grow with the pages and its height has to be set from outside. The height of
 * the pages is told with heightChange.
 *
 * pdf.js scrolls to the current page after each change of the scale or the
 * page. The container has nothing to scroll, so pdf.js goes on to the nearest
 * positioned ancestor that has, and none of them may have (now the search ends
 * without one), or the panel around the visualization would jump on each zoom.
 * A link in the pdf scrolls the panel itself, see scrollToCurrentPage().
 */
@Component({
  selector: "ch-pdf-viewer",
  template: `
    <div #container class="pdf-viewer-container">
      <div #viewer class="pdfViewer"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        /* the height given from outside is for the pages, the padding below them is for the scrollbar */
        box-sizing: content-box;
      }

      .pdf-viewer-container {
        position: absolute;
        inset: 0;
        overflow-x: auto;
        /* the height fits the pages, so there's nothing to scroll vertically. A horizontal
        scrollbar would otherwise take its space from the pages and bring a vertical one. */
        overflow-y: hidden;
      }
    `,
  ],
})
export class PdfViewerComponent implements OnChanges, OnDestroy {
  @Input() src: string;
  // the page shown when not all pages are shown, starting from 1
  @Input() page = 1;
  // relative to the size of the page, or to the width of the viewer when the page doesn't fit
  @Input() zoom = 1;
  @Input() showAll = false;

  @Output() loaded = new EventEmitter<PDFDocumentProxy>();
  @Output() loadFailed = new EventEmitter<unknown>();
  @Output() loadProgress = new EventEmitter<OnProgressParameters>();
  // the height of the shown pages with their margins, as pdf.js lays them out, whenever it changes
  @Output() heightChange = new EventEmitter<number>();
  // pdf.js changes the page itself too, for example when a link in the pdf is clicked
  @Output() pageChange = new EventEmitter<number>();

  @ViewChild("container", { static: true })
  container: ElementRef<HTMLDivElement>;

  // pdf.js puts the shown pages in it
  @ViewChild("viewer", { static: true })
  viewerElement: ElementRef<HTMLDivElement>;

  pdfViewer: PDFViewer;

  private pdfjs: Pdfjs;
  private linkService: InstanceType<PdfjsViewer["PDFLinkService"]>;
  private loadingTask: PDFDocumentLoadingTask;
  // stops the listeners of the viewer
  private abortController = new AbortController();
  private resizeObserver: ResizeObserver;
  private hostWidth: number;
  private hostHeight: number;
  private scaleFrame: number;
  private pagesHeight = 0;
  private pendingProgress: OnProgressParameters;
  private progressTimeout: ReturnType<typeof setTimeout>;
  private destroyed = false;

  constructor(
    private host: ElementRef<HTMLElement>,
    private ngZone: NgZone,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.src) {
      this.load(this.src);
      return;
    }
    // pdf.js has the document before its pages, and the pages get these when they are ready
    if (!this.pdfViewer || this.pdfViewer.pagesCount === 0) {
      return;
    }
    // pdf.js starts rendering, which mustn't run the change detection
    this.ngZone.runOutsideAngular(() => {
      if (changes.showAll) {
        this.updateScrollMode();
      }
      if (changes.page && this.page !== this.pdfViewer.currentPageNumber) {
        this.pdfViewer.currentPageNumber = this.page;
      }
    });
    this.updateScale();
  }

  ngOnDestroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.scaleFrame);
    this.clear();
    this.abortController.abort();
    this.resizeObserver?.disconnect();
  }

  private async load(src: string) {
    this.clear();
    const loadingTask = await this.ngZone.runOutsideAngular(async () => {
      try {
        this.pdfjs ??= await loadPdfjs();
        if (this.destroyed || src !== this.src) {
          return null;
        }
        this.pdfViewer ??= this.createViewer();
        const task = this.pdfjs.lib.getDocument({
          url: src,
          worker: getWorker(this.pdfjs.lib),
          cMapUrl: assetUrl("cmaps/"),
          iccUrl: assetUrl("iccs/"),
          standardFontDataUrl: assetUrl("standard_fonts/"),
          wasmUrl: assetUrl("wasm/"),
        });
        // right away, so that clear() can cancel it
        this.loadingTask = task;
        task.onProgress = (progress: OnProgressParameters) => this.emitProgress(task, progress);
        return task;
      } catch (error) {
        // not for a file that is gone already
        if (!this.destroyed && src === this.src) {
          this.emit(this.loadFailed, error);
        }
        return null;
      }
    });
    if (!loadingTask || loadingTask !== this.loadingTask) {
      return;
    }
    let pdf: PDFDocumentProxy;
    try {
      pdf = await loadingTask.promise;
    } catch (error) {
      // a task that was cancelled by another file or by closing the viewer fails too
      if (loadingTask === this.loadingTask) {
        this.emit(this.loadFailed, error);
      }
      return;
    }
    if (loadingTask !== this.loadingTask) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.linkService.setDocument(pdf);
      this.pdfViewer.setDocument(pdf);
    });
    this.emit(this.loaded, pdf);
  }

  private createViewer(): PDFViewer {
    const { lib, viewer } = this.pdfjs;
    const signal = this.abortController.signal;
    const eventBus = new viewer.EventBus();
    const scrollToCurrentPage = () => this.scrollToCurrentPage();
    // a link in the pdf brings its page into view also when all pages are shown
    class LinkService extends viewer.PDFLinkService {
      override async goToDestination(dest: string | unknown[]) {
        await super.goToDestination(dest);
        scrollToCurrentPage();
      }

      override goToPage(val: number | string) {
        super.goToPage(val);
        scrollToCurrentPage();
      }

      override goToXY(pageNumber: number, x: number, y: number, options?: object) {
        super.goToXY(pageNumber, x, y, options);
        scrollToCurrentPage();
      }

      // for the buttons in a pdf that go to the next, previous, first or last page
      override executeNamedAction(action: string) {
        super.executeNamedAction(action);
        scrollToCurrentPage();
      }
    }
    this.linkService = new LinkService({
      eventBus,
      externalLinkTarget: viewer.LinkTarget.BLANK,
      // the zoom of the toolbar stays, so that a link in the pdf only changes the page
      ignoreDestinationZoom: true,
    });
    // the abortSignal is missing from the type declarations of pdf.js
    const options: ConstructorParameters<PdfjsViewer["PDFViewer"]>[0] & { abortSignal: AbortSignal } = {
      container: this.container.nativeElement,
      eventBus,
      linkService: this.linkService,
      // a 10px margin under each page instead of the borders
      removePageBorders: true,
      // no tools for editing the pdf
      annotationEditorMode: lib.AnnotationEditorType.DISABLE,
      imageResourcesPath: assetUrl("images/"),
      abortSignal: signal,
    };
    const pdfViewer = new viewer.PDFViewer(options);
    this.linkService.setViewer(pdfViewer);

    // the page views are created, but nothing is rendered yet
    eventBus.on(
      "pagesinit",
      () => {
        this.updateScrollMode();
        this.pdfViewer.currentPageNumber = this.page;
        this.updateScale();
      },
      { signal },
    );
    // until then, the other pages have the size of the first page
    eventBus.on("pagesloaded", () => this.updateScale(), { signal });
    // a page that pdf.js fetches only for rendering it gets its own size then
    // once per frame, because pdf.js may render many pages in a row
    eventBus.on(
      "pagerendered",
      () => {
        this.scaleFrame ??= requestAnimationFrame(() => {
          this.scaleFrame = null;
          if (!this.destroyed) {
            this.updateScale();
          }
        });
      },
      { signal },
    );
    eventBus.on(
      "pagechanging",
      ({ pageNumber }) => {
        if (pageNumber !== this.page) {
          this.emit(this.pageChange, pageNumber);
        }
      },
      { signal },
    );
    // the width changes also without a window resize, for example when a panel next to the viewer is opened
    this.ngZone.runOutsideAngular(() => {
      /*
       * The height of the pages mustn't change the width, or this could go back
       * and forth: the session view keeps the space of its scrollbar for that.
       */
      this.resizeObserver = new ResizeObserver(() => {
        const width = this.measureWidth();
        if (width !== this.hostWidth) {
          this.hostWidth = width;
          this.updateScale();
        }
        /*
         * The height follows the pages, so it doesn't change the scale. But
         * pdf.js renders only the pages that fit in the container, and decides
         * that when the pages change, before the height is given to this
         * element, so it has to look again when all pages are shown.
         */
        const height = this.host.nativeElement.clientHeight;
        if (height !== this.hostHeight) {
          this.hostHeight = height;
          if (this.pdfViewer.pagesCount > 0) {
            this.pdfViewer.update();
          }
        }
      });
      this.resizeObserver.observe(this.host.nativeElement);
    });

    return pdfViewer;
  }

  /*
   * When all pages are shown, pdf.js changes only the current page for a link
   * in the pdf, because it doesn't scroll the ancestors of the viewer (see
   * above). The browser scrolls the panel around the viewer to the page then.
   * On a single page, the page itself changes.
   */
  private scrollToCurrentPage() {
    if (this.showAll) {
      this.pdfViewer.getPageView(this.pdfViewer.currentPageNumber - 1)?.div.scrollIntoView({ block: "start" });
    }
  }

  /*
   * The width of this element, because a scrollbar of the container would
   * take from its width. Rounded down, because clientWidth could be rounded
   * up from a fraction, and a page that wide wouldn't fit.
   */
  private measureWidth(): number {
    return Math.floor(this.host.nativeElement.getBoundingClientRect().width);
  }

  private updateScrollMode() {
    const { ScrollMode } = this.pdfjs.viewer;
    this.pdfViewer.scrollMode = this.showAll ? ScrollMode.VERTICAL : ScrollMode.PAGE;
  }

  /*
   * A page is shown in its own size at zoom 1, unless it's wider than the
   * viewer. Then it's scaled to the width of the viewer, and the zoom is
   * relative to that.
   *
   * When all pages are shown, they all have the same scale, so that the widest
   * page fits. The current page isn't used then, because pdf.js changes it
   * when the scale changes the pages that fit in the viewer.
   */
  private updateScale() {
    const viewerWidth = this.hostWidth ?? this.measureWidth();
    if (!this.pdfViewer?.pdfDocument || this.pdfViewer.pagesCount === 0 || viewerWidth === 0) {
      return;
    }
    const pageIndexes = this.showAll
      ? Array.from({ length: this.pdfViewer.pagesCount }, (_, index) => index)
      : [this.pdfViewer.currentPageNumber - 1];
    let pageWidth = 0;
    for (const index of pageIndexes) {
      const { viewport } = this.pdfViewer.getPageView(index);
      // the width at the scale 1
      pageWidth = Math.max(pageWidth, viewport.clone({ scale: this.pdfjs.lib.PixelsPerInch.PDF_TO_CSS_UNITS }).width);
    }
    this.ngZone.runOutsideAngular(() => {
      this.pdfViewer.currentScale = this.zoom * Math.min(1, viewerWidth / pageWidth);
    });
    this.updateLayout();
  }

  /*
   * pdf.js sizes the pages right away when the scale or the shown page
   * changes, so this is called after each of them.
   *
   * The height of this element is the height of the pages, so a horizontal
   * scrollbar, which appears when the pages are zoomed wider than the viewer,
   * would take its space from the pages. The padding makes room for it below
   * the pages. It's 0 for the scrollbars that are drawn over the content.
   */
  private updateLayout() {
    const container = this.container.nativeElement;
    // only a horizontal scrollbar, because the vertical one is hidden
    const padding = container.offsetHeight - container.clientHeight + "px";
    const host = this.host.nativeElement;
    if (host.style.paddingBottom !== padding) {
      host.style.paddingBottom = padding;
    }

    // the shown pages: on a single page, pdf.js keeps only that page here
    const pages = Array.from(this.viewerElement.nativeElement.querySelectorAll<HTMLElement>(":scope > .page"));
    let height = 0;
    for (const page of pages) {
      height += page.getBoundingClientRect().height + parseFloat(getComputedStyle(page).marginBottom);
    }
    if (height > 0 && height !== this.pagesHeight) {
      this.pagesHeight = height;
      this.emit(this.heightChange, height);
    }
  }

  // forget the previous file
  private clear() {
    const loadingTask = this.loadingTask;
    this.loadingTask = null;
    this.pagesHeight = 0;
    clearTimeout(this.progressTimeout);
    this.progressTimeout = null;
    this.pendingProgress = null;
    // destroys also the document, but not the shared worker
    loadingTask?.destroy();
    this.ngZone.runOutsideAngular(() => {
      this.pdfViewer?.setDocument(null);
      this.linkService?.setDocument(null);
    });
  }

  /*
   * The chunks of the download come faster than the progress is worth showing,
   * so the latest is told ten times a second at most, and not for a file that
   * is gone. A timer rather than a frame, so that it goes on in a background tab.
   */
  private emitProgress(loadingTask: PDFDocumentLoadingTask, progress: OnProgressParameters) {
    this.pendingProgress = progress;
    this.progressTimeout ??= setTimeout(() => {
      this.progressTimeout = null;
      if (loadingTask === this.loadingTask && this.pendingProgress) {
        this.emit(this.loadProgress, this.pendingProgress);
      }
    }, 100);
  }

  /*
   * pdf.js runs outside of Angular, so that its rendering doesn't run the
   * change detection. Its events are passed on only after pdf.js has finished
   * what it was doing, because the change detection that follows gives new
   * inputs to pdf.js. For example, a link in the pdf changes the page before
   * pdf.js shows it, and a new scale at that point would go back to the
   * previous page. An event can come also while Angular gives the inputs,
   * and the parent can't change its view in the middle of that.
   */
  private emit<T>(emitter: EventEmitter<T>, value: T) {
    queueMicrotask(() => {
      if (!this.destroyed) {
        this.ngZone.run(() => emitter.emit(value));
      }
    });
  }
}
