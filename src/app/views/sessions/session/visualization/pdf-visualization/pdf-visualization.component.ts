import {Component, OnChanges, Input, OnDestroy} from '@angular/core';
import Dataset from "../../../../../model/session/dataset";
import {SessionDataService} from "../../sessiondata.service";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";
import {Subject} from "rxjs/Subject";

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

  private status: string = "";

  constructor(private sessionDataService: SessionDataService,
              private errorHandlerService: RestErrorService) { }

  ngOnChanges() {
    this.status = "Loading pdf file...";
    this.page = 1;
    this.zoom = 1;

    this.sessionDataService.getDatasetUrl(this.dataset)
      .takeUntil(this.unsubscribe)
      .subscribe(url => {
      this.src = url;
    }, (error: any) => {
      this.status = "Loading pdf file failed";
      this.errorHandlerService.handleError(error, "Loading pdf file failed");
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
