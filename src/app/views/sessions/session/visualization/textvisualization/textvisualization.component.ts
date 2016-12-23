import FileResource from "../../../../../resources/fileresource";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
import {Component, Input, Inject, ChangeDetectorRef} from "@angular/core";
import {Observable} from "rxjs";
import {Response} from "@angular/http";

@Component({
  selector: 'ch-text-visualization',
  template: `
    <label *ngIf="!isCompleteFile()">Showing {{getSizeShown() | bytepipe}} of {{getSizeFull() | bytepipe}}</label>
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
      Observable.fromPromise(this.fileResource.getLimitedData(this.sessionDataService.getSessionId(), this.datasetId, this.fileSizeLimit)).subscribe( (response: Response) => {
        this.data = response.data;
        this.changeDetectorRef.detectChanges();
      }, (error: Response) => {
        console.error(error);
      });
    }

    load() {
      this.fileResource.getLimitedData(this.sessionDataService.getSessionId(), this.datasetId, this.fileSizeLimit).then( (resp: any) => {
        this.data = resp.data;
      }, (error) => {
        console.error('error', error);
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
