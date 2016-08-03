import Utils from "../../../services/Utils";

SessionController.$inject = ['$scope', '$routeParams', '$window',
                            '$location', '$filter', '$log', '$uibModal',
                            'SessionEventService', 'SessionDataService'];

function SessionController($scope, $routeParams, $window,
                           $location, $filter, $log, $uibModal, SessionEventService,
                           SessionDataService) {

    // create an object for the dataset search value, so that we can modify it from here
    // the search box seems to have a separate child scope, not sure why
    $scope.datasetSearch = {};

    // selections
    $scope.selectedDatasets = [];
    $scope.selectedJobs = [];

    // tool selection
    $scope.selectedTool = null;
    $scope.selectedToolIndex = -1;
    $scope.istoolselected = false;

    $scope.selectedTab = 1;

    $scope.toolDetailList = null;

    // For searching dataset in workflowgraph
    $scope.searched_dataset_name = null;

    SessionDataService.onSessionChange(function (event, oldValue, newValue) {
        if (event.resourceType === 'SESSION' && event.type === 'DELETE') {
            $scope.$apply(function () {
                alert('The session has been deleted.');
                $location.path('sessions');
            });
        }
        if (event.resourceType === 'DATASET') {
            $scope.$broadcast('datasetsMapChanged', {});
        }
        if (event.resourceType === 'JOB') {
            $scope.$broadcast('jobsMapChanged', {});

            // if the job has just failed
            if (newValue.state === 'FAILED' && oldValue.state !== 'FAILED') {
                $scope.openErrorModal('Job failed', newValue);
                $log.info(newValue);
            }
            if (newValue.state === 'ERROR' && oldValue.state !== 'ERROR') {
                $scope.openErrorModal('Job error', newValue);
                $log.info(newValue);
            }
        }
    });

    // stop listening for events when leaving this view
    $scope.$on("$destroy", function () {
        SessionDataService.destroy();
    });

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

    $scope.getWorkflowCallback = function () {
        return $scope;
    };

    $scope.setTab = function (tab) {
        $scope.selectedTab = tab;
    };

    $scope.isTab = function (tab) {
        return $scope.selectedTab === tab;
    };

    /**
     * Check if there are one or more dataset selected
     * @returns {boolean}
     */
    $scope.isDatasetSelected = function () {
        return $scope.selectedDatasets.length > 0;
    };

    /**
     * Check if there are one or more jobs selected
     * @returns {boolean}
     */
    $scope.isJobSelected = function () {
        return $scope.selectedJobs.length > 0;
    };

    /**
     * Check if given dataset is selected
     * @param data
     * @returns {boolean}
     */
    $scope.isSelectedDataset = function (data) {
        return $scope.selectedDatasets.indexOf(data) !== -1;
    };

    /**
     * Check if given job is selected
     * @param data
     * @returns {boolean}
     */
    $scope.isSelectedJob = function (data) {
        return $scope.selectedJobs.indexOf(data) !== -1;
    };

    /**
     * Check if single dataset is selected
     * @returns {boolean}
     */
    $scope.isSingleDatasetSelected = function () {
        return $scope.selectedDatasets.length == 1;
    };

    /**
     * Check if there are more than one datasets selected
     * @returns {boolean}
     */
    $scope.isMultipleDatasetsSelected = function () {
        return $scope.selectedDatasets.length > 1;
    };

    $scope.clearSelection = function () {
        $scope.selectedDatasets.length = 0;
        $scope.selectedJobs.length = 0;
    };

    $scope.toggleDatasetSelection = function ($event, data) {
        $scope.activeDatasetId = data.datasetId;
        Utils.toggleSelection($event, data, $scope.getDatasetList(), $scope.selectedDatasets);
    };

    $scope.selectJob = function (event, job) {
        $scope.clearSelection();
        $scope.selectedJobs = [job];
    };

    $scope.deleteJobs = function (jobs) {
        SessionDataService.deleteJobs(jobs);
    };

    $scope.deleteDatasets = function (datasets) {
        SessionDataService.deleteDatasets(datasets);
    };

    $scope.getJob = function (jobId) {
        return SessionDataService.getJob(jobId);
    };

    $scope.renameDatasetDialog = function (dataset) {
        var result = prompt('Change the name of the node', dataset.name);
        if (result) {
            dataset.name = result;
        }
        SessionDataService.updateDataset(dataset);
    };

    $scope.showDefaultVisualization = function () {
        $scope.$broadcast('showDefaultVisualization', {});
    };

    // We are only handling the resize end event, currently only
    // working in workflow graph div
    $scope.$on("angular-resizable.resizeEnd", function () {
        $scope.$broadcast('resizeWorkFlowGraph', {});
    });

    angular.element($window).bind('resize', function () {
        $scope.$broadcast('resizeWorkFlowGraph', {});
    });

    $scope.getSessionId = function () {
        return $routeParams.sessionId;
    };

    $scope.getDatasetList = function () {
        return SessionDataService.getDatasetList();
    };

    $scope.getDatasetsMap = function () {
        return SessionDataService.datasetsMap;
    };

    $scope.getJobsMap = function () {
        return SessionEventService.jobsMap;
    };

    $scope.getModulesMap = function () {
        return SessionDataService.modulesMap;
    };

    $scope.exportDatasets = function (datasets) {
        SessionDataService.exportDatasets(datasets);
    };

    $scope.getDatasetUrl = function () {
        if ($scope.selectedDatasets && $scope.selectedDatasets.length > 0) {
            return SessionDataService.getDatasetUrl($scope.selectedDatasets[0]);
        }
    };

    $scope.openAddDatasetModal = function () {
        $uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/workflow/adddatasetmodal/adddatasetmodal.html',
            controller: 'AddDatasetModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                data: function () {
                    return SessionDataService;
                }
            }
        });
    };

    $scope.openErrorModal = function (title, toolError) {
        $uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/joberrormodal/joberrormodal.html',
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

    $scope.openSessionEditModal = function () {

        var modalInstance = $uibModal.open({
            templateUrl: 'app/views/sessions/session/sessioneditmodal/sessioneditmodal.html',
            controller: 'SessionEditModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                title: function () {
                    return angular.copy($scope.data.session.name);
                }
            }
        });

        modalInstance.result.then(function (result) {
            if (!result) {
                result = 'unnamed session';
            }
            $scope.data.session.name = result;
            SessionDataService.updateSession();
        }, function () {
            // modal dismissed
        });
    };

    $scope.openDatasetHistoryModal = function () {
        $uibModal.open({
            templateUrl: 'app/views/sessions/session/datasethistorymodal/datasethistorymodal.html',
            controller: 'DatasetHistoryModalController',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                selectedDatasets: function () {
                    return angular.copy($scope.selectedDatasets);
                }
            }
        });
    };
}

export default SessionController;