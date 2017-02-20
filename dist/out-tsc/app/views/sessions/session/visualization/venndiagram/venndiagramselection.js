import * as _ from 'lodash';
var VennDiagramSelection = (function () {
    function VennDiagramSelection() {
        this.datasetIds = [];
        this.values = [];
    }
    VennDiagramSelection.prototype.addSelection = function (datasetIds, values) {
        this.datasetIds = _.uniq(this.datasetIds.concat(datasetIds));
        this.values = this.values.concat(values);
    };
    VennDiagramSelection.prototype.clearSelection = function () {
        this.datasetIds.length = 0;
        this.values.length = 0;
    };
    return VennDiagramSelection;
}());
export default VennDiagramSelection;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/venndiagram/venndiagramselection.js.map