import Tool from "../../../../../model/session/tool";
import Dataset from "../../../../../model/session/dataset";
import InputBinding from "../../../../../model/session/inputbinding";
import {ToolService} from "../tool.service";
import * as _ from "lodash";

export default class InputsModalController {

    static $inject = ['$log', '$uibModalInstance', 'ToolService', 'selectedTool', 'moduleName','categoryName', 'inputBindings', 'selectedDatasets'];

    constructor(
        private $log: ng.ILogService,
        private $uibModalInstance: any,
        private toolService: ToolService, // used by the template
        private selectedTool: Tool,
        private moduleName: string,
        private categoryName: string,
        private inputBindings: InputBinding[],
        private selectedDatasets: Dataset[]) {
    }

    close() {
        this.$uibModalInstance.close({inputBindings: this.inputBindings});
    };


    inputSelected(changedBinding: InputBinding) {

        // unselect new selection(s) from other bindings
        for (let inputBinding of this.inputBindings) {
            if (inputBinding != changedBinding) {
                //let updated: Dataset[] = [];
                for (let changed of changedBinding.datasets) {
                    for (let dataset of inputBinding.datasets) {
                        if (changed.datasetId != dataset.datasetId) {
                            //updated.push(dataset);
                        } else {
                            _.pull(inputBinding.datasets, dataset);
                        }
                    }
                }
            }
        }
    }

}
