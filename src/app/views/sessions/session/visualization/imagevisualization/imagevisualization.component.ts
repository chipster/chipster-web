import {Component, Input, OnChanges} from "@angular/core";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";

@Component({
  selector: 'ch-image-visualization',
  template: `
      <div class="scrollable"><img [src]="src"></div>
  `
})
export class ImageVisualizationComponent implements OnChanges {

  @Input()
  private dataset: Dataset;

  private src: string;

  constructor(private sessionDataService: SessionDataService,) {
  }

  ngOnChanges() {
    this.sessionDataService.getDatasetUrl(this.dataset).subscribe(url => {
      this.src = url;
    });
  }
}
