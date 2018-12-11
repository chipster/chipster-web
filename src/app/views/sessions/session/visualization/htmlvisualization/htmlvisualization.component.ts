import {Component, Input, OnChanges, OnDestroy} from '@angular/core';
import {timeout} from "d3-timer";
import {SessionDataService} from "../../session-data.service";
import { Dataset } from "chipster-js-common";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {Subject} from "rxjs/Subject";
import {LoadState, State} from "../../../../../model/loadstate";

@Component({
  selector: 'ch-htmlvisualization',
  templateUrl: './htmlvisualization.component.html',
  styleUrls: ['./htmlvisualization.component.less']
})

export class HtmlvisualizationComponent implements OnChanges, OnDestroy {

  @Input()
  private dataset: Dataset;
  private unsubscribe: Subject<any> = new Subject();
  state: LoadState;

  public src: string;
  public wrapperUrl = 'assets/htmlvisualizationwrapper.html';
  private linkSrc: string;

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
      if (!htmlframe.contentWindow || !htmlframe.contentWindow.document.body) {
        console.log('will not set the frame height because it was removed already');
        return;
      }
      const height = htmlframe.contentWindow.document.body.style.height;
      const width = htmlframe.contentWindow.document.body.style.width;

      if (height && width) {
        htmlframe.height = height;
        htmlframe.width = width;
      } else {
        this.run(htmlframe);
      }
    }, 100);
  }

  openNewTab() {
    this.sessionDataService.openNewTab(this.dataset);
  }
}
