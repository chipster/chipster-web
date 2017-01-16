import FileResource from "../../../../../shared/resources/fileresource";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {Component, Input, Inject, ChangeDetectorRef} from "@angular/core";
import {Observable} from "rxjs";
import {Response, Http} from "@angular/http";

@Component({
  selector: 'ch-text-visualization',
  template: `
    <label *ngIf="!isCompleteFile()">Showing {{getSizeShown() | bytes}} of {{getSizeFull() | bytes}}</label>
    <p>{{data}}</p>
    <a href (click)="loadMore()" *ngIf="!isCompleteFile()">Show more</a>
  `
})
export class TextVisualizationComponent {

    @Input() datasetId: string;
    @Input() selectedDatasets: Array<Dataset>;
    private data: string;

    fileSizeLimit = 10 * 1024;

    constructor(
      private changeDetectorRef: ChangeDetectorRef,
    	@Inject('FileResource') private fileResource: FileResource,
      @Inject('SessionDataService') private sessionDataService: SessionDataService) {
    }

    ngOnInit() {

      Observable.fromPromise(this.fileResource.getLimitedData(this.sessionDataService.getSessionId(), this.datasetId, this.fileSizeLimit)).subscribe( (response: any) => {
        this.data = response.data;
        this.changeDetectorRef.detectChanges();
      }, (error: Response) => {
        console.error(error);
      });
    }

    load() {
      Observable.fromPromise(this.fileResource.getLimitedData(this.sessionDataService.getSessionId(), this.datasetId, this.fileSizeLimit)).subscribe( (response: any) => {
        this.data = response.data;
        this.changeDetectorRef.detectChanges();
      }, (error: Response) => {
        console.error(error);
      });
    }

    loadMore() {
        this.fileSizeLimit *= 2;
        this.load();
    }

    createDataset() {
    	this.sessionDataService.createDerivedDataset("dataset.tsv", [this.datasetId], "Text", this.data);
    }

    getSizeShown() {
        if (this.data) {
            return this.data.length;
        }
    }

    getSizeFull() {
        return this.selectedDatasets[0].size;
    }

    isCompleteFile() {
        return this.getSizeShown() === this.getSizeFull();
    }
}
