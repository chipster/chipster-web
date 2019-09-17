import { takeUntil } from "rxjs/operators";
import { Component, OnChanges, Input, OnDestroy } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { SessionDataService } from "../../session-data.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { Subject } from "rxjs";
import { LoadState, State } from "../../../../../model/loadstate";

@Component({
  selector: "ch-pdf-visualization",
  templateUrl: "./pdf-visualization.component.html",
  styleUrls: ["./pdf-visualization.component.less"]
})
export class PdfVisualizationComponent implements OnChanges, OnDestroy {
  @Input()
  dataset: Dataset;

  src: string;

  page: number;
  totalPages;
  zoom: number;
  showAll = false;

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

  constructor(
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService
  ) {}

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading pdf file...");
    this.urlReady = false;
    this.loadedBytes = 0;
    this.totalBytes = 0;

    this.page = 1;
    this.totalPages = null;
    this.zoom = 1;
    this.showAll = false;
    this.setShowAllButtonText();

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    this.sessionDataService
      .getDatasetUrl(this.dataset)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        url => {
          this.src = url;
          this.urlReady = true;
        },
        (error: any) => {
          this.state = new LoadState(State.Loading, "Loading pdf file failed");
          this.restErrorService.showError(this.state.message, error);
        }
      );
  }

  openNewTab() {
    this.sessionDataService.openNewTab(this.dataset);
  }

  ngOnDestroy() {
    this.unsubscribe.next();
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

  onProgress(progressData: any) {
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
    this.showAllButtonText = this.showAll
      ? this.showSinglePagesText
      : this.showAllPagesText;
  }
}
