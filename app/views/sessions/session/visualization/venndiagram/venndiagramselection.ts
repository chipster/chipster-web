import * as _ from 'lodash';

export default class VennDiagramSelection {

    datasetIds: Array<string> = [];
    values: Array<string> = [];

    addSelection(datasetIds: Array<string>, values: Array<string>) {
        this.datasetIds = _.uniq(this.datasetIds.concat(datasetIds));
        this.values = _.uniq(this.values.concat(values));
    }

    clearSelection() {
        this.datasetIds.length = 0;
        this.values.length = 0;
    }

}