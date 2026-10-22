import {
  Component,
  ElementRef,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
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
// where pdf.js goes in the pdf: a page, and maybe a place in it
type ScrollTarget = Parameters<PDFViewer["scrollPageIntoView"]>[0];

interface Pdfjs {
  lib: PdfjsLib;
  viewer: PdfjsViewer;
}

// the worker, the stylesheet and the files that pdf.js loads when a pdf needs them, copied there in angular.json
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
 * started again for each file. A new one when the previous one is busy with
 * a file that was left, see clear().
 *
 * When a worker fails to start, pdf.js parses the files on the main thread
 * instead, and when that fails too, for example because the script couldn't
 * be downloaded, pdf.js keeps the failure until the page is reloaded, so a
 * new worker wouldn't help then.
 */
function getWorker(lib: PdfjsLib): PDFWorker {
  if (!sharedWorker || sharedWorker.destroyed) {
    sharedWorker = new lib.PDFWorker();
  }
  return sharedWorker;
}

/*
 * The top of the place in a page that a pdf destination gives, in the units of
 * the pdf, or null for the whole page. Like pdf.js finds it.
 */
function destinationTop(destArray: unknown[] | undefined): number | null {
  const name = (destArray?.[1] as { name?: string } | undefined)?.name;
  let top: unknown = null;
  if (name === "XYZ") {
    top = destArray[3];
  } else if (name === "FitH" || name === "FitBH") {
    top = destArray[2];
  } else if (name === "FitR") {
    top = destArray[5];
  }
  return typeof top === "number" ? top : null;
}

// the nearest ancestor that scrolls its content vertically
function scrollingAncestor(element: HTMLElement): HTMLElement | null {
  let ancestor = element.parentElement;
  while (ancestor && !/auto|scroll/.test(getComputedStyle(ancestor).overflowY)) {
    ancestor = ancestor.parentElement;
  }
  return ancestor;
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
  if (!stylesheetPromise) {
    stylesheetPromise = new Promise<void>((resolve, reject) => {
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
  }
  return stylesheetPromise;
}

/*
 * The viewer as the link service of pdf.js sees it, so that a link in the pdf
 * can bring its place into view also when all pages are shown. The link
 * service goes to each place through scrollPageIntoView(), and the buttons in
 * a pdf that go to the first or the last page set the current page, so those
 * are told to onTarget. pdf.js scrolls the viewer itself too, for example when
 * the scale changes, but not through the link service, and a link that goes
 * nowhere, for example to a destination that the pdf doesn't have, doesn't get
 * this far.
 *
 * The buttons that go to the next or the previous page aren't told: when all
 * pages are shown, the current page of pdf.js doesn't follow the scrolling of
 * the session view, so those would go to the wrong page.
 *
 * A proxy, because the viewer keeps its state in private fields, which only
 * the viewer itself can read, so its methods and properties are used on it.
 */
function linkViewer(pdfViewer: PDFViewer, onTarget: (target: ScrollTarget) => void): PDFViewer {
  return new Proxy(pdfViewer, {
    get(viewer, property) {
      if (property === "scrollPageIntoView") {
        return (target: ScrollTarget) => {
          viewer.scrollPageIntoView(target);
          onTarget(target);
        };
      }
      const value: unknown = Reflect.get(viewer, property);
      return typeof value === "function" ? value.bind(viewer) : value;
    },
    set(viewer, property, value) {
      const isSet = Reflect.set(viewer, property, value);
      // not for a page that the pdf doesn't have
      if (property === "currentPageNumber" && viewer.currentPageNumber === value) {
        onTarget({ pageNumber: value });
      }
      return isSet;
    },
  });
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
 * A link in the pdf scrolls the panel itself, see scrollToTarget().
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
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PdfViewerComponent implements OnChanges, OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private ngZone = inject(NgZone);

  readonly src = input<string>(undefined);
  // the page shown when not all pages are shown, starting from 1
  readonly page = input(1);
  // relative to the size of the page, or to the width of the viewer when the page doesn't fit
  readonly zoom = input(1);
  readonly showAll = input(false);

  readonly loaded = output<PDFDocumentProxy>();
  readonly loadFailed = output<unknown>();
  readonly loadProgress = output<OnProgressParameters>();
  // the height of the shown pages with their margins, as pdf.js lays them out, whenever it changes
  readonly heightChange = output<number>();
  // pdf.js changes the page itself too, for example when a link in the pdf is clicked
  readonly pageChange = output<number>();

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
  // the worker of the current file
  private worker: PDFWorker;
  // the current file is still being loaded
  private loading = false;
  private pendingProgress: OnProgressParameters;
  private progressTimeout: ReturnType<typeof setTimeout>;
  private destroyed = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes.src) {
      this.load(this.src());
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
      const page = this.page();
      if (changes.page && page !== this.pdfViewer.currentPageNumber) {
        this.pdfViewer.currentPageNumber = page;
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
        if (this.destroyed || src !== this.src()) {
          return null;
        }
        this.pdfViewer ??= this.createViewer();
        this.worker = getWorker(this.pdfjs.lib);
        const task = this.pdfjs.lib.getDocument({
          url: src,
          worker: this.worker,
          cMapUrl: assetUrl("cmaps/"),
          iccUrl: assetUrl("iccs/"),
          standardFontDataUrl: assetUrl("standard_fonts/"),
          wasmUrl: assetUrl("wasm/"),
        });
        // right away, so that clear() can cancel it
        this.loadingTask = task;
        this.loading = true;
        task.onProgress = (progress: OnProgressParameters) => this.emitProgress(task, progress);
        return task;
      } catch (error) {
        // not for a file that is gone already
        if (!this.destroyed && src === this.src()) {
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
        this.loading = false;
        this.emit(this.loadFailed, error);
      }
      return;
    }
    if (loadingTask !== this.loadingTask) {
      return;
    }
    this.loading = false;
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
    this.linkService = new viewer.PDFLinkService({
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
    this.linkService.setViewer(linkViewer(pdfViewer, (target) => this.scrollToTarget(target)));

    // the page views are created, but nothing is rendered yet
    eventBus.on(
      "pagesinit",
      () => {
        this.updateScrollMode();
        this.pdfViewer.currentPageNumber = this.page();
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
        if (pageNumber !== this.page()) {
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
   * above). The panel around the viewer is scrolled to the place that the link
   * gives then, or to the top of the page. On a single page, the page itself
   * changes.
   */
  private scrollToTarget({ pageNumber, destArray }: ScrollTarget) {
    const pageView = this.showAll() ? this.pdfViewer.getPageView(pageNumber - 1) : null;
    if (!pageView) {
      return;
    }
    const top = destinationTop(destArray);
    // from the top of the page, in the size that the page is shown
    const offset = top === null ? 0 : Math.max(0, pageView.viewport.convertToViewportPoint(0, top)[1]);
    const panel = scrollingAncestor(pageView.div);
    if (!panel) {
      pageView.div.scrollIntoView({ block: "start" });
      return;
    }
    const pageTop = pageView.div.getBoundingClientRect().top - panel.getBoundingClientRect().top - panel.clientTop;
    panel.scrollTop += pageTop + offset;
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
    this.pdfViewer.scrollMode = this.showAll() ? ScrollMode.VERTICAL : ScrollMode.PAGE;
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
    const pageIndexes = this.showAll()
      ? Array.from({ length: this.pdfViewer.pagesCount }, (_, index) => index)
      : [this.pdfViewer.currentPageNumber - 1];
    let pageWidth = 0;
    for (const index of pageIndexes) {
      const { viewport } = this.pdfViewer.getPageView(index);
      // the width at the scale 1
      pageWidth = Math.max(pageWidth, viewport.clone({ scale: this.pdfjs.lib.PixelsPerInch.PDF_TO_CSS_UNITS }).width);
    }
    this.ngZone.runOutsideAngular(() => {
      this.pdfViewer.currentScale = this.zoom() * Math.min(1, viewerWidth / pageWidth);
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
    // the same margin under each page, from the stylesheet of pdf.js
    const margin = pages.length > 0 ? parseFloat(getComputedStyle(pages[0]).marginBottom) : 0;
    let height = 0;
    for (const page of pages) {
      height += page.getBoundingClientRect().height + margin;
    }
    if (height > 0 && height !== this.pagesHeight) {
      this.pagesHeight = height;
      this.emit(this.heightChange, height);
    }
  }

  // forget the previous file
  private clear() {
    const loadingTask = this.loadingTask;
    const worker = this.worker;
    const workerBusy = loadingTask && this.isWorkerBusy();
    this.loadingTask = null;
    this.worker = null;
    this.loading = false;
    this.pagesHeight = 0;
    clearTimeout(this.progressTimeout);
    this.progressTimeout = null;
    this.pendingProgress = null;
    // closes the document, but doesn't stop the shared worker
    const closed = loadingTask?.destroy();
    /*
     * A busy worker would go on with what it was doing for this file, which
     * could take long for a large file or a page with large images, and the
     * next file would have to wait, so the next file gets a new worker. This
     * one is stopped only after pdf.js has closed the document, because pdf.js
     * cancels the download and removes the fonts of the file only when the
     * worker has answered that it has closed the document.
     */
    if (workerBusy && worker === sharedWorker) {
      sharedWorker = undefined;
      const stop = () => worker.destroy();
      closed.then(stop, stop);
    }
    this.ngZone.runOutsideAngular(() => {
      this.pdfViewer?.setDocument(null);
      this.linkService?.setDocument(null);
    });
  }

  // the file is still being loaded, or a page is being rendered, which the worker prepares
  private isWorkerBusy(): boolean {
    if (this.loading) {
      return true;
    }
    if (!this.pdfViewer?.pdfDocument) {
      return false;
    }
    const { RenderingStates } = this.pdfjs.viewer;
    for (let i = 0; i < this.pdfViewer.pagesCount; i++) {
      if (this.pdfViewer.getPageView(i).renderingState === RenderingStates.RUNNING) {
        return true;
      }
    }
    return false;
  }

  /*
   * The chunks of the download come faster than the progress is worth showing,
   * so the latest is told ten times a second at most. Not for a file that is
   * gone, and not after the file is loaded, when pdf.js may still download the
   * rest of it, but the progress isn't shown anymore. A timer rather than a
   * frame, so that it goes on in a background tab.
   */
  private emitProgress(loadingTask: PDFDocumentLoadingTask, progress: OnProgressParameters) {
    this.pendingProgress = progress;
    this.progressTimeout ??= setTimeout(() => {
      this.progressTimeout = null;
      if (loadingTask === this.loadingTask && this.loading && this.pendingProgress) {
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
