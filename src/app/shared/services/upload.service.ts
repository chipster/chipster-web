import {Injectable, Inject} from "@angular/core";
import WorkflowGraphService from "../../views/sessions/session/leftpanel/workflowgraph/workflowgraph.service";
import SessionResource from "../resources/session.resource";
import {TokenService} from "../../core/authentication/token.service";
import ConfigService from "./config.service";
import {Observable} from 'rxjs/Rx';
import Dataset from "../../model/session/dataset";
import Utils from "../utilities/utils";

declare var Flow: any;

@Injectable()
export default class UploadService {

  constructor(
    @Inject('ConfigService') private ConfigService: ConfigService,
    @Inject('TokenService') private tokenService: TokenService,
    @Inject('SessionResource') private sessionResource: SessionResource,
    @Inject('WorkflowGraphService') private workflowGraphService: WorkflowGraphService) {
  }

  getFlow(sessionId$: Observable<string>, datasetsMap: Map<string, Dataset>, onChange: ()=>any, onUploadEnd: (datasetId: string, sessionId: string)=>any) {
    let flow = new Flow({
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

    if (!flow.support) {
      throw Error("flow.js not supported");
    }

    flow.on('fileAdded', (file, event) => {
      console.log(file, event);
      this.flowFileAdded(file, event, flow, sessionId$, datasetsMap, onChange);
    });
    flow.on('fileSuccess', (file, message) => {
      console.log(file, message);
      this.flowFileSuccess(file, onUploadEnd);
    });
    flow.on('fileError', (file, message) => {
      console.log(file, message);
    });

    return flow;
  }

  flowFileAdded(file: any, event: any, flow: any, sessionId$: Observable<string>, datasetsMap: Map<string, Dataset>, onChange: ()=>any) {

    this.scheduleViewUpdate(onChange, flow);

    console.debug('file added');
    flow.opts.target = function (file: any) {
      return file.chipsterTarget;
    };

    console.log('sessionid observable', sessionId$);

    sessionId$.subscribe(sessionId => {
      Observable.forkJoin(
        this.ConfigService.getFileBrokerUrl(),
        this.createDataset(sessionId, file.name, datasetsMap)

      ).subscribe((value: [string, Dataset]) => {
        let url = value[0];
        let dataset = value[1];
        file.chipsterTarget = `${url}/sessions/${sessionId}/datasets/${dataset.datasetId}?token=${this.tokenService.getToken()}`;
        file.chipsterSessionId = sessionId;
        file.chipsterDatasetId = dataset.datasetId;
        file.resume();
      });
    });
    file.pause();
  }

  createDataset(sessionId: string, name: string, datasetsMap: Map<string, Dataset>): Observable<Dataset> {
    var d = new Dataset(name);
    console.info('createDataset', d);
    return this.sessionResource.createDataset(sessionId, d).map((datasetId: string) => {
      d.datasetId = datasetId;
      if (datasetsMap) {
        var pos = this.workflowGraphService.newRootPosition(Utils.mapValues(datasetsMap));
        d.x = pos.x;
        d.y = pos.y;
      }
      this.sessionResource.updateDataset(sessionId, d);
      return d;
    });
  }

  flowFileSuccess(file: any, onUploadEnd: (datasetId: string, sessionId: string)=>any) {
    console.log('flowFileSuccess', file);
    // remove from the list
    file.cancel();
    onUploadEnd(file.chipsterDatasetId, file.chipsterSessionId);
  }

  /**
   * We have to poll the upload progress, because flow.js doesn't send events about it.
   *
   * Schedule a next view update after a second as long as flow.js has files.
   */
  private scheduleViewUpdate(onChange: ()=>void, flow: any) {
    Observable.timer(1000).subscribe(() => {
      onChange();

      if (flow.files.length > 0) {
        this.scheduleViewUpdate(onChange, flow);
      }
    });
  }
}
