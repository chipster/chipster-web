import { Injectable } from "@angular/core";
import { Dataset, Label } from "chipster-js-common";
import { Observable, forkJoin, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ErrorService } from "../../../../core/errorhandler/error.service";
import { SessionData } from "../../../../model/session/session-data";
import { SessionResource } from "../../../../shared/resources/session.resource";
import { resolveLabelColor } from "./label-palette";

export type LabelSelectionState = "checked" | "unchecked" | "indeterminate";

export interface LabelMenuItem {
  label: Label;
  state: LabelSelectionState;
  // Standalone HTML string for non-Angular renderers (e.g. d3-context-menu).
  // Angular templates should NOT bind this via [innerHTML]; use
  // <ch-label-menu-item-content [item]="item"> instead so DOM updates only
  // happen when actual values change.
  displayHtml: string;
  colorBg: string;
}

@Injectable()
export class LabelsContextMenuService {
  // Most recently toggled label (added or removed). Used by surfaces like the
  // workflow toolbar's split-button to default the next action to whatever the
  // user just did.
  private lastUsedLabelId: string | null = null;

  constructor(
    private sessionResource: SessionResource,
    private errorService: ErrorService,
  ) {}

  getLastUsedLabel(sessionData: SessionData): Label | null {
    if (!this.lastUsedLabelId || !sessionData?.labelsMap) {
      return null;
    }
    return sessionData.labelsMap.get(this.lastUsedLabelId) ?? null;
  }

  // Default label for surfaces that need to pick one (e.g. the workflow
  // toolbar's split-button left part): the most recently toggled label if it
  // still exists in this session, otherwise the alphabetically first label.
  // Returns null if the session has no labels.
  getDefaultLabel(sessionData: SessionData): Label | null {
    const lastUsed = this.getLastUsedLabel(sessionData);
    if (lastUsed) {
      return lastUsed;
    }
    if (!sessionData?.labelsMap || sessionData.labelsMap.size === 0) {
      return null;
    }
    return Array.from(sessionData.labelsMap.values()).sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    )[0];
  }

  // For callers that apply or remove labels without going through toggleLabel()
  // (e.g. the Edit-labels modal which commits a batch of changes). Lets the
  // workflow toolbar's split-button track those actions too.
  recordLastUsedLabel(labelId: string): void {
    this.lastUsedLabelId = labelId;
  }

  buildItems(datasets: Dataset[], sessionData: SessionData): LabelMenuItem[] {
    const labels = Array.from(sessionData.labelsMap.values()).sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? ""),
    );
    return labels.map((label) => {
      const state = this.computeState(datasets, label);
      const colorBg = resolveLabelColor(label.color);
      return {
        label,
        state,
        displayHtml: this.buildHtml(label, state, colorBg),
        colorBg,
      };
    });
  }

  private buildHtml(label: Label, state: LabelSelectionState, colorBg: string): string {
    const dot =
      `<span style="display:inline-block;width:0.6em;height:0.6em;border-radius:50%;` +
      `background:${colorBg};margin-right:0.25em;vertical-align:middle"></span>`;
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

    this.lastUsedLabelId = label.labelId;

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

  private setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
}
