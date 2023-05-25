import { ChangeDetectorRef, Injectable } from "@angular/core";
import { Dataset, Job } from "chipster-js-common";
import log from "loglevel";
import { Observable, forkJoin, timer } from "rxjs";
import { map } from "rxjs/operators";
import { TokenService } from "../../core/authentication/token.service";
import { ErrorService } from "../../core/errorhandler/error.service";
import { RestErrorService } from "../../core/errorhandler/rest-error.service";
import { DialogModalService } from "../../views/sessions/session/dialogmodal/dialogmodal.service";
import { JobService } from "../../views/sessions/session/job.service";
import { SessionResource } from "../resources/session.resource";
import { ConfigService } from "./config.service";

declare let Flow: any;

@Injectable()
export class UploadService {
  constructor(
    private configService: ConfigService,
    private tokenService: TokenService,
    private sessionResource: SessionResource,
    private restErrorService: RestErrorService,
    private dialogModalService: DialogModalService,
    private jobService: JobService,
    private errorService: ErrorService
  ) {}

  getFlow(fileAdded: (file: any, event: any, flow: any) => any, fileSuccess: (file: any) => any) {
    const flow = new Flow({
      // continuation from different browser session not implemented
      testChunks: false,
      method: "octet",
      uploadMethod: "PUT",
      // upload the chunks in order
      simultaneousUploads: 1,
      // don't spend time between requests too often
      chunkSize: 50000000,
      // accept 204 No content
      successStatuses: [200, 201, 202, 204],
      // fail on 409 Conflict
      permanentErrors: [404, 409, 415, 500, 501],
      // make numbers easier to read (default 500)
      progressCallbacksInterval: 1000,
      // manual's recommendation for big files
      speedSmoothingFactor: 0.02,
      // allow the same file to be uploaded again
      allowDuplicateUploads: true,
    });

    if (!flow.support) {
      throw Error("flow.js not supported");
    }

    flow.on("fileAdded", (file, event) => {
      // console.log(file, event);
      this.flowFileAdded(file, event, flow);
      fileAdded(file, event, flow);
    });
    // noinspection JSUnusedLocalSymbols
    flow.on("fileSuccess", (file, message) => {
      // console.log(file, message);
      fileSuccess(file);
    });
    flow.on("fileError", (file, message) => {
      log.error(file, message);
    });

    return flow;
  }

  // noinspection JSMethodCanBeStatic
  private flowFileAdded(file: any, event: any, flow: any) {
    // each file has a unique target url
    flow.opts.target = function (file2: any) {
      return file2.chipsterTarget;
    };

    file.pause();
  }

  startUpload(sessionId: string, file: any) {
    forkJoin([this.configService.getFileBrokerUrl(), this.createDataset(sessionId, file.name)]).subscribe(
      (value: [string, Dataset]) => {
        const url = value[0];
        const dataset = value[1];
        file.chipsterTarget = `${url}/sessions/${sessionId}/datasets/${
          dataset.datasetId
        }?token=${this.tokenService.getToken()}`;
        file.chipsterSessionId = sessionId;
        file.chipsterDatasetId = dataset.datasetId;
        file.resume();
      },
      (err) => this.restErrorService.showError("upload failed", err)
    );
  }

  private createDataset(sessionId: string, name: string): Observable<Dataset> {
    const d = new Dataset(name);
    return this.sessionResource.createDataset(sessionId, d).pipe(
      map((datasetId: string) => {
        d.datasetId = datasetId;
        this.sessionResource.updateDataset(sessionId, d);
        return d;
      })
    );
  }

  /**
   * We have to poll the upload progress, because flow.js doesn't send events about it.
   *
   * Schedule a next view update after a second as long as flow.js has files.
   */
  scheduleViewUpdate(changeDetectorRef: ChangeDetectorRef, flow: any) {
    log.info("scheduling view update");
    timer(1000).subscribe(() => {
      // TODO check if view not destroyed
      changeDetectorRef.detectChanges();

      if (flow.files.length > 0) {
        this.scheduleViewUpdate(changeDetectorRef, flow);
      }
    });
  }

  openDialogAndDowloadFromUrl() {
    this.dialogModalService.downloadFromUrlModal().subscribe({
      next: (url: string) => {
        const parameters = [];
        parameters.push({
          parameterId: "url_str",
          displayName: "",
          description: "",
          type: "UNCHECKED_STRING",
          value: url,
        });

        parameters.push({
          parameterId: "file_extension",
          displayName: "",
          description: "",
          type: "ENUM",
          value: "current",
        });

        parameters.push({
          parameterId: "check_certs_str",
          displayName: "",
          description: "",
          type: "ENUM",
          value: "yes",
        });

        const job: Job = <Job>{
          toolId: "download-file.py",
          toolCategory: "Data retrieval",
          module: "Misc",
          toolName: "Download file from URL",
          toolDescription: "",
          state: "NEW",
          inputs: [],
          parameters,
          metadataFiles: [],
        };

        this.jobService.runJobDirect(job);
      },
      error: (err) => {
        this.errorService.showError("Failed to download", err);
      },
    });
  }
}
