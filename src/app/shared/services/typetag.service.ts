import { Injectable } from "@angular/core";
import { Dataset } from "chipster-js-common";
import * as log from "loglevel";
import { SessionData } from "../../model/session/session-data";

// tags for code completion and usage search
export const Tags = {
  TEXT: "TEXT",
  TSV: "TSV",
  CSV: "CSV",
  PNG: "PNG",
  GIF: "GIF",
  JPEG: "JPEG",
  PDF: "PDF",
  HTML: "HTML",
  TRE: "TRE",
  AFFY: "AFFY",
  BED: "BED",
  GTF: "GTF",
  FASTA: "FASTA",
  FAI: "FAI",
  FASTQ: "FASTQ",
  GZIP: "GZIP",
  VCF: "VCF",
  BAM: "BAM",
  BAI: "BAI",
  SAM: "SAM",
  QUAL: "QUAL",
  MOTHUR_OLIGOS: "MOTHUR_OLIGOS",
  MOTHUR_NAMES: "MOTHUR_NAMES",
  MOTHUR_GROUPS: "MOTHUR_GROUPS",
  MOTHUR_STABILITY: "MOTHUR_STABILITY",
  MOTHUR_COUNT: "MOTHUR_COUNT",
  SFF: "SFF",
  GENELIST: "GENELIST",
  GENE_EXPRS: "GENE_EXPRS",
  CDNA: "CDNA",
  PHENODATA: "PHENODATA",
  GENERIC: "GENERIC",
  PVALUE_AND_FOLD_CHANGE: "PVALUE_AND_FOLD_CHANGE",
  COLUMN_TITLES: "COLUMN_TITLES",
  SKIP_LINES: "SKIP_LINES",
  NO_TITLE_ROW: "NO_TITLE_ROW",
  MOTHUR_SHARED: "MOTHUR_SHARED",
  MOTHUR_TAXONOMY: "MOTHUR_TAXONOMY",
  R_RDA: "R_RDA",
};

@Injectable()
export class TypeTagService {
  // noinspection JSMethodCanBeStatic
  isCompatible(sessionData: SessionData, dataset: Dataset, type: string) {
    // debug logging
    if (sessionData == null) {
      log.warn("sessionData is null in isCompatible for " + dataset.name);
    } else if (sessionData.datasetTypeTags == null || sessionData.datasetTypeTags.size === 0) {
      log.warn(
        "empty sessionData.datasetTypetags in isCompatible for " + dataset.name + " " + sessionData.datasetTypeTags
      );
    }

    const alwaysCompatible = [Tags.GENERIC, Tags.PHENODATA];
    if (alwaysCompatible.includes(type)) {
      return true;
    }

    const typeTags = sessionData.datasetTypeTags.get(dataset.datasetId);

    if (!typeTags) {
      log.warn("typetags", sessionData.datasetTypeTags, typeTags);
      throw new Error("dataset " + dataset.name + " does not have type tags");
    }
    return typeTags.has(type);
  }

  // noinspection JSMethodCanBeStatic
  get(sessionData: SessionData, dataset: Dataset, type: string) {
    return this.getTags(sessionData, dataset).get(type);
  }

  // noinspection JSMethodCanBeStatic
  has(sessionData: SessionData, dataset: Dataset, type: string): boolean {
    return this.getTags(sessionData, dataset).has(type);
  }

  getTags(sessionData: SessionData, dataset: Dataset): Map<string, string> {
    const typeTags = sessionData.datasetTypeTags.get(dataset.datasetId);
    if (!typeTags) {
      throw new Error("dataset " + dataset.name + " does not have type tags");
    }
    return typeTags;
  }
}
