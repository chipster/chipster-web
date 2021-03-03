import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../../model/loadstate";
import { FileResource } from "../../../../../shared/resources/fileresource";
import { SessionDataService } from "../../session-data.service";
import { VisualizationModalService } from "../visualizationmodal.service";

@Component({
  selector: "ch-text-visualization",
  templateUrl: "./textvisualization.component.html",
  styles: [
    `
      pre {
        background-color: white;
      }
    `
  ],
  styleUrls: ["./textvisualization.component.less"]
})
export class TextVisualizationComponent implements OnChanges, OnDestroy {
  @Input() dataset: Dataset;
  @Input() showFullData: boolean;
  @Input() modalMode: boolean;

  public data: string;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  fileSizeLimit = 100 * 1024;

  constructor(
    private fileResource: FileResource,
    private sessionDataService: SessionDataService,
    private visualizationModalService: VisualizationModalService,
    private errorHandlerService: RestErrorService
  ) {}

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading data...");
    this.data = null;

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    const maxBytes = this.showFullData ? null : this.fileSizeLimit;

    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset, maxBytes)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (response: any) => {
          this.data = response;
          this.state = new LoadState(State.Ready);
        },
        (error: Response) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.errorHandlerService.showError(this.state.message, error);
        }
      );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  getSizeShown() {
    if (this.data) {
      return this.data.length;
    }
  }

  getSizeFull() {
    return this.dataset.size;
  }

  isCompleteFile() {
    return this.getSizeShown() === this.getSizeFull();
  }

  showAll() {
    this.visualizationModalService.openVisualizationModal(this.dataset, "text");
  }
}
