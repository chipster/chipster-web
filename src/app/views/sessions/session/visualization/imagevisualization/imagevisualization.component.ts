import {Component, Input, Inject} from "@angular/core";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";

@Component({
  selector: 'ch-image-visualization',
  template: `
      <div class="scrollable"><img [src]="src"></div>
  `
})
export class ImageVisualizationComponent {

  @Input()
  private dataset: Dataset;

  private src: string;

  constructor(@Inject('SessionDataService') private sessionDataService: SessionDataService,) {
  }

  ngOnInit() {
    this.sessionDataService.getDatasetUrl(this.dataset).subscribe(url => {
      this.src = url;
    });
  }
}
