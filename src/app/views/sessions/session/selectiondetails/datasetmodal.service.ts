import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import * as log from "loglevel";
import { EMPTY } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { Tags, TypeTagService } from "../../../../shared/services/typetag.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { SamplesModalComponent } from "../samples-modal/samples-modal.component";
import { WrangleModalComponent } from "../wrangle-modal/wrangle-modal.component";
import { DatasetHistoryModalComponent } from "./dataset-history-modal/dataset-history-modal.component";

@Injectable()
export class DatasetModalService {
  constructor(
    private ngbModal: NgbModal,
    private dialogModalService: DialogModalService,
    private errorService: ErrorService,
    private typeTagService: TypeTagService
  ) {}

  public openDatasetHistoryModal(dataset: Dataset, sessionData: SessionData): void {
    const modalRef = this.ngbModal.open(DatasetHistoryModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;
  }

  public openWrangleModal(dataset: Dataset, sessionData: SessionData): void {
    if (
      !(
        this.typeTagService.has(sessionData, dataset, Tags.TEXT) ||
        this.typeTagService.has(sessionData, dataset, Tags.TSV)
      )
    ) {
      this.dialogModalService.openNotificationModal(
        "Converting file not possible",
        "Convert only works for tab delimeted text files."
      );
      return;
    }

    if (dataset.size > WrangleModalComponent.FILE_SIZE_LIMIT * 1024 * 1024) {
      this.dialogModalService.openNotificationModal(
        "Converting file not possible",
        "The file is too big to be converted. The size limit is " +
          WrangleModalComponent.FILE_SIZE_LIMIT +
          " MB at the moment but it will be removed in the future."
      );
      return;
    }

    const modalRef = this.ngbModal.open(WrangleModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;

    // modal returns the observale which runs the wrangle
    // block with the spinner while waiting for that observable to complete
    DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result)
      .pipe(
        mergeMap((runWrangle$) => {
          return runWrangle$ != null
            ? this.dialogModalService.openSpinnerModal("Convert to Chipster format", runWrangle$)
            : EMPTY;
        })
      )
      .subscribe({
        next: (result) => {
          log.info("Convert done", result);
        },
        error: (error) => this.errorService.showError("Convert to Chipster format failed", error),
      });
  }

  public openGroupsModal(datasets: Dataset[], sessionData: SessionData): void {
    const modalRef = this.ngbModal.open(SamplesModalComponent, {
      size: "xl",
    });
    modalRef.componentInstance.datasets = datasets;
    modalRef.componentInstance.sessionData = sessionData;

    // modal returns the observale which runs the action
    // block with the spinner while waiting for that observable to complete
    DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result)
      .pipe(
        mergeMap((run$) => {
          return run$ != null ? this.dialogModalService.openSpinnerModal("Saving groups", run$) : EMPTY;
        })
      )
      .subscribe({
        next: (result) => {
          log.debug("Saving groups done", result);
        },
        error: (error) => this.errorService.showError("Saving groups failed", error),
      });
  }
}
