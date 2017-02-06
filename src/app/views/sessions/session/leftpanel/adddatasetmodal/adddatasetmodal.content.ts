import Utils from "../../../../../shared/utilities/utils";
import WorkflowGraphService from "../workflowgraph/workflowgraph.service";
import ConfigService from "../../../../../shared/services/config.service";
import Dataset from "../../../../../model/session/dataset";
import IQService = angular.IQService;
import SessionResource from "../../../../../shared/resources/session.resource";
import {TokenService} from "../../../../../core/authentication/token.service";
import {Component, Input, Inject, ChangeDetectorRef, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Observable} from 'rxjs/Rx';

declare var Flow: any;

@Component({
  selector: 'ch-add-dataset-modal-content',
  templateUrl: './adddatasetmodal.content.html'
})
export class AddDatasetModalContent {

  private datasetIds: string[] = [];

  @Input() datasetsMap: Map<string, Dataset>;
  @Input() sessionId: string;
  @Input() oneFile: boolean;
  @Input() files: any[];

  @ViewChild('browseFilesButton') browseFilesButton;
  @ViewChild('browseDirButton') browseDirButton;

  private flow;

  constructor(
    public activeModal: NgbActiveModal,
    @Inject('ConfigService') private ConfigService: ConfigService,
    @Inject('TokenService') private tokenService: TokenService,
    @Inject('SessionResource') private sessionResource: SessionResource,
    @Inject('WorkflowGraphService') private workflowGraphService: WorkflowGraphService,
    @Inject('$q') private $q: IQService,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.flow = new Flow({
      // continuation from different browser session not implemented
      testChunks: false,
      method: 'octet',
      uploadMethod: 'PUT',
      // upload the chunks in order
      simultaneousUploads: 1,
      // don't spend time between requests too often
      chunkSize: 50000000,
      // fail on 409 Conflict
      permanentErrors: [404, 409, 415, 500, 501],
      // make numbers easier to read (default 500)
      progressCallbacksInterval: 1000,
      // manual's recommendation for big files
      speedSmoothingFactor: 0.02
    });

    if (!this.flow.support) {
      throw Error("flow.js not supported");
    }

    this.flow.on('fileAdded', (file, event) => {
      console.log(file, event);
      this.flowFileAdded(file, event, this.flow);
    });
    this.flow.on('fileSuccess', (file, message) => {
      console.log(file, message);
      this.flowFileSuccess(file);
    });
    this.flow.on('fileError', (file, message) => {
      console.log(file, message);
    });
  }

  ngAfterViewInit() {
    this.flow.assignBrowse(this.browseFilesButton);
    this.flow.assignBrowse(this.browseDirButton, true);
  }

  /*
   addFile(event) {
   console.log('addFile()', event, this.files);
   // run outside of the digest cycle
   setTimeout(() => {
   this.flow.addFile(this.files[0]);
   }, 0);
   }*/

  flowFileAdded(file: any, event: any, flow: any) {

    this.scheduleViewUpdate();

    console.debug('file added');
    flow.opts.target = function (file: any) {
      return file.chipsterTarget;
    };

    Observable.forkJoin(
      this.ConfigService.getFileBrokerUrl(),
      this.createDataset(this.sessionId, file.name)

    ).subscribe((value: [string, Dataset]) => {
        let url = value[0];
        let dataset = value[1];
        file.chipsterTarget = `${url}/sessions/${this.sessionId}/datasets/${dataset.datasetId}?token=${this.tokenService.getToken()}`;
        file.resume();
        this.datasetIds.push(dataset.datasetId);
    });
    file.pause();
  }

  createDataset(sessionId: string, name: string): Observable<Dataset> {
    var d = new Dataset(name);
    console.info('createDataset', d);
    return this.sessionResource.createDataset(sessionId, d).map((datasetId: string) => {
      d.datasetId = datasetId;
      var pos = this.workflowGraphService.newRootPosition(Utils.mapValues(this.datasetsMap));
      d.x = pos.x;
      d.y = pos.y;
      this.sessionResource.updateDataset(sessionId, d);
      return d;
    });
  }

  flowFileSuccess(file: any) {
    // remove from the list
    file.cancel();
  }

  /*
   close() {
   this.$uibModalInstance.close(this.datasetIds);
   }
   */

  /**
   * We have to poll the upload progress, because flow.js doesn't send events about it.
   *
   * Schedule a next view update after a second as long as flow.js has files.
   */
  private scheduleViewUpdate() {
    Observable.timer(1000).subscribe(() => {
      this.changeDetectorRef.detectChanges();

      if (this.flow.files.length > 0) {
        this.scheduleViewUpdate();
      }
    });
  }
}
