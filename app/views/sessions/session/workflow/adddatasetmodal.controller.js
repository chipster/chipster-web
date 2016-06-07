angular.module('chipster-web').controller('AddDatasetModalController', function ($log, $uibModalInstance, $routeParams) {

    this.flowFileAdded = function (file, event, flow) {

        $log.debug('file added');

        // get a separate target for each file
        flow.opts.target = function (file) {
            return file.chipsterTarget;
        };

        this.createDataset(file.name).then(
            function (dataset) {
                // create an own target for each file
                file.chipsterTarget = URI(ConfigService.getFileBrokerUrl())
                    .path('sessions/' + $routeParams.sessionId + '/datasets/' + dataset.datasetId)
                    .addQuery('token', AuthenticationService.getToken()).toString();

                file.resume();
            });
        // wait for dataset to be created
        file.pause();

    };

    this.flowFileSuccess = function (file) {
        // remove completed files from the list
        file.cancel();
    };

    this.close = function () {
        $uibModalInstance.dismiss();
    };

});