import { Component, OnInit, inject, signal } from "@angular/core";
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
import { LabelPillComponent } from "./label-pill.component";
import { NgClass } from "@angular/common";

type SelectionState = "checked" | "unchecked" | "indeterminate";

interface LabelRow {
  label: Label;
  selection: SelectionState;
}

@Component({
  selector: "ch-labels-modal",
  templateUrl: "./labels-modal.component.html",
  imports: [LabelPillComponent, NgClass],
})
export class LabelsModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private ngbModal = inject(NgbModal);
  private sessionResource = inject(SessionResource);
  private errorService = inject(ErrorService);
  private dialogModalService = inject(DialogModalService);
  private labelsContextMenuService = inject(LabelsContextMenuService);

  // set through the modal ref by the code that opens the modal
  readonly sessionData = signal<SessionData>(undefined);
  readonly selectedDatasets = signal<Dataset[]>([]);

  readonly maxLabelsPerSession = 50;

  readonly rows = signal<LabelRow[]>([]);

  readonly saving = signal(false);

  ngOnInit(): void {
    this.refreshRows();
  }

  private refreshRows(): void {
    const labels = Array.from(this.sessionData().labelsMap().values()).sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    );

    this.rows.set(
      labels.map((label) => ({
        label,
        selection: this.computeSelection(label),
      })),
    );
  }

  private computeSelection(label: Label): SelectionState {
    if (this.selectedDatasets().length === 0) {
      return "unchecked";
    }
    const count = this.selectedDatasets().filter((d) => (d.labelIds ?? []).includes(label.labelId)).length;
    if (count === 0) {
      return "unchecked";
    }
    if (count === this.selectedDatasets().length) {
      return "checked";
    }
    return "indeterminate";
  }

  hasSelection(): boolean {
    return this.selectedDatasets().length > 0;
  }

  /** There is something to apply only if files are selected and there are labels to check */
  canApply(): boolean {
    return this.hasSelection() && this.rows().length > 0;
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
        "btn-danger",
        "It will be removed from the session and from all files that use it.",
      )
      .then(
        () => this.confirmDeleteLabel(row),
        () => {},
      );
  }

  private confirmDeleteLabel(row: LabelRow): void {
    this.sessionResource.deleteLabel(this.sessionData().session().sessionId, row.label.labelId).subscribe({
      next: () => {
        // server cascade removes the id from datasets and emits dataset UPDATE events,
        // but also scrub local copies so UI updates immediately
        this.removeLabelsLocally(new Set([row.label.labelId]));
        this.rows.set(this.rows().filter((r) => r !== row));
      },
      error: (err) => this.errorService.showError("Deleting label failed", err),
    });
  }

  deleteAllLabels(): void {
    const count = this.rows().length;
    this.dialogModalService
      .openBooleanModal(
        "Delete all labels",
        `Delete all ${count} label${count === 1 ? "" : "s"}?`,
        "Delete all",
        "Cancel",
        "btn-danger",
        "They will be removed from the session and from all files that use them.",
      )
      .then(
        () => this.confirmDeleteAllLabels(),
        () => {},
      );
  }

  /**
   * Remove the labels from labelsMap and from the datasets that use them.
   *
   * The datasets in datasetsMap are replaced with copies, so that the views that show them are
   * notified. The selected datasets are the same objects as in the map until now, so change them
   * in place too, because the selection keeps them.
   */
  private removeLabelsLocally(labelIds: Set<string>): void {
    const sessionData = this.sessionData();
    sessionData.labelsMap.update((m) => new Map(Array.from(m).filter(([id]) => !labelIds.has(id))));
    this.selectedDatasets().forEach((d) => {
      if (d.labelIds) {
        d.labelIds = d.labelIds.filter((id) => !labelIds.has(id));
      }
    });
    sessionData.datasetsMap.update(
      (m) =>
        new Map(
          Array.from(m).map(([datasetId, d]) => [
            datasetId,
            d.labelIds?.some((id) => labelIds.has(id))
              ? { ...d, labelIds: d.labelIds.filter((id) => !labelIds.has(id)) }
              : d,
          ]),
        ),
    );
  }

  private confirmDeleteAllLabels(): void {
    const sessionId = this.sessionData().session().sessionId;
    const labelIds = this.rows().map((r) => r.label.labelId);

    this.saving.set(true);
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
        this.removeLabelsLocally(deleted);
        // keep any rows that weren't deleted (failed, or created meanwhile)
        this.rows.set(this.rows().filter((r) => !deleted.has(r.label.labelId)));
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  openCreateLabel(): void {
    const modalRef = this.ngbModal.open(LabelEditorModalComponent, { size: "sm" });
    const modal = modalRef.componentInstance as LabelEditorModalComponent;
    modal.sessionData.set(this.sessionData());
    modalRef.result.then(
      (created: Label) => this.addCreatedLabelRow(created),
      () => {},
    );
  }

  openEditLabel(row: LabelRow): void {
    const modalRef = this.ngbModal.open(LabelEditorModalComponent, { size: "sm" });
    const modal = modalRef.componentInstance as LabelEditorModalComponent;
    modal.sessionData.set(this.sessionData());
    modal.label.set(row.label);
    modalRef.result.then(
      (updated: Label) => {
        this.rows.set(
          this.rows()
            .map((r) => (r.label.labelId === updated.labelId ? { ...r, label: updated } : r))
            .sort((a, b) => (a.label.name ?? "").localeCompare(b.label.name ?? "")),
        );
      },
      () => {},
    );
  }

  private addCreatedLabelRow(created: Label): void {
    const newRow: LabelRow = {
      label: created,
      selection: this.hasSelection() ? "checked" : "unchecked",
    };
    this.rows.set([...this.rows(), newRow].sort((a, b) => (a.label.name ?? "").localeCompare(b.label.name ?? "")));
  }

  confirm(): void {
    if (!this.hasSelection()) {
      this.activeModal.close();
      return;
    }

    const sessionId = this.sessionData().session().sessionId;
    const datasetUpdates: Dataset[] = [];

    // Track which labels were actually applied/removed so the workflow
    // toolbar's split-button can default to the most recent one. Prefer
    // applied over removed since that's usually the user's main intent.
    const tracking = { lastAppliedId: null as string | null, lastRemovedId: null as string | null };

    for (const dataset of this.selectedDatasets()) {
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

    this.saving.set(true);
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
          this.saving.set(false);
          this.activeModal.close();
        },
        error: () => {
          this.saving.set(false);
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
    for (const row of this.rows()) {
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
