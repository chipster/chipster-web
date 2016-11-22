"use strict";
function default_1() {
    var radius = 3;
    return {
        restrict: 'EA',
        scope: {
            toolcolor: "="
        },
        template: "<canvas id='canvas' width=" + (radius * 2 + 5) + " height=" + (radius * 2 + 2) + ">",
        link: function (scope, element) {
            var canvas = element.find('canvas')[0];
            var context = canvas.getContext('2d');
            var centerX = radius;
            var centerY = radius;
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = scope['toolcolor'];
            context.fill();
        }
    };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=toolcircle.directive.js.map