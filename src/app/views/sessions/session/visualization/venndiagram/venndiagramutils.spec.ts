import VennDiagramUtils from './venndiagramutils';
import Point from '../model/point';

describe('VennDiagramUtils', () => {

  describe('distance', () => {
    const origo = new Point(0,0);
    const point1 = new Point(5,0);

    it('should calculate correct distance between points', () => {
      expect(VennDiagramUtils.distance(origo, point1)).toBe(5);
    });

  });

});
