angular.module('chipster-web').controller('SessionCtrl',function ($scope, $routeParams, $q,
                                                                  SessionRestangular, AuthenticationService, $websocket,
                                                                  $http, $window, WorkflowGraphService,
                                                                  ConfigService, $location, Utils, $filter, $log, $uibModal) {

    // SessionRestangular is a restangular object with
    // configured baseUrl and
    // authorization header

    $scope.sessionUrl = SessionRestangular.one('sessions',
        $routeParams.sessionId);

    // creating a websocket object and start listening for the
    // events

    var eventUrl = ConfigService.getSessionDbEventsUrl($routeParams.sessionId);

    $log.debug('eventUrl', eventUrl);
    var ws = $websocket(new URI(eventUrl).addQuery('token', AuthenticationService.getToken()).toString());

    ws.onOpen(function () {
        $log.info('websocket connected');
    });

    ws.onMessage(function (event) {
        $scope.handleEvent(JSON.parse(event.data));
    });

    ws.onClose(function(){
        $log.info('websocket closed');
    });

    // stop listening when leaving this view
    $scope.$on("$destroy", function(){
        ws.close();
    });

    $scope.handleEvent = function(event) {
        $log.debug('websocket event', event);

        if (event.resourceType === 'AUTHORIZATION') {

            if (event.type === 'DELETE') {
                $scope.$apply(function() {
                    alert('The session has been deleted.');
                    $location.path('sessions');
                });

            } else {
                $log.warn("unknown event type", event);
            }

        } else if (event.resourceType === 'SESSION') {

            if (event.type === 'UPDATE') {
                $scope.sessionUrl.get().then(function (resp) {
                    var local = $scope.data.session;
                    var remote = resp.data;

                    // update the original instance
                    angular.copy(remote, local);
                    $scope.setTitle(remote.name, true);
                });

            } else {
                $log.warn("unknown event type", event);
            }

        } else if (event.resourceType === 'DATASET') {

            if (event.type === 'CREATE') {
                $scope.sessionUrl.one('datasets', event.resourceId).get().then(function (resp) {
                    $scope.data.datasetsMap.set(event.resourceId, resp.data);
                    $scope.$broadcast('datasetsMapChanged', {});
                });

            } else if (event.type === 'UPDATE') {
                $scope.sessionUrl.one('datasets', event.resourceId).get().then(function (resp) {

                    var local = $scope.data.datasetsMap.get(event.resourceId);
                    var remote = resp.data;

                    // update the original instance
                    angular.copy(remote, local);
                    $scope.$broadcast('datasetsMapChanged', {});
                });

            } else if (event.type === 'DELETE') {
                $scope.$apply(function() {
                    $scope.data.datasetsMap.delete(event.resourceId);
                    $scope.$broadcast('datasetsMapChanged', {});
                });

            } else {
                $log.warn("unknown event type", event);
            }

        } else if (event.resourceType === 'JOB') {

            if (event.type === 'CREATE') {
                $scope.sessionUrl.one('jobs', event.resourceId).get().then(function (resp) {
                    $scope.data.jobsMap.set(event.resourceId, resp.data);
                    $scope.$broadcast('jobsMapChanged', {});
                });

            } else if (event.type === 'UPDATE') {
                $scope.sessionUrl.one('jobs', event.resourceId).get().then(function (resp) {
                    var local = $scope.data.jobsMap.get(event.resourceId);
                    var remote = resp.data;

                    // if the job has just failed
                    if (remote.state === 'FAILED' && local.state !== 'FAILED') {
                        $scope.openErrorModal('Job failed', remote);
                        $log.info(remote);
                    }
                    if (remote.state === 'ERROR' && local.state !== 'ERROR') {
                        $scope.openErrorModal('Job error', remote);
                        $log.info(remote);
                    }

                    // update the original instance
                    angular.copy(remote, local);
                    $scope.$broadcast('jobsMapChanged', {});
                });

            } else if (event.type === 'DELETE') {
                $scope.data.jobsMap.delete(event.resourceId);
                $scope.$broadcast('jobsMapChanged', {});

            } else {
                $log.warn("unknown event type", event.type, event);
            }
        } else {
            $log.warn("unknwon resource type", event.resourceType, event);
        }
    };

    // create an object for the dataset search value, so that we can modify it from here
    // the search box seems to have a separate child scope, not sure why
    $scope.datasetSearch = {};

    $scope.datasetSearchKeyEvent = function (e) {
        if (e.keyCode == 13) { // enter
            // select highlighted datasets
            var allDatasets = $scope.getDatasetList();
            $scope.selectedDatasets = $filter('searchDatasetFilter')(allDatasets, $scope.datasetSearch.value);
            $scope.datasetSearch.value = null;
        }
        if (e.keyCode == 27) { // escape key
            // clear the search
            $scope.datasetSearch.value = null;
        }
    };

    // creating a session model object
    $scope.data = {
        sessionId: $routeParams.sessionId,
        jobsMap: new Map(),
        datasetsMap: new Map(),
        workflowData: {}
    };

    $scope.getWorkflowCallback = function() {
        return $scope;
    };

    $scope.getDatasetList = function () {
        return Utils.mapValues($scope.data.datasetsMap);
    };


    // For tabbed view manipulation
    $scope.item = 1;
    $scope.setItem = function (value) {
        $scope.item = value;
    };

    $scope.isSet = function (value) {
        return $scope.item === value;
    };

    // selections
    $scope.selectedDatasets = [];
    $scope.selectedJobs = [];

    /**
     * Check if there are one or more dataset selected
     * @returns {boolean}
     */
    $scope.isDatasetSelected = function() {
        return $scope.selectedDatasets.length > 0;
    };

    /**
     * Check if there are one or more jobs selected
     * @returns {boolean}
     */
    $scope.isJobSelected = function() {
        return $scope.selectedJobs.length > 0;
    };

    /**
     * Check if given dataset is selected
     * @param data
     * @returns {boolean}
     */
    $scope.isSelectedDataset = function(data) {
        return $scope.selectedDatasets.indexOf(data) !== -1;
    };

    /**
     * Check if given job is selected
     * @param data
     * @returns {boolean}
     */
    $scope.isSelectedJob = function(data) {
        return $scope.selectedJobs.indexOf(data) !== -1;
    };

    /**
     * Check if single dataset is selected
     * @returns {boolean}
     */
    $scope.isSingleDatasetSelected = function() {
        return $scope.selectedDatasets.length == 1;
    };

    /**
     * Check if there are more than one datasets selected
     * @returns {boolean}
     */
    $scope.isMultipleDatasetsSelected = function() {
        return $scope.selectedDatasets.length > 1;
    };

    $scope.clearSelection = function() {
        $scope.selectedDatasets.length = 0;
        $scope.selectedJobs.length = 0;
    };

    $scope.toggleDatasetSelection = function($event, data) {
        Utils.toggleSelection($event, data, $scope.getDatasetList(), $scope.selectedDatasets);
    };

    $scope.selectJob = function(event, job) {
        $scope.clearSelection();
        $scope.selectedJobs = [job];
    };

    $scope.deleteJobs = function (jobs) {

        angular.forEach(jobs, function(job) {
            var url = $scope.sessionUrl.one('jobs').one(job.jobId);
            url.remove().then(function (res) {
                $log.debug(res);
            });
        });
    };

    // tool selection
    $scope.selectedTool = null;
    $scope.selectedToolIndex = -1;
    $scope.istoolselected = false;

    $scope.toolDetailList = null;

    // For searching dataset in workflowgraph
    $scope.searched_dataset_name = null;

    SessionRestangular.loadSession($routeParams.sessionId).then(function(data) {
        $scope.$apply(function() {
            $scope.data = data;
            $scope.setTitle($scope.data.session.name, true);

            $scope.$watch('title', function () {
                $scope.data.session.name = $scope.title;
                $scope.updateSession();
            });
        });
    });

    $scope.getDataSets = function () {
        $scope.datalist = $scope.sessionUrl.all('datasets')
            .getList();
    };





    $scope.deleteDatasets = function (datasets) {

        angular.forEach(datasets, function(dataset) {
            var datasetUrl = $scope.sessionUrl.one('datasets').one(dataset.datasetId);
            datasetUrl.remove().then(function (res) {
                $log.debug(res);
            });
        });
    };

    $scope.getJob = function (jobId) {
        return $scope.data.jobsMap.get(jobId);
    };

    $scope.renameDatasetDialog = function(dataset) {
        var result = prompt('Change the name of the node', dataset.name);
        if(result) {dataset.name = result;}
        $scope.updateDataset(dataset);
    };

    $scope.updateDataset = function(dataset) {
        var datasetUrl = $scope.sessionUrl.one('datasets').one(dataset.datasetId);
        return datasetUrl.customPUT(dataset);
    };

    $scope.updateSession = function() {
        $scope.sessionUrl.customPUT($scope.data.session);
    };

    $scope.getDatasetUrl = function() {
        if ($scope.selectedDatasets && $scope.selectedDatasets.length > 0) {
            //TODO should we have separate read-only tokens for datasets?
            return URI(ConfigService.getFileBrokerUrl())
                .path('sessions/' + $routeParams.sessionId + '/datasets/' + $scope.selectedDatasets[0].datasetId)
                .addQuery('token', AuthenticationService.getToken()).toString();
        }
    };

    $scope.showDefaultVisualization = function() {
        $scope.$broadcast('showDefaultVisualization', {});
    };

    $scope.exportDatasets = function(datasets) {
        angular.forEach(datasets, function(d) {
            $window.open($scope.getDatasetUrl(d), "_blank")
        });
    };

    $scope.showHistory = function() {
        $('#historyModal').modal('show');
    };

    // We are only handling the resize end event, currently only
    // working in workflow graph div
    $scope.$on("angular-resizable.resizeEnd", function () {
        $scope.$broadcast('resizeWorkFlowGraph', {});
    });

    angular.element($window).bind('resize', function() {
        $scope.$broadcast('resizeWorkFlowGraph', {});
    });

    $scope.getSessionId = function () {
        return $routeParams.sessionId;
    };

    $scope.openAddDatasetModal = function () {
        $uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/workflow/adddatasetmodal.html',
            controller: 'AddDatasetModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                data: function () {
                    return $scope.data;
                }
            }
        });
    };

    $scope.openErrorModal = function (title, toolError) {
        $uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/joberrormodal.html',
            controller: 'JobErrorModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                toolErrorTitle: function () {
                    return angular.copy(title);
                },
                toolError: function () {
                    return angular.copy(toolError);
                }
            }
        });
    };
});
