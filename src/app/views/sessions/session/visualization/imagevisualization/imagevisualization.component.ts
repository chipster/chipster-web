import {Component, Input} from "@angular/core";

@Component({
  selector: 'ch-image-visualization',
  template: `
      <div class="scrollable"><img [src]="src"></div>
  `
})
export class ImageVisualizationComponent {

  @Input()
  private src: string;

  constructor() {}

}
