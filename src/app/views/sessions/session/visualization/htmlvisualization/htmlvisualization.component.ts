import {Component, Input, OnChanges, OnDestroy} from '@angular/core';
import {timeout} from "d3-timer";
import {SessionDataService} from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {Subject} from "rxjs/Subject";
import {LoadState, State} from "../../../../../model/loadstate";

@Component({
  selector: 'ch-htmlvisualization',
  templateUrl: './htmlvisualization.component.html'
})

export class HtmlvisualizationComponent implements OnChanges, OnDestroy {

  @Input()
  private dataset: Dataset;
  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  private src: string;
  private linkSrc: string;
  private wrapperUrl = 'assets/htmlvisualizationwrapper.html';

  constructor(
    private sessionDataService: SessionDataService,
    private errorHandlerService: RestErrorService) { }

  ngOnChanges() {
    // unsubscribe from previous subscriptions
    this.unsubscribe.next();
    this.state = new LoadState(State.Loading, "Loading html file...");

    this.sessionDataService.getDatasetUrl(this.dataset)
      .takeUntil(this.unsubscribe)
      .subscribe(url => {
        this.linkSrc = url;
        // we have to encode the url to get in one piece to the other side, because it contains
        // a query parameter itself
        this.src = encodeURIComponent(url);
        this.state = new LoadState(State.Ready);
      }, (error: any) => {
        this.state = new LoadState(State.Fail, "Loading html file failed");
        this.errorHandlerService.handleError(error, this.state.message);
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  run(htmlframe) {
    timeout( () => {
      if (!htmlframe.contentWindow) {
        return;
      }
      const height = htmlframe.contentWindow.document.body.style.height;

      if (height) {
        htmlframe.height = height + 'px';
      } else {
        this.run(htmlframe);
      }
    }, 100);
  }

  openNewTab() {
    this.sessionDataService.openNewTab(this.dataset);
  }
}
