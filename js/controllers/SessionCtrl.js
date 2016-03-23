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
                  baseURLString, $location, Utils) {

            // SessionRestangular is a restangular object with
            // configured baseUrl and
            // authorization header

            $scope.sessionUrl = SessionRestangular.one('sessions',
                $routeParams.sessionId);

            // creating a websocket object and start listening for the
            // events

            // different api server
            var eventUrl = $scope.sessionUrl.getRestangularUrl()
                .replace('http://', 'ws://')
                .replace('https://', 'wss://')
                .replace('sessiondb/sessions/', 'sessiondbevents/events/');

            // api and client served from the same host
            if (baseURLString === "") {
                eventUrl = "ws://" + $location.host() + ":" + $location.port()
                    + "/sessiondbevents/events/" + $routeParams.sessionId;
            }

            console.log(eventUrl);

            var ws = $websocket.$new({
                url: eventUrl + "?token=" + AuthenticationService.getToken(), protocols: []
            });

            ws.$on('$open', function () {
                console.log('websocket connected');
                /*$scope.wsKeepaliveTimer = setInterval( function() {
                    ws.$emit('ping');
                }, 5000);
                */

            }).$on('$message', function (event) {
                $scope.handleEvent(event);

            }).$on('$close',function(){
                console.log('websocket closed');
                /*clearInterval($scope.wsKeepaliveTimer);*/
            });

            // stop listening when leaving this view
            $scope.$on("$destroy", function(){
                ws.$close();
            });

            $scope.handleEvent = function(event) {
                console.log('websocket event');
                console.log(event);

                if (event.resourceType === 'DATASET') {

                    if (event.type === 'CREATE') {
                        $scope.sessionUrl.one('datasets', event.resourceId).get().then(function (resp) {
                            $scope.session.datasetsMap.set(event.resourceId, resp.data);
                            $scope.$broadcast('datasetsMapChanged', {});
                        });

                    } else if (event.type === 'UPDATE') {
                        $scope.sessionUrl.one('datasets', event.resourceId).get().then(function (resp) {
                            var local = $scope.session.datasetsMap.get(event.resourceId);
                            var remote = resp.data;

                            // update the original instance
                            angular.copy(remote, local);
                            $scope.$broadcast('datasetsMapChanged', {});
                        });

                    } else if (event.type === 'DELETE') {
                        $scope.$apply(function() {
                            $scope.session.datasetsMap.delete(event.resourceId);
                            $scope.$broadcast('datasetsMapChanged', {});
                        });

                    } else {
                        console.log("unknown event type", event);
                    }

                } else if (event.resourceType === 'JOB') {

                    if (event.type === 'CREATE') {
                        $scope.sessionUrl.one('jobs', event.resourceId).get().then(function (resp) {
                            $scope.session.jobsMap.set(event.resourceId, resp.data);
                            $scope.$broadcast('jobsMapChanged', {});
                        });

                    } else if (event.type === 'UPDATE') {
                        $scope.sessionUrl.one('jobs', event.resourceId).get().then(function (resp) {
                            var local = $scope.session.jobsMap.get(event.resourceId);
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
                        $scope.session.jobsMap.delete(event.resourceId);
                        $scope.$broadcast('jobsMapChanged', {});

                    } else {
                        console.log("unknown event type", event);
                    }
                } else {
                    console.log("unknwon resource type", event);
                }
            };

            // creating a session model object
            $scope.session = {
                sessionId: $routeParams.sessionId,
                sessionName: "",
                sessionDetail: "",
                jobsMap: new Map(),
                datasetsMap: new Map(),
                workflowData: {}
            };

            $scope.getWorkflowCallback = function() {
                return $scope;
            };

            $scope.getDatasetList = function () {
                return Utils.mapValues($scope.session.datasetsMap);
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
            $scope.isJobsSelected = function() {
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

            SessionRestangular.loadSession($routeParams.sessionId).then(function(session) {
               $scope.$apply(function() {
                   $scope.session = session;
               });
            });

            $scope.editSession = function () {
                var sessionObj = TemplateService.getSessionTemplate();

                sessionObj.sessionId = $scope.session.sessionId;
                sessionObj.name = $scope.session.sessionName;
                sessionObj.notes = $scope.session.sessionDetail;
                $scope.sessionUrl.customPUT(sessionObj).then(
                    function (res) {
                        console.log(res);
                    });

            };

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
                        file.chipsterTarget = baseURLString
                            + "filebroker/" + "sessions/"
                            + $routeParams.sessionId
                            + "/datasets/" + dataset.datasetId
                            + "?token="
                            + AuthenticationService.getToken();
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
                        var pos = WorkflowGraphService.newRootPosition(Utils.mapValues($scope.session.datasetsMap));
                        d.x = pos.x;
                        d.y = pos.y;
                        $scope.session.datasetsMap.set(d.datasetId, d);

                        $scope.updateDataset(d);

                        resolve(d);
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
                return $scope.session.jobsMap.get(jobId);
            };

            $scope.renameDatasetDialog = function(dataset) {
                var result = prompt('Change the name of the node', dataset.name);
                if(result) {dataset.name = result;}
                $scope.updateDataset(dataset);
            };

            $scope.updateDataset = function(dataset) {
                var datasetUrl = $scope.sessionUrl.one('datasets').one(dataset.datasetId);
                datasetUrl.customPUT(dataset);
            };

            /*
            $scope.orientVert = true;
            $scope.changeOrientation = function () {
                $scope.orientVert = !$scope.orientVert;
                $scope.loadWorkflowData();

            };

            // to get the right x,y after rotation, may be the calculation still not very right, need to work on that
            $scope.loadWorkflowData = function () {
                $scope.d3Data.nodes.forEach(function (elem) {
                    if ($scope.orientVert) {
                        elem.x = elem.c_id * 80 + 30;
                        elem.y = elem.level * 40 + elem.group * 40;
                    } else {
                        elem.x = (elem.level - 1) * 80 + 30;
                        elem.y = (elem.c_id * 40 + elem.group * 40)
                            - ((elem.level - 1) * 50);
                        console.log(elem.y);
                    }

                });

            };*/

            $scope.getDatasetUrl = function() {
                //TODO can Restangular build this?
                //TODO should we have separate read-only tokens for datasets?
                //TODO check if dataset(s) selected?
                return baseURLString
                    + 'filebroker/sessions/' + $routeParams.sessionId
                    + '/datasets/' + $scope.selectedDatasets[0].datasetId
                    + '?token=' + AuthenticationService.getToken();
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
        });

/**
 * Filter for searching dataset in dataset list view
 */
chipsterWeb.filter('searchDataset', function ($rootScope) {
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
