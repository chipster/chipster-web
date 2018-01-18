
import {SessionEventService} from "./sessionevent.service";
import {SessionDataService} from "./sessiondata.service";
import {SelectionService} from "./selection.service";
import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import {SessionData} from "../../../model/session/session-data";
import * as _ from "lodash";
import WsEvent from "../../../model/events/wsevent";
import {Component, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute, Router, Params, UrlTree} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {JobErrorModalComponent} from "./joberrormodal/joberrormodal.component";
import {SelectionHandlerService} from "./selection-handler.service";
import {SessionResource} from "../../../shared/resources/session.resource";
import {ErrorService} from "../../../core/errorhandler/error.service";
import {RestErrorService} from "../../../core/errorhandler/rest-error.service";
import {DialogModalService} from "./dialogmodal/dialogmodal.service";
import {SessionWorkerResource} from "../../../shared/resources/sessionworker.resource";
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'ch-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.less']
})
export class SessionComponent implements OnInit, OnDestroy{

  sessionData: SessionData;
  deletedDatasets: Array<Dataset>;
  deletedDatasetsTimeout: any;
  subscriptions: Array<any> = [];
  private statusText: string;

  private PARAM_TEMP_COPY = 'tempCopy';

  constructor(
    private router: Router,
    private SessionEventService: SessionEventService,
    private sessionDataService: SessionDataService,
    private sessionResource: SessionResource,
    private selectionService: SelectionService,
    private selectionHandlerService: SelectionHandlerService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private errorService: ErrorService,
    private errorHandlerService: RestErrorService,
    private dialogModalService: DialogModalService,
    private sessionWorkerResource: SessionWorkerResource) {
  }

  ngOnInit() {
    // this.sessionData = this.route.snapshot.data['sessionData'];

    this.route.params.flatMap(params => {
      /*
	  Load session after every route change, not just once

	  Also this component can be reused, e.g. when a user creates her own copy
	  of an example session, she is directed to the new session.
	   */
      this.statusText = "Loading session...";
      this.selectionHandlerService.clearSelections();
      this.sessionData = null;
      return this.sessionResource.loadSession(params['sessionId']);
    })
      .flatMap(sessionData => {
        if (this.sessionDataService.hasReadWriteAccess(sessionData)) {
          return Observable.of(sessionData);
        } else {
          this.statusText = "Copying session...";
          return this.sessionResource.copySession(sessionData, sessionData.session.name)
            .flatMap(sessionId => {
              let queryParams = {};
              queryParams[this.PARAM_TEMP_COPY] = true;
              return Observable.fromPromise(this.router.navigate(
                ['/sessions', sessionId, queryParams]));
            })
            .flatMap(() => Observable.never<SessionData>());
        }
      }).subscribe(sessionData => {
      this.sessionData = sessionData;
      this.subscribeToEvents();
    }, (error: any) => {
      this.statusText = "";
      this.errorHandlerService.handleError(error, "Loading session failed");
    });

    // Select datasets provided via queryparameter and clear queryparameters
    this.route.queryParams.subscribe( (queryParams: Params) => {
      const datasets = this.parseQueryparametersArray(queryParams, 'id')
        .map( (datasetId: string) => this.sessionData.datasetsMap.get(datasetId));
      if(datasets.length > 0) {
        this.selectionHandlerService.setDatasetSelection(datasets);
        const sessionId = this.route.snapshot.params['sessionId'];
        const urlTree: UrlTree = this.router.createUrlTree( ['sessions', sessionId] );
        this.router.navigateByUrl(urlTree);
      }
    }).unsubscribe();
  }

  ngOnDestroy() {
    this.SessionEventService.unsubscribe();

    this.subscriptions.forEach(subs => subs.unsubscribe());
    this.subscriptions = [];
  }

  canDeactivate() {

    if (this.PARAM_TEMP_COPY in this.route.snapshot.params) {

      const keepButton = 'Keep';
      const deleteButton = 'Delete';

      return this.dialogModalService.openTempCopyModal(
        'Keep copy?',
        'This session is a copy of another read-only session. Do you want to keep it?',
        this.sessionData.session.name,
        keepButton,
        deleteButton)

        .flatMap(dialogResult => {
          if (dialogResult.button === keepButton) {

            this.sessionData.session.name = dialogResult.value;
            return this.sessionDataService.updateSession(this.sessionData, this.sessionData.session);

          } else if (dialogResult.button === deleteButton) {

            // the user doesn't need to be notified that the session is deleted
            this.SessionEventService.unsubscribe();
            return this.sessionDataService.deletePersonalRules(this.sessionData.session);
          }
        })
        .map(() => true)
        .catch(err => {
            if (err === undefined || err === 0 || err === 1) {
              // dialog cancel, backdrop click or esc
              return Observable.of(false);
            } else {
              throw err;
            }
        });

    } else {
      return Observable.of(true);
    }
  }

  subscribeToEvents() {
    // Services don't have access to ActivatedRoute, so we have to set it
    this.sessionDataService.setSessionId(this.sessionData.session.sessionId);

    // start listening for remote changes
    // in theory we may miss an update between the loadSession() and this subscribe(), but
    // the safe way would be much more complicated:
    // - subscribe but put the updates in queue
    // - loadSession().then()
    // - apply the queued updates

    this.SessionEventService.setSessionData(this.sessionDataService.getSessionId(), this.sessionData);

    this.subscriptions.push(this.SessionEventService.getAuthorizationStream().subscribe(change => {
      if (change.event.type === 'DELETE') {
        alert('The session has been deleted.');
        this.router.navigate(['/sessions']);
      }
    }));

    this.subscriptions.push(this.SessionEventService.getJobStream().subscribe(change => {

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
    }));
  }

  getJob(jobId: string): Job {
    return this.sessionData.jobsMap.get(jobId);
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

  // noinspection JSMethodCanBeStatic
  parseQueryparametersArray(queryParams: Params, key: string ): Array<string> {
    switch(typeof queryParams[key]) {
      case 'string':
        return [queryParams[key]];
      case 'object':
        return queryParams[key];
      default:
        return [];
    }
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

  renameSessionModal() {

    this.dialogModalService.openSessionNameModal(
      'Rename session',
      this.sessionData.session.name)
      .flatMap((name: string) => {
        console.log('renameSessionModal', name);
        this.sessionData.session.name = name;
        return this.sessionDataService.updateSession(this.sessionData, this.sessionData.session);
      })
      .subscribe(null, err => this.errorService.error('session rename error', err));
  }

  notesModal() {

    this.dialogModalService.openNotesModal(this.sessionData.session).then(notes => {
      this.sessionData.session.notes = notes;
      this.sessionDataService.updateSession(this.sessionData, this.sessionData.session).subscribe(() => {}, err => {
        this.errorService.headerError('Failed to update session notes: ' + err, true);
      })
    }, () => {
      // modal dismissed
    });
  }

  sharingModal() {
    this.dialogModalService.openSharingModal(this.sessionData.session);
  }

  duplicateModal() {
    this.dialogModalService.openSessionNameModal(
      'Duplicate session',
      this.sessionData.session.name + '_copy')
      .flatMap(name => {
        let copySessionObservable = this.sessionResource.copySession(this.sessionData, name);
        return this.dialogModalService.openSpinnerModal('Duplicate session', copySessionObservable);
      })
      .subscribe(null, err => this.errorService.error('duplicate session failed', err));
  }

  saveSessionFileModal() {
    this.sessionDataService.download(
      this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()));
  }

  removeSessionModal() {
    this.dialogModalService.openBooleanModal('Delete session', 'Delete session ' + this.sessionData.session.name + '?', 'Delete', 'Cancel').then(() => {
      // delete the session only from this user (i.e. the rule)
      this.sessionDataService.deletePersonalRules(this.sessionData.session).subscribe( () => {}, err => {
        this.errorService.headerError('Failed to delete the session: ' + err, true);
      });
    }, () => {
      // modal dismissed
    });
  }

  autoLayout() {
    this.sessionData.datasetsMap.forEach(d => {
      if (d.x || d.y) {
        d.x = null;
        d.y = null;
        this.sessionDataService.updateDataset(d);
      }
    });
  }
}
