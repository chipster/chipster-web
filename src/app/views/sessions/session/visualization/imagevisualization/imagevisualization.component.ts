import {Component, Input, OnChanges, OnDestroy} from "@angular/core";
import {SessionDataService} from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {Subject} from "rxjs/Subject";
import {LoadState, State} from "../../../../../model/loadstate";

@Component({
  selector: 'ch-image-visualization',
  templateUrl: './imagevisualization.component.html'})

export class ImageVisualizationComponent implements OnChanges, OnDestroy{

  @Input()
  private dataset: Dataset;

  private src: string;

  private unsubscribe: Subject<any> = new Subject();
  private state: LoadState;


  constructor(private sessionDataService: SessionDataService,
              private errorHandlerService: RestErrorService) {
  }

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading image file...");

    this.sessionDataService.getDatasetUrl(this.dataset)
      .takeUntil(this.unsubscribe)
      .subscribe(url => {
        this.src = url;
        this.state = new LoadState(State.Ready);
      }, (error: any) => {
        this.state = new LoadState(State.Fail, "Loading image file failed");
        this.errorHandlerService.handleError(error, this.state.message);
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

}

