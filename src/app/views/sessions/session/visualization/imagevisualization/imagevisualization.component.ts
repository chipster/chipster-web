
import {takeUntil} from 'rxjs/operators';
import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { SessionDataService } from "../../session-data.service";
import { Dataset } from "chipster-js-common";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";
import { Subject } from "rxjs";
import { LoadState, State } from "../../../../../model/loadstate";

@Component({
  selector: "ch-image-visualization",
  templateUrl: "./imagevisualization.component.html"
})
export class ImageVisualizationComponent implements OnChanges, OnDestroy {
  @Input()
  private dataset: Dataset;

  private src: string;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  constructor(
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService
  ) {}

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading image file...");

    // check for empty file
    if (this.dataset.size < 1) {
      this.state = new LoadState(State.EmptyFile);
      return;
    }

    this.sessionDataService
      .getDatasetUrl(this.dataset).pipe(
      takeUntil(this.unsubscribe))
      .subscribe(
        url => {
          this.src = url;
          this.state = new LoadState(State.Ready);
        },
        (error: any) => {
          this.state = new LoadState(State.Fail, "Loading image file failed");
          this.restErrorService.showError(this.state.message, error);
        }
      );
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  openNewTab() {
    this.sessionDataService.openNewTab(this.dataset);
  }
}
