
class ParameterList {

    private limit: number;
    private parameters: Array;

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
    template: `<h4>Parameters <button ng-if="$ctrl.parameters.length > 3" ng-click="$ctrl.toggleParameterList()" class="btn btn-sm btn-info">Show/Hide parameters</button></h4>
                <table class="table table-condensed parameter-table">
                    <tr ng-repeat="param in $ctrl.parameters" ng-if="$index < $ctrl.limit">
                        <td>{{param.displayName}}</td>
                        <td>{{param.value}}</td>
                    </tr>
                </table>
                `
}