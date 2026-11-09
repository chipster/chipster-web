import { signal } from "@angular/core";
import { Dataset, Job, Label, Session } from "chipster-js-common";
import { SelectionOption } from "../../views/sessions/session/SelectionOption";

/**
 * The maps are signals, so that the views that show them are notified when they change.
 * Replace a map with a new one instead of changing it in place, e.g.
 * update((m) => UtilsService.mapWith(m, id, dataset)), otherwise the signal won't notify. The maps
 * are typed ReadonlyMap, so that a set() or delete() on the map itself doesn't compile.
 *
 * Replacing the map says nothing about its values: they are shared objects that a few places
 * still change in place (the positions that the workflow graph's drag and auto layout set, and the
 * phenodata edits), and the server's UPDATE event replaces them right after.
 *
 * The object itself keeps its identity, so it can be passed as an input to the components that
 * read the maps in their own callbacks, like the websocket event subscriptions: they get the latest
 * maps from it, while an input of a map changes only when the parent is checked next time.
 */
export class SessionData {
  readonly session = signal<Session>(undefined);
  readonly datasetsMap = signal<ReadonlyMap<string, Dataset>>(new Map());
  readonly jobsMap = signal<ReadonlyMap<string, Job>>(new Map());
  readonly labelsMap = signal<ReadonlyMap<string, Label>>(new Map());
  readonly datasetTypeTags = signal<ReadonlyMap<string, Map<string, string>>>(new Map());
  cachedFileHeaders = new Map<string, Array<SelectionOption>>();

  /**
   * The latest copies of the datasets from datasetsMap: the datasets of the selection aren't
   * updated by the dataset events. A dataset that isn't in the map is returned as it is.
   */
  latestDatasets(datasets: Dataset[]): Dataset[] {
    const map = this.datasetsMap();
    return datasets.map((d) => map.get(d.datasetId) ?? d);
  }

  /**
   * Put copies of datasets in datasetsMap before their update is sent, so that the views update at
   * once and are notified. A change in place wouldn't notify the OnPush views. The datasets' update
   * events replace the copies with the server's. A dataset that isn't in the map any more, deleted
   * while it was selected, isn't brought back; its update fails on its own.
   *
   * Returns a function that restores the previous datasets when the update fails: of the datasets
   * given to it, or all of them, those whose copy is still in the map.
   */
  setDatasets(datasets: Dataset[]): (failed?: Dataset[]) => void {
    const map = this.datasetsMap();
    const copies = datasets.filter((d) => map.has(d.datasetId));
    const previous = new Map(copies.map((d) => [d.datasetId, map.get(d.datasetId)]));
    if (copies.length > 0) {
      this.datasetsMap.update((m) => {
        const updated = new Map(m);
        copies.forEach((d) => updated.set(d.datasetId, d));
        return updated;
      });
    }
    return (failed = copies) => {
      const stale = failed.filter((d) => previous.has(d.datasetId) && this.datasetsMap().get(d.datasetId) === d);
      if (stale.length > 0) {
        this.datasetsMap.update((m) => {
          const restored = new Map(m);
          stale.forEach((d) => restored.set(d.datasetId, previous.get(d.datasetId)));
          return restored;
        });
      }
    };
  }
}
