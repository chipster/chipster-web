
import JobParameter from "../../../../model/session/jobparameter";
class ParameterList {

    private limit: number;
    private parameters: Array<JobParameter>;

    constructor() {
        this.limit = 3;
    }

    toggleParameterList() {
        this.limit = this.limit === 3 ? this.parameters.length : 3;
    }
}

export default {
    bindings: {
        parameters: '<'
    },
    controller: ParameterList,
    template: `<h5>Parameters <button ng-if="$ctrl.parameters.length > 3" ng-click="$ctrl.toggleParameterList()" class="pull-right btn btn-xs btn-default">Show/Hide parameters</button></h5>
                <table class="table table-condensed parameter-table">
                    <tr ng-repeat="param in $ctrl.parameters" ng-if="$index < $ctrl.limit">
                        <td>{{param.displayName}}</td>
                        <td>{{param.value}}</td>
                    </tr>
                </table>`
}