import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Dataset, Label } from "chipster-js-common";
import { forkJoin, of } from "rxjs";
import { catchError, map, toArray } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { DialogModalService } from "../dialogmodal/dialogmodal.service";
import { LabelEditorModalComponent } from "./label-editor-modal.component";
import { LabelsContextMenuService } from "./labels-context-menu.service";

type SelectionState = "checked" | "unchecked" | "indeterminate";

interface LabelRow {
  label: Label;
  selection: SelectionState;
}

@Component({
  selector: "ch-labels-modal",
  templateUrl: "./labels-modal.component.html",
})
export class LabelsModalComponent implements OnInit {
  @Input() sessionData: SessionData;
  @Input() selectedDatasets: Dataset[] = [];

  readonly maxLabelsPerSession = 50;

  rows: LabelRow[] = [];

  saving = false;

  constructor(
    public activeModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private sessionResource: SessionResource,
    private errorService: ErrorService,
    private dialogModalService: DialogModalService,
    private labelsContextMenuService: LabelsContextMenuService,
  ) {}

  ngOnInit(): void {
    this.refreshRows();
  }

  private refreshRows(): void {
    const labels = Array.from(this.sessionData.labelsMap.values()).sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    );

    this.rows = labels.map((label) => ({
      label,
      selection: this.computeSelection(label),
    }));
  }

  private computeSelection(label: Label): SelectionState {
    if (this.selectedDatasets.length === 0) {
      return "unchecked";
    }
    const count = this.selectedDatasets.filter((d) => (d.labelIds ?? []).includes(label.labelId)).length;
    if (count === 0) {
      return "unchecked";
    }
    if (count === this.selectedDatasets.length) {
      return "checked";
    }
    return "indeterminate";
  }

  hasSelection(): boolean {
    return this.selectedDatasets.length > 0;
  }

  toggleRow(row: LabelRow): void {
    row.selection = row.selection === "checked" ? "unchecked" : "checked";
  }

  deleteLabel(row: LabelRow): void {
    this.dialogModalService
      .openBooleanModal(
        "Delete label",
        `Delete label '${row.label.name}'?`,
        "Delete",
        "Cancel",
        "It will be removed from the session and from all files that use it.",
      )
      .then(
        () => this.confirmDeleteLabel(row),
        () => {},
      );
  }

  private confirmDeleteLabel(row: LabelRow): void {
    this.sessionResource.deleteLabel(this.sessionData.session.sessionId, row.label.labelId).subscribe({
      next: () => {
        this.sessionData.labelsMap.delete(row.label.labelId);
        // server cascade removes the id from datasets and emits dataset UPDATE events,
        // but also scrub local copies so UI updates immediately
        this.selectedDatasets.forEach((d) => {
          if (d.labelIds) {
            d.labelIds = d.labelIds.filter((id) => id !== row.label.labelId);
          }
        });
        this.sessionData.datasetsMap.forEach((d) => {
          if (d.labelIds) {
            d.labelIds = d.labelIds.filter((id) => id !== row.label.labelId);
          }
        });
        this.rows = this.rows.filter((r) => r !== row);
      },
      error: (err) => this.errorService.showError("Deleting label failed", err),
    });
  }

  deleteAllLabels(): void {
    const count = this.rows.length;
    this.dialogModalService
      .openBooleanModal(
        "Delete all labels",
        `Delete all ${count} label${count === 1 ? "" : "s"}?`,
        "Delete all",
        "Cancel",
        "They will be removed from the session and from all files that use them.",
      )
      .then(
        () => this.confirmDeleteAllLabels(),
        () => {},
      );
  }

  private confirmDeleteAllLabels(): void {
    const sessionId = this.sessionData.session.sessionId;
    const labelIds = this.rows.map((r) => r.label.labelId);

    this.saving = true;
    forkJoin(
      labelIds.map((labelId) =>
        this.sessionResource.deleteLabel(sessionId, labelId).pipe(
          // emit the id on success, null on failure, so only labels that were
          // actually deleted server-side get scrubbed from local state
          map(() => labelId),
          catchError((err) => {
            this.errorService.showError("Deleting label failed", err);
            return of(null);
          }),
        ),
      ),
    ).subscribe({
      next: (results) => {
        // mirror the local-state scrub done in confirmDeleteLabel, for every deleted id
        const deleted = new Set(results.filter((id): id is string => id != null));
        deleted.forEach((id) => this.sessionData.labelsMap.delete(id));
        this.selectedDatasets.forEach((d) => {
          if (d.labelIds) {
            d.labelIds = d.labelIds.filter((id) => !deleted.has(id));
          }
        });
        this.sessionData.datasetsMap.forEach((d) => {
          if (d.labelIds) {
            d.labelIds = d.labelIds.filter((id) => !deleted.has(id));
          }
        });
        // keep any rows that weren't deleted (failed, or created meanwhile)
        this.rows = this.rows.filter((r) => !deleted.has(r.label.labelId));
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  openCreateLabel(): void {
    const modalRef = this.ngbModal.open(LabelEditorModalComponent, { size: "sm" });
    modalRef.componentInstance.sessionData = this.sessionData;
    modalRef.result.then(
      (created: Label) => this.addCreatedLabelRow(created),
      () => {},
    );
  }

  openEditLabel(row: LabelRow): void {
    const modalRef = this.ngbModal.open(LabelEditorModalComponent, { size: "sm" });
    modalRef.componentInstance.sessionData = this.sessionData;
    modalRef.componentInstance.label = row.label;
    modalRef.result.then(
      (updated: Label) => {
        this.rows = this.rows
          .map((r) => (r.label.labelId === updated.labelId ? { ...r, label: updated } : r))
          .sort((a, b) => (a.label.name ?? "").localeCompare(b.label.name ?? ""));
      },
      () => {},
    );
  }

  private addCreatedLabelRow(created: Label): void {
    const newRow: LabelRow = {
      label: created,
      selection: this.hasSelection() ? "checked" : "unchecked",
    };
    this.rows = [...this.rows, newRow].sort((a, b) => (a.label.name ?? "").localeCompare(b.label.name ?? ""));
  }

  confirm(): void {
    if (!this.hasSelection()) {
      this.activeModal.close();
      return;
    }

    const sessionId = this.sessionData.session.sessionId;
    const datasetUpdates: Dataset[] = [];

    // Track which labels were actually applied/removed so the workflow
    // toolbar's split-button can default to the most recent one. Prefer
    // applied over removed since that's usually the user's main intent.
    const tracking = { lastAppliedId: null as string | null, lastRemovedId: null as string | null };

    for (const dataset of this.selectedDatasets) {
      const before = new Set(dataset.labelIds ?? []);
      const after = this.applyRowsTo(before, tracking);

      if (!this.setsEqual(before, after)) {
        dataset.labelIds = Array.from(after);
        datasetUpdates.push(dataset);
      }
    }

    if (datasetUpdates.length === 0) {
      this.activeModal.close();
      return;
    }

    const lastUsedId = tracking.lastAppliedId ?? tracking.lastRemovedId;

    this.saving = true;
    forkJoin(
      datasetUpdates.map((d) =>
        this.sessionResource.updateDataset(sessionId, d).pipe(
          catchError((err) => {
            this.errorService.showError("Updating dataset labels failed", err);
            return of(null);
          }),
        ),
      ),
    )
      .pipe(toArray())
      .subscribe({
        next: () => {
          if (lastUsedId) {
            this.labelsContextMenuService.recordLastUsedLabel(lastUsedId);
          }
          this.saving = false;
          this.activeModal.close();
        },
        error: () => {
          this.saving = false;
        },
      });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  private applyRowsTo(
    before: Set<string>,
    tracking: { lastAppliedId: string | null; lastRemovedId: string | null },
  ): Set<string> {
    const after = new Set(before);
    for (const row of this.rows) {
      const id = row.label.labelId;
      if (row.selection === "checked") {
        if (!before.has(id)) {
          tracking.lastAppliedId = id;
        }
        after.add(id);
      } else if (row.selection === "unchecked") {
        if (before.has(id)) {
          tracking.lastRemovedId = id;
        }
        after.delete(id);
      }
      // 'indeterminate' = keep as-is for this dataset
    }
    return after;
  }

  private setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
}
