
export default class AddColumnController {

    static $inject = ['$uibModalInstance', '$uibModal', 'hot', 'colName'];

    constructor(
        private $uibModalInstance: any,
        private $uibModal: any,
        private hot: ht.Methods,
        private colName: string) {

    }

    dismiss() {
        this.$uibModalInstance.dismiss();
    };

    addColumn() {
        var colHeaders = <Array<string>>(<ht.Options>this.hot.getSettings()).colHeaders;
        this.hot.alter('insert_col', colHeaders.length);
        // remove undefined column header
        colHeaders.pop();
        colHeaders.push(this.colName);
        this.hot.updateSettings({
            colHeaders: colHeaders
        }, false);
        this.colName = '';


        this.$uibModalInstance.close('update');
    }

}
