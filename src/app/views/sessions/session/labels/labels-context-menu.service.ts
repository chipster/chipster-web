import { Injectable } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Dataset, Label } from "chipster-js-common";
import { Observable, forkJoin, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { getLabelColor } from "./label-palette";

export type LabelSelectionState = "checked" | "unchecked" | "indeterminate";

export interface LabelMenuItem {
  label: Label;
  state: LabelSelectionState;
  displayTitle: string;
  displayHtml: string;
  displaySafeHtml: SafeHtml;
}

@Injectable()
export class LabelsContextMenuService {
  constructor(
    private sessionResource: SessionResource,
    private errorService: ErrorService,
    private sanitizer: DomSanitizer,
  ) {}

  buildItems(datasets: Dataset[], sessionData: SessionData): LabelMenuItem[] {
    const labels = Array.from(sessionData.labelsMap.values()).sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    );
    return labels.map((label) => {
      const state = this.computeState(datasets, label);
      const html = this.buildHtml(label, state);
      return {
        label,
        state,
        displayTitle: this.prefix(state) + (label.name ?? ""),
        displayHtml: html,
        displaySafeHtml: this.sanitizer.bypassSecurityTrustHtml(html),
      };
    });
  }

  private buildHtml(label: Label, state: LabelSelectionState): string {
    const color = getLabelColor(label.color).background;
    const dot =
      `<span style="display:inline-block;width:0.6em;height:0.6em;border-radius:50%;` +
      `background:${color};margin-right:0.25em;vertical-align:middle"></span>`;
    return `${this.checkboxHtml(state)}${dot}<span>${this.escapeHtml(label.name ?? "")}</span>`;
  }

  private checkboxHtml(state: LabelSelectionState): string {
    const boxBase =
      "display:inline-block;width:13px;height:13px;border-radius:2px;" +
      "box-sizing:border-box;vertical-align:middle;margin-right:0.75em;" +
      "text-align:center;line-height:11px;font-size:10px;font-weight:bold";
    if (state === "checked") {
      return (
        `<span style="${boxBase};border:1px solid #0d6efd;background:#0d6efd;color:#fff">✓</span>`
      );
    }
    if (state === "indeterminate") {
      return (
        `<span style="${boxBase};border:1px solid #0d6efd;background:#0d6efd;position:relative">` +
        `<span style="display:block;position:absolute;top:50%;left:50%;` +
        `width:7px;height:2px;margin-top:-1px;margin-left:-3.5px;background:#fff"></span>` +
        `</span>`
      );
    }
    return `<span style="${boxBase};border:1px solid #adb5bd;background:#fff"></span>`;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  toggleLabel(datasets: Dataset[], label: Label, sessionData: SessionData): Observable<void> {
    if (datasets.length === 0) {
      return of(undefined);
    }

    const state = this.computeState(datasets, label);
    const shouldRemove = state === "checked";

    const sessionId = sessionData.session.sessionId;
    const updates: Dataset[] = [];

    for (const dataset of datasets) {
      const before = new Set(dataset.labelIds ?? []);
      const after = new Set(before);
      if (shouldRemove) {
        after.delete(label.labelId);
      } else {
        after.add(label.labelId);
      }
      if (!this.setsEqual(before, after)) {
        dataset.labelIds = Array.from(after);
        updates.push(dataset);
      }
    }

    if (updates.length === 0) {
      return of(undefined);
    }

    return forkJoin(
      updates.map((d) =>
        this.sessionResource.updateDataset(sessionId, d).pipe(
          catchError((err) => {
            this.errorService.showError("Updating dataset labels failed", err);
            return of(null);
          }),
        ),
      ),
    ).pipe(map(() => undefined));
  }

  private computeState(datasets: Dataset[], label: Label): LabelSelectionState {
    if (datasets.length === 0) {
      return "unchecked";
    }
    const count = datasets.filter((d) => (d.labelIds ?? []).includes(label.labelId)).length;
    if (count === 0) {
      return "unchecked";
    }
    if (count === datasets.length) {
      return "checked";
    }
    return "indeterminate";
  }

  private prefix(state: LabelSelectionState): string {
    if (state === "checked") return "✓ ";
    if (state === "indeterminate") return "– ";
    return "  ";
  }

  private setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
}
