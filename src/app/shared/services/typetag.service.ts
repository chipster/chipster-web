import {Injectable} from "@angular/core";
import Dataset from "../../model/session/dataset";
import {SessionDataService} from "../../views/sessions/session/sessiondata.service";
import {TSVReader} from "./TSVReader";
import {Observable} from "rxjs";

// increase by one always when types have changed
const CURRENT_VERSION = 4;

export class Tag {
  constructor(
    public id: string,
    public extensions: string[]){}
}

// tags in an object for code completion
export const Tags = {
  // simple types are recognized with the file extension
  TEXT: new Tag('TEXT', ['.txt', '.dat', '.wee', '.seq', '.log', '.sam', '.fastq']),
  TSV: new Tag('TSV', ['.tsv']),
  CSV: new Tag('CSV', ['.csv']),
  PNG: new Tag('PNG', ['.png']),
  GIF: new Tag('GIF', ['.gif']),
  JPEG: new Tag('JPEG', ['.jpg', '.jpeg']),
  PDF: new Tag('PDF', ['.pdf']),
  HTML: new Tag('HTML', ['.html', '.html']),
  TRE: new Tag('TRE', ['.tre']),
  AFFY: new Tag('AFFY', ['.cel']),
  BED: new Tag('BED', ['.bed']),
  GTF: new Tag('GTF', ['.gtf', '.gff', '.gff2', '.gff3']),
  FASTA: new Tag('FASTA', ['.fasta', '.fa', '.fna', '.fsa', '.mpfa']),
  FASTQ: new Tag('FASTQ', ['.fastq', '.fq']),
  GZIP: new Tag('GZIP', ['.gz']),
  VCF: new Tag('VCF', ['.vcf']),
  BAM: new Tag('BAM', ['.bam']),
  QUAL: new Tag('QUAL', ['.qual']),
  MOTHUR_OLIGOS: new Tag('MOTHUR_OLIGOS', ['.oligos']),
  MOTHUR_NAMES: new Tag('MOTHUR_NAMES', ['.names']),
  MOTHUR_GROUPS: new Tag('MOTHUR_GROUPS', ['.groups']),
  MOTHUR_STABILITY: new Tag('MOTHUR_STABILITY', ['.files']),
  MOTHUR_COUNT: new Tag('MOTHUR_COUNT', ['.count_table']),
  SFF: new Tag('SFF', ['.sff']),

  // complex types are defined here for autocompletion, but have to be checked separately
  GENELIST: new Tag('GENELIST', []),
  GENE_EXPRS: new Tag('GENE_EXPRS', []),
  CDNA: new Tag('CDNA', []),
  PHENODATA: new Tag('PHENODATA', []),
  GENERIC: new Tag('GENERIC', []),
  TYPE_TAG_VERSION: new Tag('TYPE_TAG_VERSION', []),
};

@Injectable()
export class TypeTagService {

  private tagIdMap = new Map<string, Tag>();

  constructor(
    private sessionDataService: SessionDataService,
    private tsvReader: TSVReader) {

    // the Tags object above is just for the code completion. For any real use
    // we wan't a real ES6 map
    for (let tagKey in Tags) {
      let tag = Tags[tagKey];
      this.tagIdMap.set(tag.id, tag);
    }
  }

  updateTypeTags(dataset: Dataset) {

    dataset = _.clone(dataset);

    dataset.typeTags = {};

    // add simple type tags based on file extensions
    for (let tagKey in Tags) { // for-in to iterate object keys
      for (let extension of Tags[tagKey].extensions) { // for-of to iterate array items
        if (dataset.name.endsWith(extension)) {
          this.addTag(dataset, Tags[tagKey]);
        }
      }
    }

    // observable for async checks
    let observable;

    // check headers of the tsv files
    if (this.hasTag(dataset, Tags.TSV)) {
      observable = Observable.of(dataset)
        .flatMap(dataset => this.tsvReader.getTSVFile(this.sessionDataService.getSessionId(), dataset.datasetId))
        .flatMap(tsvFile => {

          if (tsvFile.headers.hasIdentifierColumn()) {
            this.addTag(dataset, Tags.GENELIST);
          }

          if (tsvFile.headers.headers.filter(header => header.startsWith('chip.')).length > 0) {
            this.addTag(dataset, Tags.GENE_EXPRS);
          }

          if (tsvFile.headers.headers.indexOf('sample') !== -1) {
            this.addTag(dataset, Tags.CDNA);
          }

          return Observable.of(dataset);

        });
    } else {
      observable = Observable.of(dataset);
    }

    return observable.flatMap((dataset) => {
        this.addTagValue(dataset, Tags.TYPE_TAG_VERSION, '' + CURRENT_VERSION);
        console.log('type tags of dataset ' + dataset.name + ' updated', dataset.typeTags);
        return this.sessionDataService.updateDataset(dataset);
    });
  }

  addTag(dataset: Dataset, key: Tag) {
    this.addTagValue(dataset, key, null);
  }

  addTagValue(dataset: Dataset, tag: Tag, value: string) {
    //console.log(dataset.name + ': add tag', key, value);
    dataset.typeTags[tag.id] = value;
  }

  hasTag(dataset: Dataset, tag: Tag) {
    return tag.id in dataset.typeTags;
  }

  getTag(dataset: Dataset, tag: Tag) {
    return dataset.typeTags[tag.id];
  }

  isCompatible(dataset: Dataset, type: string) {

    const alwaysCompatible = [Tags.GENERIC.id, Tags.PHENODATA.id];
    if (alwaysCompatible.indexOf(type) !== -1) {
      return true;
    }

    if (!this.hasUpToDateTypeTags(dataset)) {
      throw new Error('dataset ' + dataset.name + 'does not have up-to-date type tags');
    }

    let tag = this.tagIdMap.get(type);

    if (!tag) {
      throw new Error('undefined type tag ' + type);
    }

    return this.hasTag(dataset, tag);
  }

  hasTypeTags(dataset: Dataset) {
    return dataset.typeTags != null && this.hasTag(dataset, Tags.TYPE_TAG_VERSION);
  }

  hasUpToDateTypeTags(dataset: Dataset) {
    return this.hasTypeTags(dataset) && Number(this.getTag(dataset, Tags.TYPE_TAG_VERSION)) >= CURRENT_VERSION;
  }

  updateTypeTagsIfNecessary(datasets: ArrayLike<Dataset>) {
    Observable.from(datasets)
      .filter(dataset => !this.hasUpToDateTypeTags(dataset))
      .flatMap(dataset => this.updateTypeTags(dataset))
      .subscribe(
        () => {},
        (err) => {
          console.log('type tagging failed', err);
        });
  }
}
