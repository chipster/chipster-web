import { testtsv } from "./TSVFile.input.spec";
import TSVFile from "./TSVFile";
import TSVHeaders from "./TSVHeaders";
describe('TSVHeaders', function () {
    function createTSVFile() {
        return new TSVFile(testtsv, 'testid', 'testfile.txt');
    }
    var headers1 = createTSVFile().headers;
    var headers2 = new TSVHeaders(['identifier', 'asdf', 'sdf', 'ad', '134', 'lkpd98s5']);
    describe('size', function () {
        it('should return the length of headers array', function () {
            expect(headers1.size()).toBe(29);
            expect(headers2.size()).toBe(6);
        });
    });
    describe('getItemsByIndexes', function () {
        it('should return matching headers', function () {
            expect(headers2.getItemsByIndexes([0, 1, 2])).toEqual(['identifier', 'asdf', 'sdf']);
            expect(headers2.getItemsByIndexes([5])).toEqual(['lkpd98s5']);
        });
        it('should return empty array for empty input array', function () {
            expect(headers1.getItemsByIndexes([])).toEqual([]);
        });
        xit('should throw error with non array input', function () {
            expect(headers2.getItemsByIndexes(undefined)).toBe([]); // should throw error
        });
    });
    describe('getColumnIndexByKey', function () {
        it('should return 0 for identifier with headers2', function () {
            expect(headers2.getColumnIndexByKey('identifier')).toBe(0);
        });
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/model/tsv/TSVHeaders.spec.js.map