import {testtsv} from "./TSVFile.input.spec";
import TSVFile from "./TSVFile";
import TSVHeaders from "./TSVHeaders";

describe('TSVHeaders', () => {

  function createTSVFile() {
    return new TSVFile(testtsv, 'testid', 'testfile.txt');
  }

  const headers1 = createTSVFile().headers;
  const headers2 = new TSVHeaders(['identifier', 'asdf', 'sdf', 'ad', '134', 'lkpd98s5']);


  describe('size', () => {

    it('should return the length of headers array', () => {
      expect(headers1.size()).toBe(29);
      expect(headers2.size()).toBe(6);
    });

  });

  describe('getItemsByIndexes', () => {

    it('should return matching headers', () => {
      expect(headers2.getItemsByIndexes([0,1,2])).toEqual(['identifier', 'asdf', 'sdf']);
      expect(headers2.getItemsByIndexes([5])).toEqual(['lkpd98s5']);
    });

    it('should return empty array for empty input array', () => {
      expect(headers1.getItemsByIndexes([])).toEqual([]);
    });

    xit('should throw error with non array input', () => { // should implement exception handler
      expect(headers2.getItemsByIndexes(undefined)).toBe([]); // should throw error
    });

  });

  describe('getColumnIndexByKey', () => {

    it('should return 0 for identifier with headers2', () => {
      expect(headers2.getColumnIndexByKey('identifier')).toBe(0);
    });

  });

});
