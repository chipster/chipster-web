import { Component, Input, OnChanges, OnDestroy, ViewChild } from "@angular/core";
import { Dataset } from "chipster-js-common";
import type { PdfViewerComponent } from "ng2-pdf-viewer";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State, StatusButton } from "../../../../../model/loadstate";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { SessionDataService } from "../../session-data.service";

// actions of the status buttons
enum ButtonAction {
  ShowHere = "showHere",
  OpenNewTab = "openNewTab",
}

@Component({
  selector: "ch-pdf-visualization",
  templateUrl: "./pdf-visualization.component.html",
  styleUrls: ["./pdf-visualization.component.less"],
})
export class PdfVisualizationComponent implements OnChanges, OnDestroy {
  @Input()
  dataset: Dataset;

  src: string;

  page: number;
  totalPages;
  zoom: number;
  showAll = false;

  /* any positive value will do, the height of the component will be fixed
  after the page is rendered. Cannot be 0, otherwise page won't be rendered. */
  height = 500;

  // the pdf.js viewer inside it knows the size of each page. Found by the template
  // reference, so that only the type is imported, without pdf.js itself.
  @ViewChild("pdfViewer")
  pdfViewerComponent: PdfViewerComponent;

  loadedBytes: number;
  totalBytes: number;

  showAllButtonText: string;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;
  urlReady = false;

  // pdf.js puts a 10px bottom margin under each page when the page borders are removed
  private readonly pageMargin = 10;
  private readonly showAllPagesText: string = "Show all pages";
  private readonly showSinglePagesText: string = "Show single page";
  public readonly minZoom: number = 0.1;
  public readonly maxZoom: number = 4.0;
  // large pdf files may take a long time to render or even freeze the browser
  private readonly autoShowLimit = 10 * 1024 * 1024;
  private readonly showHereButton: StatusButton = { text: "Show here", action: ButtonAction.ShowHere };
  private readonly tryAgainButton: StatusButton = { text: "Try again", action: ButtonAction.ShowHere };
  private readonly openNewTabButton: StatusButton = { text: "Open in new tab", action: ButtonAction.OpenNewTab };

  constructor(
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService,
    private bytesPipe: BytesPipe,
  ) {}

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next(null);
    this.resetLoad();

    this.page = 1;
    this.zoom = 1;
    this.showAll = false;
    this.setShowAllButtonText();

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    // ask before showing large files
    if (this.dataset.size > this.autoShowLimit) {
      // the size is rounded up, so that it's never shown below the limit
      this.state = new LoadState(
        State.TooLarge,
        "This PDF is larger than " +
          this.bytesPipe.transform(this.autoShowLimit, 0) +
          " (" +
          this.bytesPipe.transform(this.dataset.size, 1, true) +
          "). Showing it here may be slow or make the page unresponsive. Opening it in a new tab is recommended.",
        [this.showHereButton, this.openNewTabButton],
      );
      return;
    }

    this.load();
  }

  onStatusButton(action: string) {
    if (action === ButtonAction.ShowHere) {
      // only from the states that show the button, so that a second click
      // before the button disappears doesn't start a second load
      if (this.state.isTooLarge() || this.state.isFail()) {
        this.load();
      }
    } else if (action === ButtonAction.OpenNewTab) {
      this.sessionDataService.openNewTab(this.dataset);
    }
  }

  // forget the loaded file, or the failed attempt when trying again
  private resetLoad() {
    this.urlReady = false;
    this.loadedBytes = 0;
    this.totalBytes = 0;
    this.totalPages = null;
  }

  private load() {
    this.resetLoad();
    this.state = new LoadState(State.Loading, "Loading pdf file...");
    this.sessionDataService
      .getDatasetUrl(this.dataset)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (url) => {
          this.src = url;
          this.urlReady = true;
        },
        error: (error: any) => this.pdfLoadFailed(error),
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }

  toggleShowAll() {
    this.showAll = !this.showAll;
    this.setShowAllButtonText();
  }

  pdfLoadComplete(pdf: any) {
    this.totalPages = pdf.numPages;
    this.state = new LoadState(State.Ready);
  }

  pdfLoadFailed(error: any) {
    this.urlReady = false;
    // keep the way out, so that the user doesn't have to select the file again
    this.state = new LoadState(State.Fail, "Loading pdf file failed", [this.tryAgainButton, this.openNewTabButton]);
    this.restErrorService.showError(this.state.message, error);
  }

  /*
   * The pdf-viewer element doesn't grow with its content, so its height is set
   * to the height of the pages it shows. The page views of pdf.js have the size
   * of each page at the current zoom, so that there's no need to ask the pdf for
   * the pages.
   *
   * The rendered page isn't necessarily the one that is shown: on a single
   * page, pdf.js renders also the next page in advance.
   */
  pageRendered() {
    this.updateHeight();
  }

  /*
   * Until pdf.js has fetched a page, its page view has the size of the first
   * page. pdf.js fetches all pages after the first one is rendered, and tells
   * when they are all there.
   */
  pagesLoaded() {
    this.updateHeight();
  }

  private updateHeight() {
    const viewer = this.pdfViewerComponent?.pdfViewer;
    if (!viewer || viewer.pagesCount === 0) {
      return;
    }
    if (this.showAll) {
      let totalHeight = 0;
      for (let i = 0; i < viewer.pagesCount; i++) {
        totalHeight += this.pageHeight(viewer.getPageView(i));
      }
      this.height = totalHeight;
    } else {
      const pageView = viewer.getPageView(this.page - 1);
      if (pageView) {
        this.height = this.pageHeight(pageView);
      }
    }
  }

  // pdf.js rounds the size of each page to whole pixels, so the sum of the exact sizes could be a few pixels short
  private pageHeight(pageView: { viewport: { height: number } }): number {
    return Math.round(pageView.viewport.height) + this.pageMargin;
  }

  // pdf.js changes the page itself too, for example when a link in the pdf is clicked
  onPageChange(page: number) {
    this.page = page;
    this.updateHeight();
  }

  onProgress(progressData: any) {
    this.loadedBytes = progressData.loaded;
    this.totalBytes = progressData.total;
  }

  // a page that was rendered in advance isn't rendered again, so the height is updated here too
  previousPage() {
    if (this.page > 1) {
      this.page -= 1;
    } else {
      this.page = 1;
    }
    this.updateHeight();
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page += 1;
    } else {
      this.page = this.totalPages;
    }
    this.updateHeight();
  }

  zoomIn() {
    this.zoom = this.zoom + 0.2 < this.maxZoom ? this.zoom + 0.2 : this.maxZoom;
  }

  zoomOut() {
    this.zoom = this.zoom - 0.2 > this.minZoom ? this.zoom - 0.2 : this.minZoom;
  }

  private setShowAllButtonText() {
    this.showAllButtonText = this.showAll ? this.showSinglePagesText : this.showAllPagesText;
  }
}
