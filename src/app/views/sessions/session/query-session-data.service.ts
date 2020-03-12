import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as _ from "lodash";
import { SessionData } from "../../../model/session/session-data";
import { Tags, TypeTagService } from "../../../shared/services/typetag.service";
import { DatasetService } from "./dataset.service";

/**
 * Service for querying session data locally.
 *
 *
 *
 */
@Injectable()
export class QuerySessionDataService {
  constructor(
    private datasetService: DatasetService,
    private typeTagService: TypeTagService
  ) {}

  public getAncestorDatasetsBottomUpBreadthFirst(
    sessionData: SessionData,
    dataset: Dataset
  ): Array<Dataset> {
    return this.getAncestorsBottomUpBreadthFirstWithFilter(
      sessionData,
      [dataset],
      () => true
    );
  }

  /**
   * TODO Recursive and that _.uniqWith maybe not good.
   *
   * @param sessionData
   * @param datasets
   * @param filter
   */
  public getAncestorsBottomUpBreadthFirstWithFilter(
    sessionData: SessionData,
    datasets: Dataset[],
    filter: (Dataset) => boolean
  ): Dataset[] {
    // stop if no datasets
    if (datasets.length < 1) {
      return [];
    }
    // get all parents
    const allParents = datasets.reduce(
      (parents: Dataset[], dataset: Dataset) => {
        return parents.concat(this.getParentDatasets(sessionData, dataset));
      },
      []
    );

    // add parents which pass the filter to results
    const filteredAncestors = allParents.filter(filter);

    return _.uniqWith(
      filteredAncestors.concat(
        this.getAncestorsBottomUpBreadthFirstWithFilter(
          sessionData,
          allParents,
          filter
        )
      ),
      (d1: Dataset, d2: Dataset) => d1.datasetId === d2.datasetId
    );
  }

  public getParentDatasets(
    sessionData: SessionData,
    dataset: Dataset
  ): Dataset[] {
    // if source job exists and has inputs, return those that still exist on this session
    const sourceJob = sessionData.jobsMap.get(dataset.sourceJob);
    return sourceJob != null &&
      sourceJob.inputs != null &&
      sourceJob.inputs.length > 0
      ? sourceJob.inputs
          .map(jobInput => sessionData.datasetsMap.get(jobInput.datasetId))
          .filter(parentDataset => parentDataset != null)
      : [];
  }

  /**
   * If given dataset has its own phenodata, return that phenodata.
   * Otherwise search ancestors for a dataset which has phenodata and return phenodata
   * of that ancestor if found.
   *
   * @param dataset
   */
  getPhenodata(sessionData: SessionData, dataset: Dataset): string {
    return this.datasetService.getOwnPhenodata(
      this.getPhenodataDataset(sessionData, dataset)
    );
  }

  /**
   * If given dataset has its own phenodata, return given dataset.
   * Otherwise search ancestors for a dataset which has phenodata and return that
   * ancestor if found.
   *
   * @param dataset
   */
  getPhenodataDataset(sessionData: SessionData, dataset: Dataset): Dataset {
    if (dataset == null) {
      return null;
    }

    // if dataset has it own phenodata return that
    if (this.datasetService.hasOwnPhenodata(dataset)) {
      return dataset;
    }

    // find first ancestor that has phenodata
    const ancestorsWithPhenodata = this.getAncestorDatasetsWithPhenodata(
      sessionData,
      dataset
    );
    return ancestorsWithPhenodata.length > 0 ? ancestorsWithPhenodata[0] : null;
  }

  getAncestorDatasetsWithPhenodata(
    sessionData: SessionData,
    dataset: Dataset
  ): Dataset[] {
    if (
      !(
        this.typeTagService.has(sessionData, dataset, Tags.GENE_EXPRS) ||
        this.typeTagService.has(sessionData, dataset, Tags.BAM)
      )
    ) {
      return [];
    }

    return this.getAncestorsBottomUpBreadthFirstWithFilter(
      sessionData,
      [dataset],
      (d: Dataset) => this.datasetService.hasOwnPhenodata(d)
    );
  }
}
