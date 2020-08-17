import { Injectable } from "@angular/core";
import { Dataset, PhenodataUtils } from "chipster-js-common";
import MetadataFile from "chipster-js-common/lib/model/metadata-file";
import * as d3 from "d3";

@Injectable()
export class DatasetService {
  readonly PHENODATA_PREFIX = "phenodata";
  readonly DEFAULT_PHENODATA_FILENAME = "phenodata.tsv";
  readonly GROUP_COLOMN = "group";

  hasOwnPhenodata(dataset: Dataset): boolean {
    return PhenodataUtils.hasOwnPhenodata(dataset);
  }

  getOwnPhenodata(dataset: Dataset): string {
    return PhenodataUtils.getOwnPhenodata(dataset);
  }

  getOwnPhenodataFile(dataset: Dataset): MetadataFile {
    return PhenodataUtils.getOwnPhenodataFile(dataset);
  }

  isPhenodataFilled(dataset: Dataset): boolean {
    // TODO maybe use parent phenodata
    if (!this.hasOwnPhenodata(dataset)) {
      return false;
    }

    const allRows = d3.tsvParseRows(this.getOwnPhenodata(dataset));
    if (allRows.length < 2) {
      return false;
    }
    const headers = allRows[0];
    const groupIndex = headers.indexOf(this.GROUP_COLOMN);
    if (groupIndex === -1) {
      return false;
    }

    const contentRows = allRows.slice(1);
    return contentRows.every(
      row =>
        row.length === headers.length &&
        row[groupIndex] != null &&
        row[groupIndex] !== ""
    );
  }
}
