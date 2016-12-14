import {Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Input} from '@angular/core';

@Component({
  selector: 'ch-pdf-visualization',
  templateUrl: './pdf-visualization.component.html',
  styleUrls: ['./pdf-visualization.component.less'],
})
export class PdfVisualizationComponent implements OnInit {

  @Input()
  src: string;

  page: number;
  zoom: number;

  constructor() { }

  ngOnInit() {
    this.page = 1;
    this.zoom = 1;
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
