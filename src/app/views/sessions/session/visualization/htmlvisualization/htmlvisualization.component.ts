import {Component, Input, OnChanges} from '@angular/core';
import {timeout} from "d3-timer";
import {SessionDataService} from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {ErrorHandlerService} from "../../../../../core/errorhandler/error-handler.service";

@Component({
  selector: 'ch-htmlvisualization',
  template: `
    <a href="{{linkSrc}}" target="_blank" class="pull-right">
      <i class="fa fa-external-link" aria-hidden="true"></i>
      Open in new tab
    </a>
    <iframe #htmlframe 
            *ngIf="src" 
            width="100%" 
            [src]="wrapperUrl + '?location=' + src  | trustedresource" 
            scrolling="no" 
            frameborder="0" 
            (load)="run(htmlframe)"></iframe>`
})
export class HtmlvisualizationComponent implements OnChanges {

  @Input()
  private dataset: Dataset;

  private src: string;
  private linkSrc: string;
  private wrapperUrl: string = 'assets/htmlvisualizationwrapper.html';

  constructor(
    private sessionDataService: SessionDataService,
    private errorHandlerService: ErrorHandlerService) { }

  ngOnChanges() {
    this.sessionDataService.getDatasetUrl(this.dataset).subscribe(url => {
      this.linkSrc = url;
      // we have to encode the url to get in one piece to the other side, because it contains
      // a query parameter itself
      this.src = encodeURIComponent(url);
    }, (error: any) => {
      this.errorHandlerService.handleError(error, "Loading html file failed");
    });
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
