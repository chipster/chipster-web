import { Component, OnChanges, OnDestroy, ChangeDetectionStrategy, inject, input } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { LoadState, State } from "../../../../../model/loadstate";
import { FileResource } from "../../../../../shared/resources/fileresource";
import { SessionDataService } from "../../session-data.service";
import { VisualizationModalService } from "../visualizationmodal.service";
import { LinkButtonComponent } from "../../link-button/link-button.component";
import { StatusComponent } from "../../../../../shared/components/status.component";
import { BytesPipe } from "../../../../../shared/pipes/bytes.pipe";

@Component({
  selector: "ch-text-visualization",
  templateUrl: "./text-visualization.component.html",
  styles: [
    `
      pre {
        background-color: white;
      }
    `,
  ],
  styleUrls: ["./text-visualization.component.less"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [LinkButtonComponent, StatusComponent, BytesPipe],
})
export class TextVisualizationComponent implements OnChanges, OnDestroy {
  private fileResource = inject(FileResource);
  private sessionDataService = inject(SessionDataService);
  private visualizationModalService = inject(VisualizationModalService);
  private errorHandlerService = inject(RestErrorService);

  readonly dataset = input<Dataset>(undefined);
  readonly showFullData = input<boolean>(undefined);
  readonly modalMode = input<boolean>(undefined);

  public data: string;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  fileSizeLimit = 100 * 1024;

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next(null);
    this.state = new LoadState(State.Loading, "Loading data...");
    this.data = null;

    // check for empty file
    if (this.dataset().size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    const maxBytes = this.showFullData() ? null : this.fileSizeLimit;

    this.fileResource
      .getData(this.sessionDataService.getSessionId(), this.dataset(), maxBytes)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        next: (response: any) => {
          this.data = response;
          this.state = new LoadState(State.Ready);
        },
        error: (error: Response) => {
          this.state = new LoadState(State.Fail, "Loading data failed");
          this.errorHandlerService.showError(this.state.message, error);
        },
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }

  getSizeShown() {
    if (this.data) {
      return this.data.length;
    }
    return undefined;
  }

  getSizeFull() {
    return this.dataset().size;
  }

  isCompleteFile() {
    return this.getSizeShown() === this.getSizeFull();
  }

  showAll() {
    this.visualizationModalService.openVisualizationModal(this.dataset(), "text");
  }
}
