import VennDiagramUtils from "./venndiagramutils";
var PointPair = (function () {
    function PointPair(point1, point2) {
        this.point1 = point1;
        this.point2 = point2;
    }
    /*
     * @description: get the point of this pointpair which is closer to the point given as parameter
     */
    PointPair.prototype.closerPoint = function (other) {
        var distance1 = VennDiagramUtils.distance(other, this.point1);
        var distance2 = VennDiagramUtils.distance(other, this.point2);
        return distance1 <= distance2 ? this.point1 : this.point2;
    };
    /*
     * @description: get the point of this pointpair which is further away from the point given as parameter
     */
    PointPair.prototype.moreDistantPoint = function (other) {
        var distance1 = VennDiagramUtils.distance(other, this.point1);
        var distance2 = VennDiagramUtils.distance(other, this.point2);
        return distance1 > distance2 ? this.point1 : this.point2;
    };
    /*
     * @description: get the point that is upper in the svg coordinate system (smaller y-value is upper)
     */
    PointPair.prototype.getUpperPoint = function () {
        return this.point1.y <= this.point2.y ? this.point1 : this.point2;
    };
    /*
     * @description: get the point that is lower in the svg coordinate system (larger y-value is lower)
     */
    PointPair.prototype.getLowerPoint = function () {
        return this.point1.y > this.point2.y ? this.point1 : this.point2;
    };
    return PointPair;
}());
export default PointPair;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/venndiagram/pointpair.js.map