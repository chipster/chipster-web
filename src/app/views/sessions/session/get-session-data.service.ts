import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";
import { SessionData } from "../../../model/session/session-data";
import { Tags, TypeTagService } from "../../../shared/services/typetag.service";
import { DatasetService } from "./dataset.service";

@Injectable()
export class GetSessionDataService {
  private sessionData: SessionData;

  constructor(
    private datasetService: DatasetService,
    private typeTagService: TypeTagService
  ) {}

  /**
   * Only use this in session component when loading a new session.
   * @param sessionData
   */
  setSessionData(sessionData: SessionData): void {
    this.sessionData = sessionData;
  }

  getSessionData(): SessionData {
    return this.sessionData;
  }

  /**
   * If given dataset has its own phenodata, return that phenodata.
   * Otherwise search ancestors for a dataset which has phenodata and return phenodata
   * of that ancestor if found.
   *
   * @param dataset
   */
  getPhenodata(dataset: Dataset): string {
    return this.datasetService.getOwnPhenodata(
      this.getPhenodataDataset(dataset)
    );
  }

  /**
   * If given dataset has its own phenodata, return given dataset.
   * Otherwise search ancestors for a dataset which has phenodata and return that
   * ancestor if found.
   *
   * @param dataset
   */
  getPhenodataDataset(dataset: Dataset): Dataset {
    if (dataset == null) {
      return null;
    }

    // if dataset has it own phenodata return that
    if (this.datasetService.hasOwnPhenodata(dataset)) {
      return dataset;
    }

    // find first ancestor that has phenodata
    const ancestorsWithPhenodata = this.getAncestorDatasetsWithPhenodata(
      dataset
    );
    return ancestorsWithPhenodata.length > 0 ? ancestorsWithPhenodata[0] : null;
  }

  getAncestorDatasetsWithPhenodata(dataset: Dataset): Dataset[] {
    if (
      !(
        this.typeTagService.has(this.sessionData, dataset, Tags.GENE_EXPRS) ||
        this.typeTagService.has(this.sessionData, dataset, Tags.BAM)
      )
    ) {
      return [];
    }
    return this.getAncestorsBottomUpBreadthFirstWithFilter(
      this.getParentDatasets(dataset),
      (d: Dataset) => this.datasetService.hasOwnPhenodata(d)
    );
  }

  private getAncestorsBottomUpBreadthFirstWithFilter(
    datasets: Dataset[],
    filter: (Dataset) => boolean
  ): Dataset[] {
    // stop if no datasets
    if (datasets.length < 1) {
      return [];
    }

    // add datasets with phenodata to results
    const datasetsWithPhenodata = datasets.filter(filter);

    // get parents of the datasets and process them next
    const allParents = datasets.reduce(
      (previousLevelParents: Dataset[], parent: Dataset) => {
        return previousLevelParents.concat(this.getParentDatasets(parent));
      },
      []
    );

    return datasetsWithPhenodata.concat(
      this.getAncestorsBottomUpBreadthFirstWithFilter(allParents, filter)
    );
  }

  getParentDatasets(dataset: Dataset): Dataset[] {
    // if source job exists and has inputs, return those that still exist on this session
    const sourceJob = this.sessionData.jobsMap.get(dataset.sourceJob);
    return sourceJob != null &&
      sourceJob.inputs != null &&
      sourceJob.inputs.length > 1
      ? sourceJob.inputs
          .map(jobInput => this.sessionData.datasetsMap.get(jobInput.datasetId))
          .filter(parentDataset => parentDataset != null)
      : [];
  }
}
