import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Label } from "chipster-js-common";
import { mergeMap } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { DEFAULT_LABEL_COLOR_KEY, LABEL_PALETTE, LabelColor } from "./label-palette";

@Component({
  selector: "ch-label-editor-modal",
  templateUrl: "./label-editor-modal.component.html",
  styleUrls: ["./label-editor-modal.component.less"],
})
export class LabelEditorModalComponent implements OnInit {
  @Input() sessionData: SessionData;
  // when set, the modal edits this label; when null, it creates a new one
  @Input() label: Label = null;

  palette: LabelColor[] = LABEL_PALETTE;
  readonly maxNameLength = 30;
  name = "";
  color: string = DEFAULT_LABEL_COLOR_KEY;
  saving = false;

  constructor(
    public activeModal: NgbActiveModal,
    private sessionResource: SessionResource,
    private errorService: ErrorService,
  ) {}

  ngOnInit(): void {
    if (this.label != null) {
      this.name = this.label.name ?? "";
      this.color = this.label.color ?? DEFAULT_LABEL_COLOR_KEY;
    } else {
      // new label: pick the first palette color not yet used in the session
      const usedColors = new Set(
        Array.from(this.sessionData.labelsMap.values()).map((l) => l.color),
      );
      const firstUnused = LABEL_PALETTE.find((c) => !usedColors.has(c.key));
      this.color = firstUnused?.key ?? DEFAULT_LABEL_COLOR_KEY;
    }
  }

  get isEdit(): boolean {
    return this.label != null;
  }

  previewLabel(): Label {
    return {
      sessionId: this.sessionData.session.sessionId,
      labelId: this.label?.labelId ?? "",
      name: this.name || "New label",
      color: this.color,
      created: this.label?.created ?? null,
    };
  }

  canSave(): boolean {
    return (this.name ?? "").trim().length > 0 && !this.saving;
  }

  save(): void {
    const name = this.name.trim();
    if (!name) {
      return;
    }
    const sessionId = this.sessionData.session.sessionId;
    this.saving = true;

    if (this.isEdit) {
      const updated: Label = { ...this.label, name, color: this.color };
      this.sessionResource.updateLabel(sessionId, updated).subscribe({
        next: () => {
          this.sessionData.labelsMap.set(updated.labelId, updated);
          this.activeModal.close(updated);
        },
        error: (err) => {
          this.saving = false;
          this.errorService.showError("Updating label failed", err);
        },
      });
    } else {
      const newLabel: Label = { sessionId, labelId: null, name, color: this.color, created: null };
      this.sessionResource
        .createLabel(sessionId, newLabel)
        .pipe(mergeMap((labelId) => this.sessionResource.getLabel(sessionId, labelId)))
        .subscribe({
          next: (created: Label) => {
            this.sessionData.labelsMap.set(created.labelId, created);
            this.activeModal.close(created);
          },
          error: (err) => {
            this.saving = false;
            this.errorService.showError("Creating label failed", err);
          },
        });
    }
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
