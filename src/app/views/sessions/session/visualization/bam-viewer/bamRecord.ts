export default class BamRecord {
  readName: string;
  chrName: string;
  cigar: string;
  seq: string;
  qual: string;
  flag: number;
  pos: number;
  mapQ: number;
  nextSegment: number;
  nextSegPos: number;
  typeTag: any;
}
