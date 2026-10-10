import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { Dataset } from "chipster-js-common";
import type { OnProgressParameters } from "pdfjs-dist/legacy/build/pdf.mjs";
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

  /*
   * The pdf viewer doesn't grow with its content, so it's given the height of
   * the pages it shows, which it tells when they are laid out.
   */
  height: number;

  loadedBytes: number;
  totalBytes: number;

  showAllButtonText: string;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;
  urlReady = false;

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
    // any positive value will do until the viewer tells the height of its pages, 0 would keep them from being rendered
    this.height = 500;
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

  pdfLoadComplete(pdf: { numPages: number }) {
    this.totalPages = pdf.numPages;
    this.state = new LoadState(State.Ready);
  }

  pdfLoadFailed(error: any) {
    this.urlReady = false;
    // keep the way out, so that the user doesn't have to select the file again
    this.state = new LoadState(State.Fail, "Loading pdf file failed", [this.tryAgainButton, this.openNewTabButton]);
    this.restErrorService.showError(this.state.message, error);
  }

  // pdf.js changes the page itself too, for example when a link in the pdf is clicked
  onPageChange(page: number) {
    this.page = page;
  }

  onProgress(progressData: OnProgressParameters) {
    this.loadedBytes = progressData.loaded;
    this.totalBytes = progressData.total;
  }

  previousPage() {
    if (this.page > 1) {
      this.page -= 1;
    } else {
      this.page = 1;
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page += 1;
    } else {
      this.page = this.totalPages;
    }
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
