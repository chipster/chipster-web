
import {testtsv} from './TSVFile.input.spec';
import TSVFile from "./TSVFile";

describe('TSVFile', () => {

  function createTSVFile() {
    return new TSVFile(testtsv, 'testid', 'testfile.txt');
  }

  const tsv = createTSVFile();

  describe('construction', () => {
    it('should have equal sized header and bodyrows', () => {
      expect(tsv.headers.size()).toBe(tsv.body.rows[0].size());
    });

  });

  describe('getColumnIndex', () => {
    it('should return correct header index', () => {
      expect(tsv.getColumnIndex('identifier')).toBe(0);
      expect(tsv.getColumnIndex('symbol')).toBe(1);
      expect(tsv.getColumnIndex('FC')).toBe(28);
      expect(tsv.getColumnIndex('chip.microarray003.cel')).toBe(5);
    });
  });

  describe('getColumnDataByHeaderKey', () => {

    it('should return identifier-column', () => {
      const column = tsv.getColumnDataByHeaderKey('identifier');
      expect(column[0]).toBe('7369_at');
      expect(column[1]).toBe('10610_at');
      expect(column[2]).toBe('22981_at');
    });

    it('should return symbol-column', () => {
      const column = tsv.getColumnDataByHeaderKey('symbol');
      expect(column[0]).toBe('UMOD');
      expect(column[1]).toBe('ST6GALNAC2');
      expect(column[2]).toBe('NINL');
    });

    it('should return chip.microarray006.cel-column', () => {
      const column = tsv.getColumnDataByHeaderKey('chip.microarray006.cel');
      expect(column[0]).toBe('4.97');
      expect(column[1]).toBe('6.69');
      expect(column[2]).toBe('6.12');
    })
  });

  describe('getColumnDataByHeaderKeys', () => {
    const symbolColumn = tsv.getColumnDataByHeaderKey('symbol');
    const chipcolumn6 = tsv.getColumnDataByHeaderKey('chip.microarray006.cel');
    const columnsByHeaderKeys = tsv.getColumnDataByHeaderKeys(['symbol', 'chip.microarray006.cel']);

    it('should return arrays containing items by columnkeys', () => {
       expect(columnsByHeaderKeys[0][0]).toBe(symbolColumn[0]);
       expect(columnsByHeaderKeys[0][1]).toBe(chipcolumn6[0]);
       expect(columnsByHeaderKeys[3][0]).toBe(symbolColumn[3]);
    });

  });

  describe('getRawDataByRowIds', () => {

    // copied 3 first items in input data + added identifier column
    const result = [["identifier", "symbol","description","chip.microarray001.cel","chip.microarray002.cel","chip.microarray003.cel","chip.microarray004.cel","chip.microarray005.cel","chip.microarray006.cel","chip.microarray007.cel","chip.microarray008.cel","chip.microarray009.cel","chip.microarray010.cel","chip.microarray011.cel","chip.microarray012.cel","flag.microarray001.cel","flag.microarray002.cel","flag.microarray003.cel","flag.microarray004.cel","flag.microarray005.cel","flag.microarray006.cel","flag.microarray007.cel","flag.microarray008.cel","flag.microarray009.cel","flag.microarray010.cel","flag.microarray011.cel","flag.microarray012.cel","p.adjusted","FC"],["7369_at","UMOD","uromodulin","5.38","5.84","5.32","5.3","7.12","4.97","11.66","13","12.94","11.42","12.7","11.74","A","A","A","A","P","A","P","P","P","P","P","P","0.000479","-6.58833333333333"],["10610_at","ST6GALNAC2","ST6 (alpha-N-acetyl-neuraminyl-2,3-beta-galactosyl-1,3)-N-acetylgalactosaminide alpha-2,6-sialyltransferase 2","6.7","6.82","6.66","6.94","6.75","6.69","7.53","7.6","7.58","7.78","7.57","7.6","A","A","A","A","A","A","M","A","A","A","A","M","0.000799","-0.849999999999999"]];

    it('should return only first item', () => {
      expect(tsv.getRawDataByRowIds(["0","1"])).toEqual(result);
    });


  });



});
