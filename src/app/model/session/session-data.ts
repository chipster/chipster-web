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
  session: Session;
  readonly datasetsMap = signal(new Map<string, Dataset>());
  readonly jobsMap = signal(new Map<string, Job>());
  readonly labelsMap = signal(new Map<string, Label>());
  readonly datasetTypeTags = signal(new Map<string, Map<string, string>>());
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
   * events replace the copies with the server's. Returns a function that restores the previous
   * datasets when the update fails, for the datasets whose copy is still in the map.
   */
  setDatasets(datasets: Dataset[]): () => void {
    const previous = new Map(datasets.map((d) => [d.datasetId, this.datasetsMap().get(d.datasetId)]));
    this.datasetsMap.update((m) => {
      const updated = new Map(m);
      datasets.forEach((d) => updated.set(d.datasetId, d));
      return updated;
    });
    return () =>
      this.datasetsMap.update((m) => {
        const restored = new Map(m);
        datasets
          .filter((d) => restored.get(d.datasetId) === d)
          .forEach((d) => {
            const before = previous.get(d.datasetId);
            if (before) {
              restored.set(d.datasetId, before);
            } else {
              restored.delete(d.datasetId);
            }
          });
        return restored;
      });
  }
}
