import VennDiagramUtils from './venndiagramutils';
import Point from '../model/point';
describe('VennDiagramUtils', function () {
    describe('distance', function () {
        var origo = new Point(0, 0);
        var point1 = new Point(5, 0);
        it('should calculate correct distance between points', function () {
            expect(VennDiagramUtils.distance(origo, point1)).toBe(5);
        });
    });
});
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/venndiagram/venndiagramutils.spec.js.map