
import {SessionDataService} from "../sessiondata.service";
import Dataset from "../../../../model/session/dataset";
import UtilsService from "../../../../shared/utilities/utils";
import {SessionResource} from "../../../../shared/resources/session.resource";
import {SessionWorkerResource} from "../../../../shared/resources/sessionworker.resource";
import {SessionData} from "../../../../model/session/session-data";
import {Component, Input} from "@angular/core";
import {DialogModalService} from "../dialogmodal/dialogmodal.service";
import {DatasetsearchPipe} from "../../../../shared/pipes/datasetsearch.pipe";
import {SelectionHandlerService} from "../selection-handler.service";
import {ErrorService} from "../../../error/error.service";
import {SelectionService} from "../selection.service";

@Component({
  selector: 'ch-leftpanel',
  templateUrl: './leftpanel.component.html',
  styleUrls: ['./leftpanel.component.less'],
})
export class LeftPanelComponent {

  @Input() sessionData: SessionData;

  datasetSearch: string;

  constructor(
    private sessionResource: SessionResource,
    private sessionDataService: SessionDataService,
    private sessionWorkerResource: SessionWorkerResource,
    private dialogModalService: DialogModalService,
    private datasetsearchPipe: DatasetsearchPipe,
    private selectionHandlerService: SelectionHandlerService,
    private errorService: ErrorService,
    private selectionService: SelectionService) {} // used by template

  datasetSearchKeyEvent(e: any) {
    if (e.keyCode == 13) { // enter
      // select highlighted datasets
      let allDatasets = this.getDatasetList();
      this.selectionHandlerService.setDatasetSelection(this.datasetsearchPipe.transform(allDatasets, this.datasetSearch));
      this.datasetSearch = null;
    }
    if (e.keyCode == 27) { // escape key
      // clear the search
      this.datasetSearch = null;
    }
  }

  getDatasetList(): Dataset[] {
    return UtilsService.mapValues(this.sessionData.datasetsMap);
  }

  getDatasetListSorted(): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList().sort((a, b) => UtilsService.compareStringNullSafe(a.created, b.created));
  }

  toggleDatasetSelection($event: any, dataset: Dataset): void {
    if(UtilsService.isCtrlKey($event) || UtilsService.isShiftKey($event)) {
      this.selectionHandlerService.toggleDatasetSelection([dataset]);
    } else {
      this.selectionHandlerService.setDatasetSelection([dataset]);
    }
  }

  renameSessionModal() {
    this.dialogModalService.openSessionNameModal('Rename session', this.sessionData.session.name).then(name => {
      console.log('renameSessionModal', name);
      this.sessionData.session.name = name;
      this.sessionDataService.updateSession(this.sessionData.session).subscribe();
    }, () => {
      // modal dismissed
    });
  }

  notesModal() {

    this.dialogModalService.openNotesModal(this.sessionData.session).then(notes => {
      this.sessionData.session.notes = notes;
      this.sessionDataService.updateSession(this.sessionData.session).subscribe(() => {}, err => {
        this.errorService.headerError('failed to update session notes: ' + err, true);
      })
    }, () => {
      // modal dismissed
    });
  }

  sharingModal() {
    this.dialogModalService.openSharingModal(this.sessionData.session);
  }

  duplicateModal() {
    this.dialogModalService.openSessionNameModal('Duplicate session', this.sessionData.session.name + '_copy').then(name => {
      if (!name) {
        name = 'unnamed session';
      }

      let copySessionObservable = this.sessionResource.copySession(this.sessionData, name);

      this.dialogModalService.openSpinnerModal('Duplicate session', copySessionObservable);
    }, () => {
      // modal dismissed
    });
  }

  saveSessionFileModal() {
    this.sessionDataService.download(
      this.sessionWorkerResource.getPackageUrl(this.sessionDataService.getSessionId()));
  }

  removeSessionModal() {
    this.dialogModalService.openBooleanModal('Delete session', 'Delete session ' + this.sessionData.session.name + '?', 'Delete', 'Cancel').then(() => {
      // delete the session only from this user (i.e. the rule)
      this.sessionDataService.deletePersonalRules(this.sessionData.session).subscribe( () => {}, err => {
        this.errorService.headerError('failed to delete the session: ' + err, true);
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
