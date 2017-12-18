import {Component, Input, OnChanges} from "@angular/core";
import {SessionDataService} from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {ErrorHandlerService} from "../../../../../core/errorhandler/error-handler.service";

@Component({
  selector: 'ch-image-visualization',
  template: `
      <div class="scrollable"><img *ngIf="src" [src]="src"></div>
  `
})
export class ImageVisualizationComponent implements OnChanges {

  @Input()
  private dataset: Dataset;

  private src: string;

  constructor(private sessionDataService: SessionDataService,
              private errorHandlerService: ErrorHandlerService) {
  }

  ngOnChanges() {
    this.sessionDataService.getDatasetUrl(this.dataset).subscribe(url => {
      this.src = url;
    }, (error: any) => {
      this.errorHandlerService.handleError(error);
    });
  }
}
