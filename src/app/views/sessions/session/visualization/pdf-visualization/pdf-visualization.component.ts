import {Component, OnChanges, Input} from '@angular/core';
import Dataset from "../../../../../model/session/dataset";
import SessionDataService from "../../sessiondata.service";

@Component({
  selector: 'ch-pdf-visualization',
  templateUrl: './pdf-visualization.component.html',
  styleUrls: ['./pdf-visualization.component.less'],
})
export class PdfVisualizationComponent implements OnChanges {

  @Input()
  dataset: Dataset;

  src: string;

  page: number;
  zoom: number;

  constructor(private sessionDataService: SessionDataService) { }

  ngOnChanges() {
    this.page = 1;
    this.zoom = 1;

    this.sessionDataService.getDatasetUrl(this.dataset).subscribe(url => {
      this.src = url;
    });
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
