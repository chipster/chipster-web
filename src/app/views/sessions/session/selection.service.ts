import Dataset from "../../../model/session/dataset";
import Job from "../../../model/session/job";
import Tool from "../../../model/session/tool";
import * as _ from "lodash";
import {Injectable} from "@angular/core";
import {Subject} from "rxjs";
import SelectionEvent from "../../../model/events/selectionevent";
import {Action} from "../../../model/events/selectionevent";
import {Store} from "@ngrx/store";

@Injectable()
export class SelectionService {

    // selections
    selectedDatasets: Array<Dataset>;
    selectedJobs: Array<Job>;

    // tool selection
    selectedTool: Tool = null;
    selectedToolIndex = -1;
    istoolselected = false;

    constructor(private store: Store<any>) {

      // Sync selected datasets from store
      this.store.select('selectedDatasets').subscribe(
        (datasets: Array<Dataset>) => { this.selectedDatasets = datasets },
        (error: any) => { console.error('Error fetching datasets from store', error) }
      );

      // Sync selected jobs from store
      this.store.select('selectedJobs').subscribe(
        (jobs: Array<Job>) => { this.selectedJobs = jobs },
        (error: any) => { console.error('Error fetching jobs from store', error) }
      );
    }

    isJobSelected(): boolean {
        return this.selectedJobs.length > 0;
    }

    isSelectedDataset(data: Dataset): boolean {
        return this.selectedDatasets.indexOf(data) !== -1;
    }

}
