import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";
import MetadataFile from "chipster-js-common/lib/model/metadata-file";

@Injectable()
export class DatasetService {
  readonly PHENODATA_PREFIX = "phenodata";
  readonly DEFAULT_PHENODATA_FILENAME = "phenodata.tsv";

  hasOwnPhenodata(dataset: Dataset): boolean {
    return this.getOwnPhenodata(dataset) != null;
  }

  getOwnPhenodata(dataset: Dataset): string {
    const phenodataFile = this.getOwnPhenodataFile(dataset);
    return phenodataFile != null ? phenodataFile.content : null;
  }

  getOwnPhenodataFile(dataset: Dataset): MetadataFile {
    return dataset.metadataFiles != null
      ? dataset.metadataFiles.find(metadataFile =>
          metadataFile.name.startsWith(this.PHENODATA_PREFIX)
        )
      : null;
  }
}
