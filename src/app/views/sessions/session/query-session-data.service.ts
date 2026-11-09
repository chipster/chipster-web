import { Injectable, inject } from "@angular/core";
import { Dataset, PhenodataUtils, Job } from "chipster-js-common";
import { SessionData } from "../../../model/session/session-data";
import { Tags, TypeTagService } from "../../../shared/services/typetag.service";

/**
 * Service for querying session data locally.
 *
 *
 *
 */
@Injectable({ providedIn: "root" })
export class QuerySessionDataService {
  private typeTagService = inject(TypeTagService);

  public getAncestorDatasetsBottomUpBreadthFirst(sessionData: SessionData, dataset: Dataset): Array<Dataset> {
    return PhenodataUtils.getAncestorsBottomUpBreadthFirstWithFilter(
      [dataset],
      () => true,
      ...this.phenodataMaps(sessionData),
    );
  }

  /**
   * If given dataset has its own phenodata, return that phenodata.
   * Otherwise search ancestors for a dataset which has phenodata and return phenodata
   * of that ancestor if found.
   *
   * @param dataset
   */
  getPhenodata(sessionData: SessionData, dataset: Dataset): string {
    return PhenodataUtils.getPhenodata(dataset, ...this.phenodataMaps(sessionData), (candidate) =>
      this.isPhenodataType(sessionData, candidate),
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
    return PhenodataUtils.getPhenodataDataset(dataset, ...this.phenodataMaps(sessionData), (candidate) =>
      this.isPhenodataType(sessionData, candidate),
    );
  }

  getAncestorDatasetsWithPhenodata(sessionData: SessionData, dataset: Dataset): Dataset[] {
    return PhenodataUtils.getAncestorDatasetsWithPhenodata(dataset, ...this.phenodataMaps(sessionData), (candidate) =>
      this.isPhenodataType(sessionData, candidate),
    );
  }

  /**
   * The maps for PhenodataUtils of chipster-js-common, which takes them as Map, but only reads them
   */
  private phenodataMaps(sessionData: SessionData): [Map<string, Job>, Map<string, Dataset>] {
    return [sessionData.jobsMap() as Map<string, Job>, sessionData.datasetsMap() as Map<string, Dataset>];
  }

  isPhenodataType(sessionData: SessionData, dataset: Dataset) {
    return (
      this.typeTagService.has(sessionData, dataset, Tags.GENE_EXPRS) ||
      this.typeTagService.has(sessionData, dataset, Tags.BAM) ||
      this.typeTagService.has(sessionData, dataset, Tags.MOTHUR_SHARED) ||
      this.typeTagService.has(sessionData, dataset, Tags.R_RDA)
    );
  }

  getChildren(datasets: Dataset[], datasetsMap: ReadonlyMap<string, Dataset>, jobsMap: ReadonlyMap<string, Job>) {
    // map takes care of duplicates
    const allChildren = new Map<string, Dataset>();

    const allDatasets = Array.from(datasetsMap.values());

    Array.from(datasets).forEach((dataset) => {
      const ownChildren = [];
      allDatasets.forEach((d) => {
        if (d.sourceJob != null) {
          const sourceJob = jobsMap.get(d.sourceJob);
          if (sourceJob != null) {
            sourceJob.inputs.forEach((i) => {
              if (i.datasetId === dataset.datasetId) {
                ownChildren.push(d);
              }
            });
          }
        }
      });

      const children = this.getChildren(ownChildren, datasetsMap, jobsMap);

      ownChildren.forEach((d) => allChildren.set(d.datasetId, d));
      children.forEach((d) => allChildren.set(d.datasetId, d));
    });

    return Array.from(allChildren.values());
  }
}
