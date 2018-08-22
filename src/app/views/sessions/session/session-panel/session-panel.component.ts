import { SessionDataService } from "../sessiondata.service";
import Dataset from "chipster-js-common";
import UtilsService from "../../../../shared/utilities/utils";
import { SessionData } from "../../../../model/session/session-data";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { DatasetsearchPipe } from "../../../../shared/pipes/datasetsearch.pipe";
import { SelectionHandlerService } from "../selection-handler.service";
import { SelectionService } from "../selection.service";
import * as _ from "lodash";
import { Observable } from "rxjs/Observable";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { SessionWorkerResource } from "../../../../shared/resources/sessionworker.resource";


@Component({
  selector: "ch-session-panel",
  templateUrl: "./session-panel.component.html",
  styleUrls: ["./session-panel.component.less"]
})
export class SessionPanelComponent {
  @Input() sessionData: SessionData;
  @Output() deleteDatasetsNow = new EventEmitter<void>();
  @Output() deleteDatasetsUndo = new EventEmitter<void>();
  @Output() deleteStart = new EventEmitter<void>();

  datasetSearch: string;

  // noinspection JSUnusedLocalSymbols
  constructor(
    public sessionDataService: SessionDataService, // used by template
    private datasetsearchPipe: DatasetsearchPipe,
    private selectionHandlerService: SelectionHandlerService,
    private selectionService: SelectionService,
    private restErrorService: RestErrorService,
    private dialogModalService: DialogModalService,
    private sessionResource: SessionResource,
    private sessionWorkerResource: SessionWorkerResource
  ) {} // used by template

  search(value: any) {
    this.datasetSearch = value;
  }

  searchEnter() {
    // select highlighted datasets when the enter key is pressed
    const allDatasets = this.getDatasetList();
    this.selectionHandlerService.setDatasetSelection(
      this.datasetsearchPipe.transform(allDatasets, this.datasetSearch)
    );
    this.datasetSearch = null;
  }

  getCompleteDatasets() {
    /*
    Filter out uploading datasets

    Datasets are created when comp starts to upload them, but there are no type tags until the
    upload is finished. Hide these uploading datasets from the workflow, file list and dataset search.
    When those cannot be selected, those cannot cause problems in the visualization, which assumes that
    the type tags are do exist.
    */
    // convert to array[[key1, value1], [key2, value2], ...] for filtering and back to map
    return new Map(
      Array.from(this.sessionData.datasetsMap).filter(entry => {
        const dataset = entry[1];
        return dataset.fileId != null;
      })
    );
  }

  getDatasetList(): Dataset[] {
    return UtilsService.mapValues(this.getCompleteDatasets());
  }

  getDatasetListSorted(): Dataset[] {
    // sort by created date, oldest first (string comparison should do with the current date format)
    return this.getDatasetList().sort((a, b) =>
      UtilsService.compareStringNullSafe(a.created, b.created)
    );
  }

  toggleDatasetSelection($event: any, dataset: Dataset): void {
    if (UtilsService.isCtrlKey($event)) {
      this.selectionHandlerService.toggleDatasetSelection([dataset]);
      console.log([dataset]);
    } else if (UtilsService.isShiftKey($event)) {
      //  datasets and their ids in the order of the dataset list
      const allDatasets = this.getDatasetListSorted();
      const allIds = allDatasets.map(d => d.datasetId);

      // indexes of the old selection in the dataset list
      const selectedIndexes = this.selectionService.selectedDatasets.map(d =>
        allIds.indexOf(d.datasetId)
      );
      const clickIndex = allIds.indexOf(dataset.datasetId);
      const newMin = Math.min(clickIndex, ...selectedIndexes);
      const newMax = Math.max(clickIndex, ...selectedIndexes);

      // datasets within the index range
      const newSelection = _.range(newMin, newMax + 1).map(i => allDatasets[i]);
      this.selectionHandlerService.setDatasetSelection(newSelection);
    } else {
      this.selectionHandlerService.setDatasetSelection([dataset]);
    }
  }

  autoLayout() {
    const updates: Observable<any>[] = [];
    this.sessionData.datasetsMap.forEach(d => {
      if (d.x || d.y) {
        d.x = null;
        d.y = null;
        updates.push(this.sessionDataService.updateDataset(d));
      }
    });

    Observable.forkJoin(updates).subscribe(
      () => console.log(updates.length + " datasets updated"),
      err => this.restErrorService.handleError(err, "layout update failed")
    );
  }

  renameSessionModal() {
    this.dialogModalService
      .openSessionNameModal("Rename session", this.sessionData.session.name)
      .flatMap((name: string) => {
        console.log("renameSessionModal", name);
        this.sessionData.session.name = name;
        return this.sessionDataService.updateSession(
          this.sessionData,
          this.sessionData.session
        );
      })
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "Failed to rename the session")
      );
  }

  notesModal() {
    this.dialogModalService.openNotesModal(this.sessionData.session).then(
      notes => {
        this.sessionData.session.notes = notes;
        this.sessionDataService
          .updateSession(this.sessionData, this.sessionData.session)
          .subscribe(
            () => {},
            err => {
              this.restErrorService.handleError(
                err,
                "Failed to update session notes"
              );
            }
          );
      },
      () => {
        // modal dismissed
      }
    );
  }

  sharingModal() {
    this.dialogModalService.openSharingModal(this.sessionData.session);
  }

  duplicateModal() {
    this.dialogModalService
      .openSessionNameModal(
        "Duplicate session",
        this.sessionData.session.name + "_copy"
      )
      .flatMap(name => {
        const copySessionObservable = this.sessionResource.copySession(
          this.sessionData,
          name
        );
        return this.dialogModalService.openSpinnerModal(
          "Duplicate session",
          copySessionObservable
        );
      })
      .subscribe(null, err =>
        this.restErrorService.handleError(err, "Duplicate session failed")
      );
  }

  saveSessionFileModal() {
    this.sessionDataService.download(
      this.sessionWorkerResource.getPackageUrl(
        this.sessionDataService.getSessionId()
      )
    );
  }

  removeSessionModal() {
    this.dialogModalService
      .openBooleanModal(
        "Delete session",
        "Delete session " + this.sessionData.session.name + "?",
        "Delete",
        "Cancel"
      )
      .then(
        () => {
          // delete the session only from this user (i.e. the rule)
          this.sessionDataService
            .deletePersonalRules(this.sessionData.session)
            .subscribe(
              () => {},
              err => {
                this.restErrorService.handleError(
                  err,
                  "Failed to delete the session"
                );
              }
            );
        },
        () => {
          // modal dismissed
        }
      );
  }

  deleteDataset() {
    this.deleteStart.emit();
  }
}
