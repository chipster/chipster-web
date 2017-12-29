import {Component, Input, OnChanges, OnDestroy} from '@angular/core';
import {timeout} from "d3-timer";
import {SessionDataService} from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {Subject} from "rxjs/Subject";

@Component({
  selector: 'ch-htmlvisualization',
  templateUrl: './htmlvisualization.component.html'
})

export class HtmlvisualizationComponent implements OnChanges, OnDestroy {

  @Input()
  private dataset: Dataset;
  private unsubscribe: Subject<any> = new Subject();
  private status: string;

  private src: string;
  private linkSrc: string;
  private wrapperUrl: string = 'assets/htmlvisualizationwrapper.html';s

  constructor(
    private sessionDataService: SessionDataService,
    private errorHandlerService: RestErrorService) { }

  ngOnChanges() {
    this.status = "Loading html file...";

    this.sessionDataService.getDatasetUrl(this.dataset)
      .takeUntil(this.unsubscribe)
      .subscribe(url => {
        this.linkSrc = url;
        // we have to encode the url to get in one piece to the other side, because it contains
        // a query parameter itself
        this.src = encodeURIComponent(url);
      }, (error: any) => {
        this.status = "Loading html file failed";
        this.errorHandlerService.handleError(error, "Loading html file failed");
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  run(htmlframe) {
    timeout( () => {
      let height = htmlframe.contentWindow.document.body.style.height;
      if (height) {
        htmlframe.height = height + 'px';
      } else {
        this.run(htmlframe);
      }
    }, 100);
  }
}
