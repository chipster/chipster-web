import {Injectable} from "@angular/core";
import Dataset from "../../model/session/dataset";
import {SessionData} from "../../model/session/session-data";

// tags for code completion and usage search
export const Tags = {
  TEXT: 'TEXT',
  TSV: 'TSV',
  CSV: 'CSV',
  PNG: 'PNG',
  GIF: 'GIF',
  JPEG: 'JPEG',
  PDF: 'PDF',
  HTML: 'HTML',
  TRE: 'TRE',
  AFFY: 'AFFY',
  BED: 'BED',
  GTF: 'GTF',
  FASTA: 'FASTA',
  FASTQ: 'FASTAQ',
  GZIP: 'GZIP',
  VCF: 'VCF',
  BAM: 'BAM',
  BAI:'BAI',
  QUAL: 'QUAL',
  MOTHUR_OLIGOS: 'MOTHUR_OLIGOS',
  MOTHUR_NAMES: 'MOTHUR_NAMES',
  MOTHUR_GROUPS: 'MOTHUR_GROUPS',
  MOTHUR_STABILITY: 'MOTHUR_STABILITY',
  MOTHUR_COUNT: 'MOTHUR_COUNT',
  SFF: 'SFF',
  GENELIST: 'GENELIST',
  GENE_EXPRS: 'GENE_EXPRS',
  CDNA: 'CDNA',
  PHENODATA: 'PHENODATA',
  GENERIC: 'GENERIC',
  PVALUE_AND_FOLD_CHANGE: 'PVALUE_AND_FOLD_CHANGE',
};

@Injectable()
export class TypeTagService {

  isCompatible(sessionData: SessionData, dataset: Dataset, type: string) {

    const alwaysCompatible = [Tags.GENERIC, Tags.PHENODATA];
    if (alwaysCompatible.indexOf(type) !== -1) {
      return true;
    }

    let typeTags = sessionData.datasetTypeTags.get(dataset.datasetId);

    if (!typeTags) {
      throw new Error('dataset ' + dataset.name + 'does not have type tags');
    }

    return typeTags.has(type);
  }
}
