/**
 * @desc Controllers that deals with Session Rest calls and post job and other
 *       session related details
 * @example <div ng-controller="SessionCtrl"></div>
 */
chipsterWeb
    .controller(
        'SessionCtrl',
        function ($scope, $routeParams, $q,
                  SessionRestangular, AuthenticationService, $websocket,
                  $http, $window, WorkflowGraphService,
                  ConfigService, $location, Utils, $filter) {

            // SessionRestangular is a restangular object with
            // configured baseUrl and
            // authorization header

            $scope.sessionUrl = SessionRestangular.one('sessions',
                $routeParams.sessionId);

            // creating a websocket object and start listening for the
            // events

            var eventUrl = ConfigService.getSessionDbEventsUrl($routeParams.sessionId);
            
            console.log(eventUrl);
            var ws = $websocket(new URI(eventUrl).addQuery('token', AuthenticationService.getToken()).toString());

            ws.onOpen(function () {
                console.log('websocket connected');
            });

            ws.onMessage(function (event) {
                $scope.handleEvent(event);
            });

            ws.onClose(function(){
                console.log('websocket closed');
            });

            // stop listening when leaving this view
            $scope.$on("$destroy", function(){
                ws.close();
            });

            $scope.handleEvent = function(event) {
                console.log('websocket event');
                console.log(event);

                if (event.resourceType === 'AUTHORIZATION') {

                    if (event.type === 'DELETE') {
                        $scope.$apply(function() {
                            alert('The session has been deleted.');
                            $location.path('sessions');
                        });

                    } else {
                        console.log("unknown event type", event);
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
                        console.log("unknown event type", event);
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

                            console.log('dataset updated', local, remote);

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
                        console.log("unknown event type", event);
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
                                $scope.toolErrorTitle = 'Job failed';
                                $scope.toolError = remote;
                                $('#toolErrorModal').modal('show');
                                console.log(remote);
                            }
                            if (remote.state === 'ERROR' && local.state !== 'ERROR') {
                                $scope.toolErrorTitle = 'Job error';
                                $scope.toolError = remote;
                                $('#toolErrorModal').modal('show');
                                console.log(remote);
                            }

                            // update the original instance
                            angular.copy(remote, local);
                            $scope.$broadcast('jobsMapChanged', {});
                        });

                    } else if (event.type === 'DELETE') {
                        $scope.data.jobsMap.delete(event.resourceId);
                        $scope.$broadcast('jobsMapChanged', {});

                    } else {
                        console.log("unknown event type", event);
                    }
                } else {
                    console.log("unknwon resource type", event);
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
                        console.log(res);
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

            $scope.flowFileAdded = function (file, event, flow) {

                console.log('file added');

                // get a separate target for each file
                flow.opts.target = function (file) {
                    return file.chipsterTarget;
                };

                $scope.createDataset(file.name).then(
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

            $scope.flowFileSuccess = function (file) {
                // remove completed files from the list
                file.cancel();
            };

            $scope.createDataset = function (name) {

                var d = {
                    datasetId: null,
                    name: name,
                    x: null,
                    y: null,
                    sourceJob: null
                };

                console.log(d);

                return new Promise(function (resolve) {
                    var datasetUrl = $scope.sessionUrl.one('datasets');
                    datasetUrl.customPOST(d).then(function (response) {
                        console.log(response);
                        var location = response.headers('Location');
                        d.datasetId = location.substr(location.lastIndexOf('/') + 1);

                        // put datasets immediately to datasetsMap not to position all uploaded files
                        // to the same place
                        var pos = WorkflowGraphService.newRootPosition(Utils.mapValues($scope.data.datasetsMap));
                        d.x = pos.x;
                        d.y = pos.y;
                        $scope.data.datasetsMap.set(d.datasetId, d);

                        $scope.updateDataset(d).then( function () {
                            resolve(d);
                        });
                    });
                });
            };

            $scope.deleteDatasets = function (datasets) {

                angular.forEach(datasets, function(dataset) {
                    var datasetUrl = $scope.sessionUrl.one('datasets').one(dataset.datasetId);
                    datasetUrl.remove().then(function (res) {
                        console.log(res);
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
                //TODO should we have separate read-only tokens for datasets?
                //TODO check if dataset(s) selected?
                return URI(ConfigService.getFileBrokerUrl())
                        .path('sessions/' + $routeParams.sessionId + '/datasets/' + $scope.selectedDatasets[0].datasetId)
                        .addQuery('token', AuthenticationService.getToken()).toString();
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
            }
        });

/**
 * Filter for searching dataset in dataset list view
 */
chipsterWeb.filter('searchDatasetFilter', function ($rootScope) {
    return function (array, expression) {

        var result = [];

        if (!expression) {
            result = array;

        } else {
            angular.forEach(array, function (item) {

                if (item.name.toLowerCase().indexOf(expression.toLowerCase()) !== -1) {
                    result.push(item);
                }
            });
        }

        //Here I am braodcasting the filtered result with rootScope to send it to workflowgraph directive, but there might be
        //a better way to make this communication
        $rootScope.$broadcast('searchDatasets', {data: result});

        return result;
    }

});
