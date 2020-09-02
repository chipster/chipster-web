import { Injectable, Input } from "@angular/core";
import { DatasetService } from "../../dataset.service";
import { Dataset, Job } from 'chipster-js-common';
import UtilsService from '../../../../../shared/utilities/utils';
import log from "loglevel";
import { SessionDataService } from '../../session-data.service';
import { RestErrorService } from '../../../../../core/errorhandler/rest-error.service';

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

  doLayoutAndSave(datasetMap: Map<string, Dataset>, jobMap: Map<string, Job>): void {
    let datasetsToUpdate = this.doLayout(datasetMap, jobMap);

    // update new dataset positions to server
    if (datasetsToUpdate.length > 0) {
      log.info("update " + datasetsToUpdate.length + " new dataset positions to server");

      this.sessionDataService.updateDatasets(datasetsToUpdate)
        .subscribe(null, err => this.restErrorService.showError("updating dataset position failed", err));
    }
  }


  doLayout(datasetMap: Map<string, Dataset>, jobMap: Map<string, Job>): Dataset[] {

    let datasetsToUpdate = [];
    // layout nodes that don't yet have a position

    // layout nodes with parents
    // sort by the creation date to make parents precede their children in the array
    let datasets = Array.from(datasetMap.values())
      .sort((a, b) => {
        return UtilsService.compareStringNullSafe(
          a.created,
          b.created
        );
      })

    datasets.forEach(d => {

      if (d.x != null && d.y != null) {
        return;
      }

      let sources = this.getSourceDatasets(d, datasetMap, jobMap);

      log.debug("dataset " + d.name + " sources ", sources);

      if (sources.length === 0) {
        const newRootPos = this.newRootPosition(datasets);
        d.x = newRootPos.x;
        d.y = newRootPos.y;
        
        datasetsToUpdate.push(d);
      } else {
        let firstSource = sources[0];

        if (firstSource.x == null || firstSource.y == null) {
          log.info("source dataset " + firstSource.name + " should have positions already. Incorrect timestamps?");
        } else {


          const nodeWidth =
          this.datasetService.hasOwnPhenodata(d)
            ? this.nodeWidth * 2 + this.xMargin
            : this.nodeWidth;

          const pos = this.newPosition(
            datasets,
            firstSource.x,
            firstSource.y,
            nodeWidth
          );
          d.x = pos.x;
          d.y = pos.y;
          
          datasetsToUpdate.push(d);
        }
      }
    });

    log.debug(datasetsToUpdate.length + "/" + datasets.length + " datasets layouted");

    return datasetsToUpdate;
  }

  getSourceDatasets(dataset: Dataset, datasetMap: Map<string, Dataset>, jobMap: Map<string, Job>): Dataset[] {

    if (dataset.sourceJob == null) {
      log.info("dataset's " + dataset.name + " source job is null");
      return [];
    }

    let sourceJob = jobMap.get(dataset.sourceJob);

    if (sourceJob == null) {
      log.info("dataset's " + dataset.name + " source job not found");
      return [];      
    }

    let sources = [];
    
    // iterate over the inputs of the source job
    sourceJob.inputs
      .forEach(input => {
        let source = datasetMap.get(input.datasetId);
        if (source != null) {
          sources.push(source);
        } else {
          log.info("job's " + sourceJob.toolId + " input dataset for input '" + input.inputId + "' not found");
        }
      });

    return sources;
  }

  newRootPosition(datasets: Dataset[]) {
    return this.newPosition(
      datasets,
      null,
      null,
      this.nodeWidth,
      this.nodeHeight * 2 + this.yMargin
    );
  }

  newPosition(
    datasets: Dataset[],
    parentX: number,
    parentY: number,
    width = this.nodeWidth,
    height = this.nodeHeight
  ) {
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
      x: x,
      y: y
    };
  }

  intersectsAny(
    datasets: Dataset[],
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    return datasets.some((node: Dataset) => {
      return this.intersectsNode(node, x, y, w, h);
    });
  }

  intersectsNode(
    dataset: Dataset,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    if (dataset.x && dataset.y) {
      const nodeWidth = this.datasetService.hasOwnPhenodata(dataset)
        ? this.nodeWidth + this.xMargin + this.nodeWidth
        : this.nodeWidth;
      return (
        x + w >= dataset.x &&
        x < dataset.x + nodeWidth &&
        y + h >= dataset.y &&
        y < dataset.y + this.nodeHeight
      );
    } else {
      return false;
    }
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

    const x_overlap = Math.max(
      0,
      Math.min(rectAxMax, rectBxMax) - Math.max(rectAx, rectBx)
    );
    const y_overlap = Math.max(
      0,
      Math.min(rectAyMax, rectByMax) - Math.max(rectAy, rectBy)
    );

    const overlap = x_overlap * y_overlap;
    if (overlap > 0) {
      return true;
    }

    return false;
  }

  isOverLappingWithCoord(
    topLeft: any,
    bottomRight: any,
    rectB: any,
    svgRect: any
  ) {
    const rectAx = topLeft[0] + svgRect.left;
    const rectAy = topLeft[1] + svgRect.top;
    const rectAxMax = bottomRight[0] + svgRect.left;
    const rectAyMax = bottomRight[1] + svgRect.top;

    const rectBx = rectB.left;
    const rectBy = rectB.top;
    const rectBxMax = rectB.left + rectB.width;
    const rectByMax = rectB.top + rectB.height;

    const x_overlap = Math.max(
      0,
      Math.min(rectAxMax, rectBxMax) - Math.max(rectAx, rectBx)
    );
    const y_overlap = Math.max(
      0,
      Math.min(rectAyMax, rectByMax) - Math.max(rectAy, rectBy)
    );

    const overlap = x_overlap * y_overlap;
    if (overlap > 0) {
      return true;
    }

    return false;
  }
}
