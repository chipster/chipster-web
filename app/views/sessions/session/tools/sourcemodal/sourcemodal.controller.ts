import Tool from "../../../../../model/session/tool";
import ToolResource from "../../../../../resources/toolresource";


export default class SourceModalController {

    static $inject = ['$log', '$uibModalInstance', 'module', 'category', 'selectedTool', 'ToolResource'];

    private source: string;

    constructor(
        private $log: ng.ILogService,
        private $uibModalInstance: any,
        private module: string,
        private category: string,
        private selectedTool: Tool,
        private toolResource: ToolResource) {
    }

    $onInit() {
        this.toolResource.getSourceCode(this.selectedTool.name.id).then((sourceCode) => {
            //this.$log.log(sourceCode);
            this.source = sourceCode;
        });
    };

    close() {
        this.$uibModalInstance.close();
    };
}
