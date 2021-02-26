import { Injectable } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset } from "chipster-js-common";
import { EMPTY } from "rxjs";
import { map } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import {
  Tags,
  TypeTagService
} from "../../../../shared/services/typetag.service";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
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

  public openDatasetHistoryModal(
    dataset: Dataset,
    sessionData: SessionData
  ): void {
    const modalRef = this.ngbModal.open(DatasetHistoryModalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;
  }

  public openWrangleModal(dataset: Dataset, sessionData: SessionData): void {
    if (dataset.size > WrangleModalComponent.FILE_SIZE_LIMIT * 1024 * 1024) {
      this.dialogModalService.openNotificationModal(
        "Converting file not possible",
        "The file is too big to be converted. The size limit is " +
          WrangleModalComponent.FILE_SIZE_LIMIT +
          " MB at the moment but it will be removed in the future."
      );
      return;
    }

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

    const modalRef = this.ngbModal.open(WrangleModalComponent, {
      size: "lg"
    });
    modalRef.componentInstance.dataset = dataset;
    modalRef.componentInstance.sessionData = sessionData;

    // modal returns the observale which runs the wrangle
    // block with the spinner while waiting for that observable to complete
    DialogModalService.observableFromPromiseWithDismissHandling(modalRef.result)
      .pipe(
        map(runWrangle$ => {
          return runWrangle$ != null
            ? this.dialogModalService.openSpinnerModal(
                "Convert to Chipster format",
                runWrangle$
              )
            : EMPTY;
        })
      )
      .subscribe({
        next: () => {},
        error: error =>
          this.errorService.showError(
            "Convert to Chipster format failed",
            error
          )
      });
  }
}
