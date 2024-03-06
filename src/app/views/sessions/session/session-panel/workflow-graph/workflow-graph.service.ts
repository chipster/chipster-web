import { Injectable, Input } from "@angular/core";
import { Dataset, Job } from "chipster-js-common";
import log from "loglevel";
import { cloneDeep } from "lodash-es";
import { DatasetService } from "../../dataset.service";
import UtilsService from "../../../../../shared/utilities/utils";
import { SessionDataService } from "../../session-data.service";
import { RestErrorService } from "../../../../../core/errorhandler/rest-error.service";

/**
 * @desc Service functions needed to define the positions of the nodes and links
 *       in the workflowgraph graph
 */
@Injectable()
export class WorkflowGraphService {
  readonly nodeHeight = 22;
  // nodeWidth = 36;
  readonly nodeWidth = 48;

  // leave some space for the node border
  readonly nodeMinX = 2;
  readonly nodeMinY = 2;

  readonly phenodataRadius = this.nodeHeight / 2;
  readonly phenodataMargin = this.phenodataRadius;

  xMargin = this.nodeWidth / 4;
  yMargin = this.nodeHeight;

  constructor(
    private datasetService: DatasetService,
    private sessionDataService: SessionDataService,
    private restErrorService: RestErrorService,
  ) {}

  resetDoAndSaveLayout(datasets: Dataset[], datasetsMap: Map<string, Dataset>, jobsMap: Map<string, Job>): void {
    // create a copy of the datasets to wait for the websocket updates
    const datasetsMapCopy = new Map();

    datasetsMap.forEach((d) => {
      datasetsMapCopy.set(d.datasetId, cloneDeep(d));
    });

    // create a set of datasetIds for efficient search
    const datasetIdsToLayout = new Set();
    datasets.forEach((d) => {
      datasetIdsToLayout.add(d.datasetId);
    });

    const resetedDatasets: Dataset[] = [];

    // clear the coordinates of the Dataset instances in the map and create a list of cleared
    // datasets that have to be layouted
    Array.from(datasetsMapCopy.values())
      .filter((d) => datasetIdsToLayout.has(d.datasetId))
      .forEach((d) => {
        d.x = null;
        d.y = null;
        resetedDatasets.push(d);
      });

    this.doAndSaveLayout(resetedDatasets, datasetsMapCopy, jobsMap);
  }

  doAndSaveLayout(datasets: Dataset[], datasetsMap: Map<string, Dataset>, jobMap: Map<string, Job>): void {
    const datasetsToUpdate = this.doLayout(datasets, datasetsMap, jobMap);

    // update new dataset positions to server
    if (datasetsToUpdate.length > 0) {
      log.info("update " + datasetsToUpdate.length + " new dataset positions to server");

      this.sessionDataService
        .updateDatasets(datasetsToUpdate)
        .subscribe(null, (err) => this.restErrorService.showError("updating dataset position failed", err));
    }
  }

  /**
   * Layout datasets
   *
   * Layout all datasets in the datasets array and their unpositioned parents. Only the datasetId is
   * taken from the array, all other information is taken from the datasetMap, including the
   * position. The parameter type is an array of Datasets instead of an array of datasetIds just to
   * make it easier to call this method.
   *
   * @param datasets
   * @param datasetMap
   * @param jobMap
   */
  doLayout(datasets: Dataset[], datasetMap: Map<string, Dataset>, jobMap: Map<string, Job>): Dataset[] {
    // layout nodes with parents
    // sort by the creation date to make parents precede their children in the array and to make this
    // more deterministic
    datasets = datasets
      .sort((a, b) => UtilsService.compareStringNullSafe(a.created, b.created))
      .filter((d) => d.x == null && d.y == null);

    const datasetsToUpdate = [];

    datasets.forEach((d) => {
      datasetsToUpdate.push(...this.doLayoutRecursive(d.datasetId, datasetMap, jobMap));
    });

    return datasetsToUpdate;
  }

  doLayoutRecursive(datasetId: string, datasetMap: Map<string, Dataset>, jobMap: Map<string, Job>): Dataset[] {
    const dataset = datasetMap.get(datasetId);

    // check if this dataset has a position already
    if (dataset.x != null && dataset.y != null) {
      return [];
    }

    const datasetsToUpdate = [];

    // find parents
    const sources = this.getSourceDatasets(dataset, datasetMap, jobMap);

    // check if this is a root
    if (sources.length === 0) {
      const newRootPos = this.newRootPosition(Array.from(datasetMap.values()));
      dataset.x = newRootPos.x;
      dataset.y = newRootPos.y;

      datasetsToUpdate.push(dataset);
    } else {
      const firstSource = sources[0];

      // check if parent has a position
      if (firstSource.x == null || firstSource.y == null) {
        // layout parent first
        datasetsToUpdate.push(...this.doLayoutRecursive(firstSource.datasetId, datasetMap, jobMap));
      }

      // now the parent(s) have position, let's calculate ours
      const nodeWidth = this.datasetService.hasOwnPhenodata(dataset)
        ? this.nodeWidth * 2 + this.xMargin
        : this.nodeWidth;

      const pos = this.newPosition(Array.from(datasetMap.values()), firstSource.x, firstSource.y, nodeWidth);
      dataset.x = pos.x;
      dataset.y = pos.y;

      datasetsToUpdate.push(dataset);
    }

    return datasetsToUpdate;
  }

  getSourceDatasets(dataset: Dataset, datasetMap: Map<string, Dataset>, jobMap: Map<string, Job>): Dataset[] {
    if (dataset.sourceJob == null) {
      log.info("dataset's " + dataset.name + " source job is null");
      return [];
    }

    const sourceJob = jobMap.get(dataset.sourceJob);

    if (sourceJob == null) {
      log.info("dataset's " + dataset.name + " source job not found");
      return [];
    }

    const sources = [];

    // iterate over the inputs of the source job
    sourceJob.inputs.forEach((input) => {
      const source = datasetMap.get(input.datasetId);
      if (source != null) {
        sources.push(source);
      } else {
        log.info("job's " + sourceJob.toolId + " input dataset for input '" + input.inputId + "' not found");
      }
    });

    return sources;
  }

  newRootPosition(datasets: Dataset[]) {
    return this.newPosition(datasets, null, null, this.nodeWidth, this.nodeHeight * 2 + this.yMargin);
  }

  newPosition(datasets: Dataset[], parentX: number, parentY: number, width = this.nodeWidth, height = this.nodeHeight) {
    let x = this.nodeMinX;
    let y = this.nodeMinY;

    if (parentX) {
      x = parentX;
    }
    if (parentY) {
      y = parentY + this.nodeHeight + this.yMargin;
    }

    while (this.intersectsAny(datasets, x, y, width, height)) {
      x += this.nodeWidth + this.xMargin;
    }

    return {
      x,
      y,
    };
  }

  intersectsAny(datasets: Dataset[], x: number, y: number, w: number, h: number) {
    return datasets.some((node: Dataset) => this.intersectsNode(node, x, y, w, h));
  }

  intersectsNode(dataset: Dataset, x: number, y: number, w: number, h: number) {
    if (dataset.x && dataset.y) {
      const nodeWidth = this.datasetService.hasOwnPhenodata(dataset)
        ? this.nodeWidth + this.xMargin + this.nodeWidth
        : this.nodeWidth;
      return x + w >= dataset.x && x < dataset.x + nodeWidth && y + h >= dataset.y && y < dataset.y + this.nodeHeight;
    }
    return false;
  }

  isOverLapping(rectA: any, rectB: any) {
    const rectAx = rectA.left;
    const rectAy = rectA.top;
    const rectAxMax = rectA.left + rectA.width;
    const rectAyMax = rectA.top + rectA.height;

    const rectBx = rectB.left;
    const rectBy = rectB.top;
    const rectBxMax = rectB.left + rectB.width;
    const rectByMax = rectB.top + rectB.height;

    const x_overlap = Math.max(0, Math.min(rectAxMax, rectBxMax) - Math.max(rectAx, rectBx));
    const y_overlap = Math.max(0, Math.min(rectAyMax, rectByMax) - Math.max(rectAy, rectBy));

    const overlap = x_overlap * y_overlap;
    if (overlap > 0) {
      return true;
    }

    return false;
  }

  isOverLappingWithCoord(topLeft: any, bottomRight: any, rectB: any, svgRect: any) {
    const rectAx = topLeft[0] + svgRect.left;
    const rectAy = topLeft[1] + svgRect.top;
    const rectAxMax = bottomRight[0] + svgRect.left;
    const rectAyMax = bottomRight[1] + svgRect.top;

    const rectBx = rectB.left;
    const rectBy = rectB.top;
    const rectBxMax = rectB.left + rectB.width;
    const rectByMax = rectB.top + rectB.height;

    const x_overlap = Math.max(0, Math.min(rectAxMax, rectBxMax) - Math.max(rectAx, rectBx));
    const y_overlap = Math.max(0, Math.min(rectAyMax, rectByMax) - Math.max(rectAy, rectBy));

    const overlap = x_overlap * y_overlap;
    if (overlap > 0) {
      return true;
    }

    return false;
  }
}
