import {FileResource} from "../../../../../shared/resources/fileresource";
import {SessionDataService} from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {Component, Input, OnChanges} from "@angular/core";
import {Response} from "@angular/http";
import {VisualizationModalService} from "../visualizationmodal.service";
import {RestErrorService} from "../../../../../core/errorhandler/rest-error.service";

@Component({
  selector: 'ch-text-visualization',
  template: `
    <p *ngIf="!(data === '' || data)"><i>{{status}}</i></p>
    
    <div *ngIf="data === '' || data">
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
  private status: string;

  fileSizeLimit = 10 * 1024;

  constructor(private fileResource: FileResource,
              private sessionDataService: SessionDataService,
              private visualizationModalService: VisualizationModalService,
              private errorHandlerService: RestErrorService) {
  }

  ngOnChanges() {
    this.data = null;
    this.status = "Loading data...";
    let maxBytes = this.showFullData ? null : this.fileSizeLimit;

    console.log('getData()');
    this.fileResource.getData(this.sessionDataService.getSessionId(), this.dataset, maxBytes).subscribe((response: any) => {
      this.data = response;
    }, (error: Response) => {
      this.status = "Loading data failed";
      this.errorHandlerService.handleError(error, "Loading data failed");
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
