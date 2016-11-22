"use strict";
var ParameterList = (function () {
    function ParameterList() {
        this.limit = 3;
    }
    ParameterList.prototype.toggleParameterList = function () {
        this.limit = this.limit === 3 ? this.parameters.length : 3;
    };
    return ParameterList;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    bindings: {
        parameters: '<'
    },
    controller: ParameterList,
    template: "<h5>Parameters <button ng-if=\"$ctrl.parameters.length > 3\" ng-click=\"$ctrl.toggleParameterList()\" class=\"pull-right btn btn-xs btn-default\">Show/Hide parameters</button></h5>\n                <table class=\"table table-condensed parameter-table\">\n                    <tr ng-repeat=\"param in $ctrl.parameters\" ng-if=\"$index < $ctrl.limit\">\n                        <td>{{param.displayName}}</td>\n                        <td>{{param.value}}</td>\n                    </tr>\n                </table>"
};
//# sourceMappingURL=parameterlist.component.js.map