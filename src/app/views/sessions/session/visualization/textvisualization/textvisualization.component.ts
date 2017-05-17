import {FileResource} from "../../../../../shared/resources/fileresource";
import {SessionDataService} from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {Component, Input, OnChanges} from "@angular/core";
import {Response} from "@angular/http";
import {VisualizationModalService} from "../visualizationmodal.service";

@Component({
  selector: 'ch-text-visualization',
  template: `
    <p *ngIf="!data">Loading data...</p>
    
    <div *ngIf="data">
      <label *ngIf="!isCompleteFile()">Showing {{getSizeShown() | bytes}} of {{getSizeFull() | bytes}}</label>
      <ch-link-button class="pull-right" (click)="showAll()" *ngIf="!isCompleteFile()">Show all</ch-link-button>
      <pre>{{data}}</pre>
    </div>
  `,

  styles: [`
    pre {
      background-color: white;
    }
  `],
})
export class TextVisualizationComponent implements OnChanges {

  @Input() dataset: Dataset;
  @Input() showFullData: boolean;

  private data: string;

  fileSizeLimit = 10 * 1024;

  constructor(private fileResource: FileResource,
              private sessionDataService: SessionDataService,
              private visualizationModalService: VisualizationModalService) {
  }

  ngOnChanges() {
    let maxBytes = this.showFullData ? -1 : this.fileSizeLimit;

    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset.datasetId, maxBytes).subscribe((response: any) => {
      this.data = response;
    }, (error: Response) => {
      console.error(error);
    });
  }

  getSizeShown() {
    if (this.data) {
      return this.data.length;
    }
  }

  getSizeFull() {
    return this.dataset.size;
  }

  isCompleteFile() {
    return this.getSizeShown() === this.getSizeFull();
  }

  showAll() {
    this.visualizationModalService.openVisualizationModal(this.dataset, 'text');
  }

}
