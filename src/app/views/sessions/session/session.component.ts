
import {SessionEventService} from "./sessionevent.service";
import {SessionDataService} from "./sessiondata.service";
import {SelectionService} from "./selection.service";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import {SessionData} from "../../../model/session/session-data";
import * as _ from "lodash";
import WsEvent from "../../../model/events/wsevent";
import {Component} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {JobErrorModalComponent} from "./joberrormodal/joberrormodal.component";
import {SelectionHandlerService} from "./selection-handler.service";
import {TypeTagService} from "../../../shared/services/typetag.service";


@Component({
  selector: 'ch-session',
  templateUrl: './session.component.html'
})
export class SessionComponent {

    toolDetailList: any = null;
    sessionData: SessionData;
    deletedDatasets: Array<Dataset>;
    deletedDatasetsTimeout: any;

    constructor(
        private router: Router,
        private SessionEventService: SessionEventService,
        private sessionDataService: SessionDataService,
        private selectionService: SelectionService,
        private selectionHandlerService: SelectionHandlerService,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private typeTagService: TypeTagService) {
    }

    ngOnInit() {

      this.sessionData = this.route.snapshot.data['sessionData'];
      // Services don't have access to ActivatedRoute, so we have to set it
      this.sessionDataService.setSessionId(this.route.snapshot.params['sessionId']);

      // start listening for remote changes
      // in theory we may miss an update between the loadSession() and this subscribe(), but
      // the safe way would be much more complicated:
      // - subscribe but put the updates in queue
      // - loadSession().then()
      // - apply the queued updates

      this.SessionEventService.setSessionData(this.sessionDataService.getSessionId(), this.sessionData);

      this.SessionEventService.getAuthorizationStream().subscribe(change => {
        if (change.event.type === 'DELETE') {
          alert('The session has been deleted.');
          this.router.navigate(['/sessions']);
        }
      });

      this.SessionEventService.getJobStream().subscribe(change => {

        let oldValue = <Job>change.oldValue;
        let newValue = <Job>change.newValue;

        // if not cancelled
        if (newValue) {
          // if the job has just failed
          if (newValue.state === 'EXPIRED_WAITING' && oldValue.state !== 'EXPIRED_WAITING') {
            this.openErrorModal('Job expired', newValue);
            console.info(newValue);
          }
          if (newValue.state === 'FAILED' && oldValue.state !== 'FAILED') {
            this.openErrorModal('Job failed', newValue);
            console.info(newValue);
          }
          if (newValue.state === 'ERROR' && oldValue.state !== 'ERROR') {
            this.openErrorModal('Job error', newValue);
            console.info(newValue);
          }
        }
      });

      this.SessionEventService.getDatasetStream().subscribe(change => {

        let oldValue = <Dataset>change.oldValue;
        let newValue = <Dataset>change.newValue;

        // if not deleted
        if (newValue) {
          // if the dataset was just added
          if (newValue.fileId !== null && (oldValue == null || oldValue.fileId == null)) {
            // if the session is open in multiple clients, they all will do this
            // shouldn't matter as long as all the clients are up-to-date
            this.typeTagService.updateTypeTagsIfNecessary([newValue]);
          }

          if (oldValue != null && oldValue.name !== newValue.name) {
            // update the type tags, because file extension may have changed
            this.typeTagService.updateTypeTags(newValue).subscribe(null, (err) => {
              console.error('failed to update type tags', err)
            });
          }
        }
      });

      // check that all datasets in the opened session have up-to-date type tags
      console.log('checking type tags');
      this.typeTagService.updateTypeTagsIfNecessary(Array.from(this.sessionData.datasetsMap.values()));
    }

    ngOnDestroy() {
      this.SessionEventService.unsubscribe();
    }

    getSelectedDatasets() {
        return this.selectionService.selectedDatasets;
    }

    getSelectedJobs() {
        return this.selectionService.selectedJobs;
    }

    getJob(jobId: string): Job {
        return this.sessionData.jobsMap.get(jobId);
    }

    deleteJobs(jobs: Job[]) {
        this.sessionDataService.deleteJobs(jobs);
    }

    deleteDatasetsNow() {
        // cancel the timer
        clearTimeout(this.deletedDatasetsTimeout);

        // delete from the server
        this.sessionDataService.deleteDatasets(this.deletedDatasets);

        // hide the undo message
        this.deletedDatasets = null;
    }

    deleteDatasetsUndo() {
        // cancel the deletion
        clearTimeout(this.deletedDatasetsTimeout);

        // show datasets again in the workflowgraph
        this.deletedDatasets.forEach((dataset: Dataset) => {
            let wsEvent = new WsEvent(
              this.sessionDataService.getSessionId(), 'DATASET', dataset.datasetId, 'CREATE');
            this.SessionEventService.generateLocalEvent(wsEvent);
        });

        // hide the undo message
        this.deletedDatasets = null;
    }

  /**
   * Poor man's undo for the dataset deletion.
   *
   * Hide the dataset from the client for ten
   * seconds and delete from the server only after that. deleteDatasetsUndo() will
   * cancel the timer and make the datasets visible again. Session copying and sharing
   * should filter out these hidden datasets or we need a proper server side support for this.
   */
  deleteDatasetsLater() {

        // let's assume that user doesn't want to undo, if she is already
        // deleting more
        if (this.deletedDatasets) {
          this.deleteDatasetsNow();
        }

        // make a copy so that further selection changes won't change the array
        this.deletedDatasets = _.clone(this.selectionService.selectedDatasets);

        // all selected datasets are going to be deleted
        // clear selection to avoid problems in other parts of the UI
        this.selectionHandlerService.clearDatasetSelection();

        // hide from the workflowgraph
        this.deletedDatasets.forEach((dataset: Dataset) => {
          let wsEvent = new WsEvent(
            this.sessionDataService.getSessionId(), 'DATASET', dataset.datasetId, 'DELETE');
          this.SessionEventService.generateLocalEvent(wsEvent);
        });

        // start timer to delete datasets from the server later
        this.deletedDatasetsTimeout = setTimeout(() => {
            this.deleteDatasetsNow();
        }, 10 * 1000);
    }

    exportDatasets(datasets: Dataset[]) {
        this.sessionDataService.exportDatasets(datasets);
    }

    getSession() {
        return this.sessionData.session;
    }

    getDatasetsMap() {
        return this.sessionData.datasetsMap;
    }

    getJobsMap() {
        return this.sessionData.jobsMap;
    }

    getModulesMap() {
        return this.sessionData.modulesMap;
    }

    openErrorModal(title: string, job: Job) {
      let modalRef = this.modalService.open(JobErrorModalComponent, {size: 'lg'});
      modalRef.componentInstance.title = title;
      modalRef.componentInstance.job = job;

      modalRef.result.then(() => {
        this.sessionDataService.deleteJobs([job]);
      }, () => {
        // modal dismissed
        this.sessionDataService.deleteJobs([job]);
      });
    }
}
