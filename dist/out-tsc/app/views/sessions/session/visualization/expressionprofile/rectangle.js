import * as _ from 'lodash';
import Point from "../model/point";
var Rectangle = (function () {
    function Rectangle(x1, y1, x2, y2) {
        // order given xs and ys to find topleft and bottomright corners
        var xs = _.sortBy([x1, x2]);
        var ys = _.sortBy([y1, y2]);
        this._topleft = new Point(xs[0], ys[0]);
        this._bottomright = new Point(xs[1], ys[1]);
    }
    Object.defineProperty(Rectangle.prototype, "topleft", {
        get: function () {
            return this._topleft;
        },
        set: function (value) {
            this._topleft = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rectangle.prototype, "bottomright", {
        get: function () {
            return this._bottomright;
        },
        set: function (value) {
            this._bottomright = value;
        },
        enumerable: true,
        configurable: true
    });
    return Rectangle;
}());
export default Rectangle;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/expressionprofile/rectangle.js.map