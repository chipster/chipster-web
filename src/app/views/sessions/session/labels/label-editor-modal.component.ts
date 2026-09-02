import { Component, Input, OnInit } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Label } from "chipster-js-common";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { DEFAULT_LABEL_COLOR, LABEL_PALETTE, LabelColor } from "./label-palette";

@Component({
  selector: "ch-label-editor-modal",
  templateUrl: "./label-editor-modal.component.html",
  styleUrls: ["./label-editor-modal.component.less"],
})
export class LabelEditorModalComponent implements OnInit {
  @Input() sessionData: SessionData;
  // when set, the modal edits this label; when null, it creates a new one
  @Input() label: Label = null;

  readonly maxNameLength = 30;
  name = "";
  color: string = DEFAULT_LABEL_COLOR;
  saving = false;

  constructor(
    public activeModal: NgbActiveModal,
    private sessionResource: SessionResource,
    private errorService: ErrorService,
  ) {}

  ngOnInit(): void {
    if (this.label != null) {
      this.name = this.label.name ?? "";
      this.color = this.label.color ?? DEFAULT_LABEL_COLOR;
    } else {
      // new label: pick the first palette color not yet used in the session
      const usedColors = new Set(
        Array.from(this.sessionData.labelsMap.values()).map((l) => l.color),
      );
      const firstUnused = LABEL_PALETTE.find((c) => !usedColors.has(c.hex));
      this.color = firstUnused?.hex ?? DEFAULT_LABEL_COLOR;
    }
  }

  get isEdit(): boolean {
    return this.label != null;
  }

  // Picker contents. When editing a label whose stored color isn't in the
  // palette (palette changed since the label was created, or the value came
  // from outside this app), append an extra swatch for that color so the
  // current selection stays visible. Disappears once the user picks any
  // palette swatch.
  get displayPalette(): LabelColor[] {
    if (this.color && !LABEL_PALETTE.some((c) => c.hex === this.color)) {
      return [...LABEL_PALETTE, { hex: this.color, name: "Current color" }];
    }
    return LABEL_PALETTE;
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
      this.sessionResource.createLabel(sessionId, newLabel).subscribe({
        next: (labelId: string) => {
          // build the created label locally from the known fields instead of
          // re-fetching it; the LABEL websocket event populates labelsMap with
          // the authoritative copy (incl. server-set created), same as datasets
          // and jobs
          const created: Label = { ...newLabel, labelId };
          this.sessionData.labelsMap.set(labelId, created);
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
