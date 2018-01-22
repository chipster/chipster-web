import {Component, OnChanges, Input, OnDestroy} from '@angular/core';
import Dataset from "../../../../../model/session/dataset";
import {SessionDataService} from "../../sessiondata.service";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {Subject} from "rxjs/Subject";
import {LoadState, State} from "../../../../../model/loadstate";

@Component({
  selector: 'ch-pdf-visualization',
  templateUrl: './pdf-visualization.component.html',
  styleUrls: ['./pdf-visualization.component.less'],
})
export class PdfVisualizationComponent implements OnChanges, OnDestroy {

  @Input()
  dataset: Dataset;

  src: string;

  page: number;
  zoom: number;

  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  constructor(private sessionDataService: SessionDataService,
              private errorHandlerService: RestErrorService) { }

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading pdf file...");

    this.page = 1;
    this.zoom = 1;

    this.sessionDataService.getDatasetUrl(this.dataset)
      .takeUntil(this.unsubscribe)
      .subscribe(url => {
        this.src = url;
        this.state = new LoadState(State.Ready);
      }, (error: any) => {
        this.state = new LoadState(State.Loading, "Loading pdf file failed");
        this.errorHandlerService.handleError(error, this.state.message);
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  previousPage() {
    if(this.page > 0) {
      this.page -= 1;
    }
  }

  nextPage() {
    this.page += 1;
  }

  zoomIn() {
    this.zoom += 0.2;
  }

  zoomOut() {
    this.zoom -= 0.2;
  }

}
