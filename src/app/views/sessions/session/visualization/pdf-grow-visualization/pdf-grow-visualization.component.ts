// TEMPORARY: a copy of the pdf visualization whose viewer grows with its pages, to compare with the one that fills
// the visualization panel. Remove this folder, its tab, its entry in VisualizationConstants and in the module.

import { Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State, StatusButton } from "../../../../../model/loadstate";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";
import { SessionDataService } from "../../session-data.service";
import { PdfViewer, PdfGrowViewerService } from "./pdf-grow-viewer.service";

// actions of the status buttons
enum ButtonAction {
  ShowHere = "showHere",
  OpenNewTab = "openNewTab",
}

@Component({
  selector: "ch-pdf-grow-visualization",
  templateUrl: "./pdf-grow-visualization.component.html",
  styleUrls: ["./pdf-grow-visualization.component.less"],
})
export class PdfGrowVisualizationComponent implements OnChanges, OnDestroy {
  @Input()
  dataset: Dataset;

  // the viewer is created in this element, so that it can load while the status is shown
  @ViewChild("viewerContainer", { static: true })
  viewerContainer: ElementRef<HTMLElement>;

  private viewer: PdfViewer | undefined;

  loadedBytes = 0;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  // large pdf files may take a long time to render or even freeze the browser
  private readonly autoShowLimit = 10 * 1024 * 1024;
  private readonly showHereButton: StatusButton = { text: "Show here", action: ButtonAction.ShowHere };
  private readonly tryAgainButton: StatusButton = { text: "Try again", action: ButtonAction.ShowHere };
  private readonly openNewTabButton: StatusButton = { text: "Open in new tab", action: ButtonAction.OpenNewTab };

  constructor(
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService,
    private bytesPipe: BytesPipe,
    private pdfViewerService: PdfGrowViewerService,
  ) {}

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next(null);
    this.closeViewer();

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

  // close the shown file, or the failed attempt when trying again
  private closeViewer() {
    this.viewer?.close();
    this.viewer = undefined;
  }

  private load() {
    this.closeViewer();
    this.loadedBytes = 0;
    this.state = new LoadState(State.Loading, "Loading pdf file...");
    this.sessionDataService
      .getDatasetUrl(this.dataset)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (url) => this.openViewer(url),
        error: (error: any) => this.pdfLoadFailed(error),
      });
  }

  private openViewer(url: string) {
    const viewer = this.pdfViewerService.open(
      this.viewerContainer.nativeElement,
      url,
      this.dataset.name,
      (loadedBytes) => {
        if (this.viewer === viewer) {
          this.loadedBytes = loadedBytes;
        }
      },
    );
    this.viewer = viewer;
    viewer.loaded.then(
      () => {
        // unless another file was selected or the user tried again meanwhile
        if (this.viewer === viewer) {
          this.state = new LoadState(State.Ready);
        }
      },
      (error) => {
        if (this.viewer === viewer) {
          this.pdfLoadFailed(error);
        }
      },
    );
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
    this.closeViewer();
  }

  private pdfLoadFailed(error: any) {
    this.closeViewer();
    // keep the way out, so that the user doesn't have to select the file again
    this.state = new LoadState(State.Fail, "Loading pdf file failed", [this.tryAgainButton, this.openNewTabButton]);
    this.restErrorService.showError(this.state.message, error);
  }
}
