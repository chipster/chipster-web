import { Injectable } from "@angular/core";
import { Dataset, PhenodataUtils, Job } from "chipster-js-common";
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
    return PhenodataUtils.getAncestorsBottomUpBreadthFirstWithFilter(
      [dataset],
      () => true,
      sessionData.jobsMap,
      sessionData.datasetsMap);
  }

  /**
   * If given dataset has its own phenodata, return that phenodata.
   * Otherwise search ancestors for a dataset which has phenodata and return phenodata
   * of that ancestor if found.
   *
   * @param dataset
   */
  getPhenodata(sessionData: SessionData, dataset: Dataset): string {
    return PhenodataUtils.getPhenodata(
      dataset,
      sessionData.jobsMap,
      sessionData.datasetsMap,
      dataset => this.isPhenodataType(sessionData, dataset));
  }

  /**
   * If given dataset has its own phenodata, return given dataset.
   * Otherwise search ancestors for a dataset which has phenodata and return that
   * ancestor if found.
   *
   * @param dataset
   */
  getPhenodataDataset(sessionData: SessionData, dataset: Dataset): Dataset {
    return PhenodataUtils.getPhenodataDataset(
      dataset,
      sessionData.jobsMap,
      sessionData.datasetsMap,
      dataset => this.isPhenodataType(sessionData, dataset));    
  }


  getAncestorDatasetsWithPhenodata(
    sessionData: SessionData, 
    dataset: Dataset): Dataset[] {      
    return PhenodataUtils.getAncestorDatasetsWithPhenodata(
      dataset,
      sessionData.jobsMap,
      sessionData.datasetsMap,
      dataset => this.isPhenodataType(sessionData, dataset));
  }

  isPhenodataType(sessionData: SessionData, dataset: Dataset) {
    return this.typeTagService.has(sessionData, dataset, Tags.GENE_EXPRS) 
      || this.typeTagService.has(sessionData, dataset, Tags.BAM)
      || this.typeTagService.has(sessionData, dataset, Tags.MOTHUR_SHARED)
      || this.typeTagService.has(sessionData, dataset, Tags.R_RDA);
  }

  getChildren(datasets: Dataset[], datasetsMap: Map<string, Dataset>, jobsMap: Map<string, Job>) {    

    // map takes care of duplicates
    let allChildren = new Map<string, Dataset>();

    let allDatasets = Array.from(datasetsMap.values());

    Array.from(datasets).forEach(dataset => {

      let ownChildren = [];
      allDatasets.forEach(d => {
        if (d.sourceJob != null) {
          let sourceJob = jobsMap.get(d.sourceJob);
          if (sourceJob != null) {
            sourceJob.inputs.forEach(i => {
              if (i.datasetId === dataset.datasetId) {
                ownChildren.push(d);
              }
            })
          }
        }
      });
      
      const children = this.getChildren(ownChildren, datasetsMap, jobsMap)
      
      ownChildren.forEach(d => allChildren.set(d.datasetId, d));
      children.forEach(d => allChildren.set(d.datasetId, d));      
    });

    return Array.from(allChildren.values());
  }

}
