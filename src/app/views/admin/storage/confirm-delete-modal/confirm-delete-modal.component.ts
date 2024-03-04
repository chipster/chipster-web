/* eslint-disable no-param-reassign */
import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { GridOptions, GridReadyEvent } from "ag-grid-community";
import log from "loglevel";
import { Observable, Subject, concat, of } from "rxjs";
import { catchError, mergeMap, takeUntil, tap } from "rxjs/operators";
import { RestErrorService } from "../../../../core/errorhandler/rest-error.service";
import { SessionDbAdminService } from "../../../../shared/services/sessiondb-admin.service";
import { UserService } from "../../../../shared/services/user.service";
import UtilsService from "../../../../shared/utilities/utils";

export enum DeleteAction {
  DeleteUser,
  DeleteSessions,
  DeleteUserAndSessions,
}

enum DeleteStatus {
  Confirm = "Confirm",
  Pending = "Pending",
  Deleting = "Deleting",
  Done = "Done",
  Failed = "Failed",
  Cancelled = "Cancelled",
  No = "No",
}

@Component({
  selector: "ch-confirm-delete-modal",
  templateUrl: "./confirm-delete-modal.component.html",
  styleUrls: ["./confirm-delete-modal.component.less"],
})
export class ConfirmDeleteModalComponent implements OnInit {
  @Input() users: any[];
  @Input() deleteAction: DeleteAction;

  title: string;
  message: string;

  // users with status columns for delete user and delete sessions
  rows: any[];

  gridOptions: GridOptions = null;

  deleteEnabled = true;
  deleteVisible = true;
  closeEnabled = true;

  // indicate if there has been any delete actions and refresh refresh the parent component after close is needed
  private refreshAfterClose: boolean = false;

  private cancelDelete$ = new Subject();
  api: any;

  constructor(
    private activeModal: NgbActiveModal,
    private userService: UserService,
    private restErrorService: RestErrorService,
    private sessionDbAdminService: SessionDbAdminService,
  ) {}

  ngOnInit(): void {
    // set title and message according to the deleteAction
    switch (this.deleteAction) {
      case DeleteAction.DeleteUser:
        this.title = "Delete users, keep sessions";
        this.message = `Are you sure you want to delete the following ${this.users.length} user${UtilsService.sIfMany(
          this.users,
        )}?`;
        break;
      case DeleteAction.DeleteSessions:
        this.title = "Delete sessions, keep users";
        this.message = `Are you sure you want to delete sessions for the following ${
          this.users.length
        } user${UtilsService.sIfMany(this.users)}?`;
        break;
      case DeleteAction.DeleteUserAndSessions:
        this.title = "Delete users and sessions";
        this.message = `Are you sure you want to delete the following ${this.users.length} user${UtilsService.sIfMany(
          this.users,
        )} and their sessions?`;
        break;
      default:
        throw new Error("Unknown delete action");
    }

    // set status columns
    this.rows = this.users.map((user) => ({
      ...user,
      deleteUser:
        this.deleteAction === DeleteAction.DeleteUser || this.deleteAction === DeleteAction.DeleteUserAndSessions
          ? DeleteStatus.Confirm
          : DeleteStatus.No,
      deleteSessions:
        this.deleteAction === DeleteAction.DeleteSessions || this.deleteAction === DeleteAction.DeleteUserAndSessions
          ? DeleteStatus.Confirm
          : DeleteStatus.No,
    }));

    // set grid options
    this.gridOptions = {
      rowData: this.rows,
      columnDefs: [
        { field: "userId" },
        {
          field: "modified",
          sortable: true,

          cellRenderer: this.customDateRenderer.bind(this),
        },
        { field: "deleteUser" },
        { field: "deleteSessions" },
      ],
      onGridReady: (event: GridReadyEvent) => {
        this.api = event.api;
      },
    };
  }

  onDelete() {
    this.deleteVisible = false;
    this.deleteEnabled = false;
    this.closeEnabled = false;

    let deleteActions$: Observable<any>[];

    // set status to pending according to the deleteAction
    this.setAllRowsStatus(this.deleteAction, DeleteStatus.Pending);

    // for each row, create a delete action that sets the status to deleting, performs delete action, and sets the status to deleted
    switch (this.deleteAction) {
      case DeleteAction.DeleteUser:
        deleteActions$ = this.rows
          .filter((row) => !this.isDeleteUserFinished(row))
          .map((row) => this.getDeleteUserObservable(row));
        break;
      case DeleteAction.DeleteSessions:
        deleteActions$ = this.rows
          .filter((row) => !this.isDeleteSessionsFinished(row))
          .map((row) => this.getDeleteSessionsObservable(row));
        break;
      case DeleteAction.DeleteUserAndSessions:
        deleteActions$ = this.rows
          // filter out if both delete actions are already done
          .filter((row) => !(this.isDeleteUserFinished(row) && this.isDeleteSessionsFinished(row)))
          .map((row) => {
            if (this.isDeleteUserFinished(row) && !this.isDeleteSessionsFinished(row)) {
              return this.getDeleteSessionsObservable(row);
            }
            if (!this.isDeleteUserFinished(row) && this.isDeleteSessionsFinished(row)) {
              return this.getDeleteUserObservable(row);
            }
            return concat(this.getDeleteUserObservable(row), this.getDeleteSessionsObservable(row));
          });
        break;

      default:
        throw new Error("Unknown delete action");
    }

    // concat all delete actions (cancel if cancelDelete$ emits)
    concat(...deleteActions$)
      .pipe(takeUntil(this.cancelDelete$))
      .subscribe({
        next: () => {},
        error: (err) => {
          this.restErrorService.showError("Delete users failed", err);
        },
        complete: () => {
          log.info("Delete finished");
          this.deleteEnabled = !this.allRowsFinished();
          this.deleteVisible = true;
          this.closeEnabled = true;
          this.refreshAfterClose = true;
        },
      });
  }

  onClose() {
    this.activeModal.close(this.refreshAfterClose);
  }

  onCancelDelete() {
    this.cancelDelete$.next();

    this.setAllRowsStatus(this.deleteAction, DeleteStatus.Cancelled);
    this.deleteEnabled = !this.allRowsFinished();
  }

  customDateRenderer(params: any): string {
    return UtilsService.renderDate(params.value);
  }

  isFinished(status: DeleteStatus) {
    return status === DeleteStatus.Done || status === DeleteStatus.Failed || status === DeleteStatus.No;
  }

  /**
   * Set status, delete, and set status again
   *
   * @param row
   * @returns
   */
  private getDeleteUserObservable(row): Observable<any> {
    return of(row).pipe(
      tap(() => {
        row.deleteUser = DeleteStatus.Deleting;
        this.api.redrawRows();
      }),
      mergeMap(() =>
        this.userService.deleteUser(row.userId).pipe(
          catchError((error) => {
            log.warn("delete user failed", error);
            return of(false);
          }),
        ),
      ),
      tap((result) => {
        row.deleteUser = result === false ? DeleteStatus.Failed : DeleteStatus.Done;
        this.api.redrawRows();
      }),
    );
  }

  private getDeleteSessionsObservable(row): Observable<any> {
    return of(row).pipe(
      tap(() => {
        row.deleteSessions = DeleteStatus.Deleting;
        this.api.redrawRows();
      }),
      mergeMap(() =>
        this.sessionDbAdminService.deleteSessions(row.userId).pipe(
          catchError((error) => {
            log.warn("delete sessions failed", error);
            return of(false);
          }),
        ),
      ),
      tap((result) => {
        row.deleteSessions = result === false ? DeleteStatus.Failed : DeleteStatus.Done;
        this.api.redrawRows();
      }),
    );
  }

  private isDeleteUserFinished(row): boolean {
    return this.isFinished(row.deleteUser);
  }

  private isDeleteSessionsFinished(row): boolean {
    return this.isFinished(row.deleteSessions);
  }

  private allRowsFinished(): boolean {
    return this.rows.every((row) => this.isDeleteUserFinished(row) && this.isDeleteSessionsFinished(row));
  }

  /**
   * Change row status, if it is not already finished
   *
   * @param deleteAction
   * @param status
   */
  private setAllRowsStatus(deleteAction: DeleteAction, status: DeleteStatus): void {
    this.rows.forEach((row) => {
      if (
        (deleteAction === DeleteAction.DeleteUser || deleteAction === DeleteAction.DeleteUserAndSessions) &&
        !this.isDeleteUserFinished(row)
      ) {
        row.deleteUser = status;
      }

      if (
        (deleteAction === DeleteAction.DeleteSessions || deleteAction === DeleteAction.DeleteUserAndSessions) &&
        !this.isDeleteSessionsFinished(row)
      ) {
        row.deleteSessions = status;
      }
    });
    this.api.redrawRows();
  }
}
