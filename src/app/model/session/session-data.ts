import { signal } from "@angular/core";
import { Dataset, Job, Label, Session } from "chipster-js-common";
import { SelectionOption } from "../../views/sessions/session/SelectionOption";

/**
 * The maps are signals, so that the views that show them are notified when they change.
 * Replace a map with a new one instead of changing it in place, e.g.
 * update((m) => new Map(m).set(id, dataset)), otherwise the signal won't notify.
 *
 * The object itself keeps its identity, so it can be passed as an input to the components that
 * read the maps in their own callbacks, like the websocket event subscriptions: they get the latest
 * maps from it, while an input of a map changes only when the parent is checked next time.
 */
export class SessionData {
  readonly session = signal<Session>(undefined);
  readonly datasetsMap = signal(new Map<string, Dataset>());
  readonly jobsMap = signal(new Map<string, Job>());
  readonly labelsMap = signal(new Map<string, Label>());
  readonly datasetTypeTags = signal(new Map<string, Map<string, string>>());
  cachedFileHeaders = new Map<string, Array<SelectionOption>>();
}
