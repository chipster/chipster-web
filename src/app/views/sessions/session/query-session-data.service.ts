import { Injectable } from "@angular/core";
import { Dataset, PhenodataUtils } from "chipster-js-common";
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
      || this.typeTagService.has(sessionData, dataset, Tags.BAM);
  }
}
