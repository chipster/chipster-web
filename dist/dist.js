angular.module('chipster-web', ['chipster-resource', 'chipster-authentication', 'ngRoute', 'ngAnimate', 'flow',
    'restangular', 'LocalStorageModule', 'ngWebSocket', 'angularResizable', 'ui.bootstrap',
    'pdf', 'ngHandsontable']);
angular.module('chipster-web').config([
    'flowFactoryProvider',
    function (flowFactoryProvider) {
        flowFactoryProvider.defaults = {
            testChunks: false,
            method: 'octet',
            uploadMethod: 'PUT',
            simultaneousUploads: 1,
            chunkSize: 50000000,
            permanentErrors: [404, 409, 415, 500, 501],
            progressCallbacksInterval: 1000,
            speedSmoothingFactor: 0.02
        };
        flowFactoryProvider.on('error', function (msg, file, chunk) {
            file.errorMessage = chunk.xhr.status + ' '
                + chunk.xhr.statusText + ': ' + msg;
            file.errorMessageDetails = chunk.xhr.responseURL;
        });
    }]);
angular.module('chipster-web').filter('toolFilter', function () {
    return function (arr, searchTool) {
        if (!searchTool)
            return arr;
        var result = [];
        angular.forEach(arr, function (item) {
            if (item.name.toLowerCase().indexOf(searchTool.toLowerCase()) !== -1) {
                result.push(item);
            }
        });
        return result;
    };
});
angular.module('chipster-web').controller('NavigationController', function ($scope, AuthenticationService, $uibModal, $location, ConfigService) {
    $scope.isLoggedOut = function () {
        if (AuthenticationService.getToken() === null) {
            return true;
        }
    };
    $scope.logout = function () {
        AuthenticationService.logout();
        $location.path("/");
    };
    $scope.isLoggedIn = function () {
        if (AuthenticationService.getToken() !== null) {
            return true;
        }
    };
    $scope.getHost = function () {
        return ConfigService.getApiUrl();
    };
});
angular.module('chipster-web').directive('htmlVisualization', function ($sce) {
    return {
        restrict: 'E',
        scope: {
            src: "="
        },
        template: '<iframe frameBorder="0" sandbox="" width="100%" height="100%" ng-src="{{getUrl()}}"></iframe>',
        link: function ($scope) {
            $scope.getUrl = function () {
                return $sce.trustAsResourceUrl($scope.src + '&download=false&type=true');
            };
        }
    };
});
angular.module('chipster-web').run(function ($rootScope, $location, AuthenticationService, ConfigService) {
    ConfigService.init();
    $rootScope.$on("$routeChangeStart", function (event, next) {
        if (next.$$route.authenticated) {
            var userAuth = AuthenticationService.getToken();
            if (!userAuth) {
                console.log('token not found, forward to login');
                $location.path('/login');
            }
        }
    });
});
angular.module('chipster-web').directive('chipsterImage', function () {
    return {
        restrict: 'E',
        scope: {
            src: '='
        },
        template: '<div class="scrollable"><img ng-src="{{src}}"></div>'
    };
});
angular.module('chipster-web').controller('DatasetHistoryModalController', function ($log, $uibModalInstance) {
    this.close = function () {
        $uibModalInstance.dismiss();
    };
});
angular.module('chipster-web').directive('imageVisualization', function () {
    return {
        restrict: 'E',
        scope: {
            src: '='
        },
        template: '<div class="scrollable"><img ng-src="{{src}}"></div>'
    };
});
angular.module('chipster-authentication', ['LocalStorageModule']);
angular.module('chipster-resource', ['restangular']);
angular.module('chipster-web').controller('JobErrorModalController', function ($log, $uibModalInstance, toolErrorTitle, toolError) {
    this.toolErrorTitle = toolErrorTitle;
    this.toolError = toolError;
    this.close = function () {
        $uibModalInstance.close();
    };
});
angular.module('chipster-web').directive('pdfVisualization', function () {
    return {
        restrict: 'E',
        scope: {
            datasetId: "=",
            sessionId: "=",
            src: "="
        },
        template: '<div class="wrapper scrollable"><ng-pdf template-url="app/views/sessions/session/visualization/pdf/viewer.html" scale="page-fit"></ng-pdf></div>',
        link: function ($scope) {
            $scope.pdfFileName = 'PDF file';
            $scope.pdfUrl = $scope.src;
            $scope.scroll = 0;
            $scope.loading = 'loading';
            $scope.getNavStyle = function (scroll) {
                if (scroll > 100)
                    return 'pdf-controls fixed';
                else
                    return 'pdf-controls';
            };
            $scope.onError = function (error) {
                console.log(error);
            };
            $scope.onLoad = function () {
                $scope.loading = '';
            };
            $scope.onProgress = function (progress) {
            };
        }
    };
});
angular.module('chipster-resource').factory('FileRestangular', function (Restangular, AuthenticationService, ConfigService) {
    var service = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl(ConfigService.getFileBrokerUrl());
        RestangularConfigurer.setDefaultHeaders(AuthenticationService.getTokenHeader());
        RestangularConfigurer.setFullResponse(true);
    });
    service.getData = function (sessionId, datasetId) {
        return this.one('sessions', sessionId)
            .one('datasets', datasetId)
            .get();
    };
    return service;
});
angular.module('chipster-web').controller('SessionCtrl', function ($scope, $routeParams, $q, SessionRestangular, AuthenticationService, $websocket, $http, $window, WorkflowGraphService, ConfigService, $location, Utils, $filter, $log, $uibModal, SessionEventService) {
    $scope.sessionUrl = SessionRestangular.one('sessions', $routeParams.sessionId);
    $scope.datasetSearch = {};
    $scope.selectedDatasets = [];
    $scope.selectedJobs = [];
    $scope.selectedTool = null;
    $scope.selectedToolIndex = -1;
    $scope.istoolselected = false;
    $scope.selectedTab = 1;
    $scope.toolDetailList = null;
    $scope.searched_dataset_name = null;
    $scope.data = {
        sessionId: $routeParams.sessionId,
        jobsMap: new Map(),
        datasetsMap: new Map(),
        workflowData: {}
    };
    $scope.datasetSearchKeyEvent = function (e) {
        if (e.keyCode == 13) {
            var allDatasets = $scope.getDatasetList();
            $scope.selectedDatasets = $filter('searchDatasetFilter')(allDatasets, $scope.datasetSearch.value);
            $scope.datasetSearch.value = null;
        }
        if (e.keyCode == 27) {
            $scope.datasetSearch.value = null;
        }
    };
    $scope.getWorkflowCallback = function () {
        return $scope;
    };
    $scope.getDatasetList = function () {
        return Utils.mapValues($scope.data.datasetsMap);
    };
    $scope.setTab = function (tab) {
        $scope.selectedTab = tab;
    };
    $scope.isTab = function (tab) {
        return $scope.selectedTab === tab;
    };
    $scope.isDatasetSelected = function () {
        return $scope.selectedDatasets.length > 0;
    };
    $scope.isJobSelected = function () {
        return $scope.selectedJobs.length > 0;
    };
    $scope.isSelectedDataset = function (data) {
        return $scope.selectedDatasets.indexOf(data) !== -1;
    };
    $scope.isSelectedJob = function (data) {
        return $scope.selectedJobs.indexOf(data) !== -1;
    };
    $scope.isSingleDatasetSelected = function () {
        return $scope.selectedDatasets.length == 1;
    };
    $scope.isMultipleDatasetsSelected = function () {
        return $scope.selectedDatasets.length > 1;
    };
    $scope.clearSelection = function () {
        $scope.selectedDatasets.length = 0;
        $scope.selectedJobs.length = 0;
    };
    $scope.toggleDatasetSelection = function ($event, data) {
        Utils.toggleSelection($event, data, $scope.getDatasetList(), $scope.selectedDatasets);
    };
    $scope.selectJob = function (event, job) {
        $scope.clearSelection();
        $scope.selectedJobs = [job];
    };
    $scope.deleteJobs = function (jobs) {
        angular.forEach(jobs, function (job) {
            var url = $scope.sessionUrl.one('jobs').one(job.jobId);
            url.remove().then(function (res) {
                $log.debug(res);
            });
        });
    };
    SessionRestangular.loadSession($routeParams.sessionId).then(function (data) {
        $scope.$apply(function () {
            $scope.data = data;
            var subscription = SessionEventService.subscribe($routeParams.sessionId, $scope.data, $scope.onSessionChange);
            $scope.$on("$destroy", function () {
                subscription.unsubscribe();
            });
        });
    });
    $scope.onSessionChange = function (event, oldValue, newValue) {
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
            if (newValue.state === 'FAILED' && oldValue.state !== 'FAILED') {
                $scope.openErrorModal('Job failed', newValue);
                $log.info(newValue);
            }
            if (newValue.state === 'ERROR' && oldValue.state !== 'ERROR') {
                $scope.openErrorModal('Job error', newValue);
                $log.info(newValue);
            }
        }
    };
    $scope.getDataSets = function () {
        $scope.datalist = $scope.sessionUrl.all('datasets')
            .getList();
    };
    $scope.deleteDatasets = function (datasets) {
        angular.forEach(datasets, function (dataset) {
            var datasetUrl = $scope.sessionUrl.one('datasets').one(dataset.datasetId);
            datasetUrl.remove().then(function (res) {
                $log.debug(res);
            });
        });
    };
    $scope.getJob = function (jobId) {
        return $scope.data.jobsMap.get(jobId);
    };
    $scope.renameDatasetDialog = function (dataset) {
        var result = prompt('Change the name of the node', dataset.name);
        if (result) {
            dataset.name = result;
        }
        $scope.updateDataset(dataset);
    };
    $scope.updateDataset = function (dataset) {
        var datasetUrl = $scope.sessionUrl.one('datasets').one(dataset.datasetId);
        return datasetUrl.customPUT(dataset);
    };
    $scope.updateSession = function () {
        $scope.sessionUrl.customPUT($scope.data.session);
    };
    $scope.getDatasetUrl = function () {
        if ($scope.selectedDatasets && $scope.selectedDatasets.length > 0) {
            return URI(ConfigService.getFileBrokerUrl())
                .path('sessions/' + $routeParams.sessionId + '/datasets/' + $scope.selectedDatasets[0].datasetId)
                .addQuery('token', AuthenticationService.getToken()).toString();
        }
    };
    $scope.showDefaultVisualization = function () {
        $scope.$broadcast('showDefaultVisualization', {});
    };
    $scope.exportDatasets = function (datasets) {
        angular.forEach(datasets, function (d) {
            $window.open($scope.getDatasetUrl(d), "_blank");
        });
    };
    $scope.$on("angular-resizable.resizeEnd", function () {
        $scope.$broadcast('resizeWorkFlowGraph', {});
    });
    angular.element($window).bind('resize', function () {
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
    $scope.openSessionEditModal = function () {
        var modalInstance = $uibModal.open({
            templateUrl: 'app/views/sessions/session/sessioneditmodal.html',
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
            $scope.updateSession();
        }, function () {
        });
    };
    $scope.openDatasetHistoryModal = function () {
        $uibModal.open({
            templateUrl: 'app/views/sessions/session/datasethistorymodal.html',
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
});
angular.module('chipster-web').directive('phenodataVisualization', function (FileRestangular, SessionRestangular, Utils, TableService) {
    return {
        restrict: 'E',
        scope: {
            datasets: '=selectedDatasets',
            datasetId: '=',
            sessionId: '=',
            src: '='
        },
        templateUrl: 'app/views/sessions/session/visualization/phenodata/phenodatavisualization.html',
        link: function ($scope, element) {
            var unremovableColumns = ['sample', 'original_name', 'dataset', 'column'];
            $scope.getSettings = function (array, headers) {
                return {
                    data: array,
                    colHeaders: headers,
                    columnSorting: true,
                    manualColumnResize: true,
                    sortIndicator: true,
                    afterGetColHeader: function (col, TH) {
                        if (unremovableColumns.indexOf(headers[col]) !== -1) {
                            return;
                        }
                        $scope.createRemoveButton(col, TH);
                    },
                    afterChange: function (changes, source) {
                        if (source === 'edit' || source === 'autofill' || source === 'paste') {
                            $scope.latestEdit = new Date().getTime();
                            $scope.updateDatasets();
                        }
                    }
                };
            };
            $scope.createRemoveButton = function (col, TH) {
                var button = document.createElement('A');
                button.className = 'btn btn-xs pull-right phenodata-header-button';
                var span = document.createElement('SPAN');
                span.className = 'glyphicon glyphicon-remove';
                button.appendChild(span);
                Handsontable.Dom.addEvent(button, 'click', function () {
                    $scope.removeColumn(col);
                });
                if (TH.firstChild.lastChild.nodeName === 'A') {
                    TH.firstChild.removeChild(TH.firstChild.lastChild);
                }
                TH.firstChild.appendChild(button);
            };
            $scope.addColumn = function () {
                var colHeaders = $scope.hot.getSettings().colHeaders;
                $scope.hot.alter('insert_col', colHeaders.length);
                colHeaders.pop();
                colHeaders.push($scope.colName);
                $scope.hot.updateSettings({
                    colHeaders: colHeaders
                });
                $scope.colName = '';
                $scope.updateDatasets();
            };
            $scope.removeColumn = function (index) {
                $scope.hot.alter('remove_col', index);
                $scope.updateDatasets();
            };
            $scope.reset = function () {
                angular.forEach($scope.datasets, function (dataset) {
                    if (Utils.getFileExtension(dataset.name) === 'tsv') {
                        $scope.resetTsv(dataset);
                    }
                    else {
                        $scope.resetGenericFile(dataset);
                    }
                });
            };
            $scope.resetTsv = function (dataset) {
                TableService.getColumns($scope.sessionId, dataset.datasetId).then(function (fileHeaders) {
                    var metadata = [];
                    var chipHeaders = fileHeaders.filter(function (header) {
                        return Utils.startsWith(header, 'chip.');
                    });
                    angular.forEach(chipHeaders, function (fileHeader) {
                        var entry = {
                            column: fileHeader,
                            key: 'sample',
                            value: fileHeader.replace('chip.', '')
                        };
                        metadata.push(entry);
                    });
                    dataset.metadata = metadata;
                    $scope.updateView();
                    $scope.updateDatasets(true);
                });
            };
            $scope.resetGenericFile = function (dataset) {
                dataset.metadata = [{
                        column: null,
                        key: 'sample',
                        value: dataset.name
                    }];
                $scope.updateView();
                $scope.updateDatasets(true);
            };
            $scope.remove = function () {
                angular.forEach($scope.datasets, function (dataset) {
                    dataset.metadata = null;
                });
                $scope.updateView();
                $scope.updateDatasets(true);
            };
            $scope.getHeaders = function (datasets) {
                var headers = {
                    dataset: true,
                    column: true
                };
                angular.forEach(datasets, function (dataset) {
                    angular.forEach(dataset.metadata, function (entry) {
                        headers[entry.key] = true;
                    });
                });
                return Object.keys(headers);
            };
            $scope.getRows = function (datasets, headers) {
                var array = [];
                function getRow(dataset, column) {
                    for (var i = 0; i < array.length; i++) {
                        if (array[i].datasetId === dataset.datasetId && array[i].columnName === column) {
                            return array[i];
                        }
                    }
                    row = Array.apply(null, new Array(headers.length)).map(function () { return undefined; });
                    row.datasetId = dataset.datasetId;
                    row.columnName = column;
                    row[0] = dataset.name;
                    row[1] = column;
                    array.push(row);
                    return row;
                }
                angular.forEach(datasets, function (dataset) {
                    angular.forEach(dataset.metadata, function (entry) {
                        var row = getRow(dataset, entry.column);
                        row[headers.indexOf(entry.key)] = entry.value;
                    });
                });
                return array;
            };
            $scope.updateDataset = function (dataset) {
                var datasetUrl = SessionRestangular.one('sessions', $scope.sessionId).one('datasets').one(dataset.datasetId);
                datasetUrl.customPUT(dataset).catch(function (res) {
                    console.log('dataset updated failed: ' + res);
                });
            };
            $scope.updateDatasets = function (updateAll) {
                var metadataMap = {};
                var array = $scope.array;
                var headers = $scope.headers;
                array.forEach(function (row) {
                    for (var i = 0; i < headers.length; i++) {
                        var entry = {
                            column: row.columnName,
                            key: headers[i],
                            value: row[i]
                        };
                        if (!metadataMap[row.datasetId]) {
                            metadataMap[row.datasetId] = [];
                        }
                        metadataMap[row.datasetId].push(entry);
                    }
                });
                angular.forEach($scope.datasets, function (dataset) {
                    var newMetadata = metadataMap[dataset.datasetId];
                    if (updateAll || !angular.equals(newMetadata, dataset.metadata)) {
                        dataset.metadata = newMetadata;
                        $scope.updateDataset(dataset);
                    }
                });
            };
            $scope.updateView = function () {
                var headers = $scope.getHeaders($scope.datasets);
                var array = $scope.getRows($scope.datasets, headers);
                if (!angular.equals(headers, $scope.headers)) {
                    $scope.headers = headers;
                    var container = document.getElementById('tableContainer');
                    while (container.firstChild) {
                        container.removeChild(container.firstChild);
                    }
                    $scope.hot = new Handsontable(container, $scope.getSettings($scope.array, $scope.headers));
                }
                $scope.array = array;
                $scope.hot.loadData($scope.array);
            };
            $scope.updateViewLater = function () {
                function isEditingNow() {
                    return new Date().getTime() - $scope.latestEdit < 1000;
                }
                if (!isEditingNow()) {
                    $scope.updateView();
                }
                else {
                    if (!$scope.deferredUpdatesTimer) {
                        $scope.deferredUpdatesTimer = setInterval(function () {
                            if (!isEditingNow()) {
                                clearInterval($scope.deferredUpdatesTimer);
                                $scope.deferredUpdatesTimer = undefined;
                                $scope.updateView();
                            }
                        }, 100);
                    }
                }
            };
            $scope.$watch('datasets', function () {
                if ($scope.datasets.length > 0) {
                    $scope.updateViewLater();
                }
            }, true);
            element.on('$destroy', function () {
                $scope.$destroy();
            });
            $scope.updateView();
        }
    };
});
var AuthenticationService = (function () {
    function AuthenticationService(localStorageService, $http, ConfigService) {
        this.localStorageService = localStorageService;
        this.$http = $http;
        this.ConfigService = ConfigService;
    }
    AuthenticationService.prototype.login = function (username, password) {
        var _this = this;
        this.setAuthToken(null);
        return this.requestToken('POST', username, password).then(function (response) {
            var token = response.data.tokenKey;
            _this.setAuthToken(token);
        });
    };
    ;
    AuthenticationService.prototype.logout = function () {
        this.localStorageService.clearAll();
    };
    ;
    AuthenticationService.prototype.getTokenHeader = function () {
        this.updateTokenHeader();
        return this.tokenHeader;
    };
    ;
    AuthenticationService.prototype.requestToken = function (method, username, password) {
        var string = username + ":" + password;
        var encodedString = btoa(string);
        var urlString = URI(this.ConfigService.getAuthUrl()).path('tokens').toString();
        return this.$http({
            url: urlString,
            method: method,
            withCredentials: true,
            headers: { 'Authorization': 'Basic ' + encodedString }
        });
    };
    ;
    AuthenticationService.prototype.getToken = function () {
        return this.localStorageService.get('auth-token');
    };
    ;
    AuthenticationService.prototype.setAuthToken = function (val) {
        this.localStorageService.set('auth-token', val);
        this.updateTokenHeader();
    };
    ;
    AuthenticationService.prototype.updateTokenHeader = function () {
        if (!this.tokenHeader) {
            this.tokenHeader = {};
        }
        this.tokenHeader['Authorization'] = 'Basic ' + btoa('token' + ':' + this.getToken());
    };
    ;
    AuthenticationService.$inject = ['localStorageService', '$http', 'ConfigService'];
    return AuthenticationService;
}());
angular.module('chipster-authentication').service('AuthenticationService', AuthenticationService);
angular.module('chipster-resource').factory('SessionRestangular', function (Restangular, AuthenticationService, ConfigService, ToolRestangular, $q, Utils) {
    var service = Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl(ConfigService.getSessionDbUrl());
        RestangularConfigurer.setDefaultHeaders(AuthenticationService.getTokenHeader());
        RestangularConfigurer.setFullResponse(true);
    });
    service.addRequestInterceptor(function (elem, operation) {
        if (operation === 'remove') {
            return undefined;
        }
        return elem;
    });
    service.loadSession = function (sessionId) {
        var sessionUrl = service.one('sessions', sessionId);
        var promises = [
            sessionUrl.get(),
            sessionUrl.all('datasets').getList(),
            sessionUrl.all('jobs').getList(),
            ToolRestangular.all('modules').getList(),
            ToolRestangular.all('tools').getList()
        ];
        return promise = new Promise(function (resolve) {
            $q.all(promises).then(function (res) {
                var session = res[0].data;
                var datasets = res[1].data;
                var jobs = res[2].data;
                var modules = res[3].data;
                var tools = res[4].data;
                var data = {};
                data.session = session;
                data.datasetsMap = Utils.arrayToMap(datasets, 'datasetId');
                data.jobsMap = Utils.arrayToMap(jobs, 'jobId');
                modules = modules.filter(function (module) {
                    return ConfigService.getModules().indexOf(module.name) >= 0;
                });
                data.modules = modules;
                data.tools = tools;
                modules.map(function (m) {
                    m.moduleId = m.name.toLowerCase();
                    return m;
                });
                data.modulesMap = Utils.arrayToMap(modules, 'moduleId');
                data.modulesMap.forEach(function (module) {
                    module.categoriesMap = Utils.arrayToMap(module.categories, 'name');
                });
                resolve(data);
            });
        });
    };
    return service;
});
angular.module('chipster-web').controller('SessionEditModalController', function ($scope, $uibModalInstance, title) {
    this.title = title;
    this.cancel = function () {
        $uibModalInstance.dismiss();
    };
    this.save = function () {
        $uibModalInstance.close(this.title);
    };
});
angular.module('chipster-web').directive('spreadsheetVisualization', function (FileRestangular) {
    return {
        restrict: 'E',
        scope: {
            datasetId: '=',
            sessionId: '=',
            src: '='
        },
        template: '<div class="scrollable" id="tableContainer"></div>',
        link: function ($scope) {
            FileRestangular.getData($scope.sessionId, $scope.datasetId).then(function (resp) {
                parserConfig = {
                    separator: '\t'
                };
                $.csv.toArrays(resp.data, parserConfig, function (err, array) {
                    var container = document.getElementById('tableContainer');
                    $scope.hot = new Handsontable(container, $scope.getSettings(array));
                });
            });
            $scope.getSettings = function (array) {
                return {
                    data: array.slice(1),
                    colHeaders: array[0],
                    columnSorting: true,
                    manualColumnResize: true,
                    sortIndicator: true,
                    readOnly: true
                };
            };
        }
    };
});
angular.module('chipster-resource').factory('ToolRestangular', function (Restangular, AuthenticationService, ConfigService) {
    return Restangular.withConfig(function (RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl(ConfigService.getToolboxUrl());
        RestangularConfigurer.setFullResponse(true);
    });
});
angular.module('chipster-web').factory('SessionEventService', function (ConfigService, $log, AuthenticationService, $websocket, SessionRestangular) {
    var service = {};
    service.ws = null;
    service.subscribe = function (sessionId, localData, onChange) {
        var eventUrl = ConfigService.getSessionDbEventsUrl(sessionId);
        $log.debug('eventUrl', eventUrl);
        service.ws = $websocket(new URI(eventUrl).addQuery('token', AuthenticationService.getToken()).toString());
        service.ws.onOpen(function () {
            $log.info('websocket connected');
        });
        service.ws.onMessage(function (event) {
            service.handleEvent(JSON.parse(event.data), sessionId, localData, onChange);
        });
        service.ws.onClose(function () {
            $log.info('websocket closed');
        });
        return {
            unsubscribe: function () {
                service.ws.close();
            }
        };
    };
    service.handleEvent = function (event, sessionId, data, onChange) {
        var sessionUrl = SessionRestangular.one('sessions', sessionId);
        $log.debug('websocket event', event);
        if (event.resourceType === 'AUTHORIZATION') {
            service.handleAuthorizationEvent(event, data, onChange);
        }
        else if (event.resourceType === 'SESSION') {
            service.handleSessionEvent(event, sessionUrl, data, onChange);
        }
        else if (event.resourceType === 'DATASET') {
            service.handleDatasetEvent(event, sessionUrl, data, onChange);
        }
        else if (event.resourceType === 'JOB') {
            service.handleJobEvent(event, sessionUrl, data, onChange);
        }
        else {
            $log.warn("unknwon resource type", event.resourceType, event);
        }
    };
    service.handleAuthorizationEvent = function (event, data, onChange) {
        if (event.type === 'DELETE') {
            onChange(event, data.session, null);
        }
        else {
            $log.warn("unknown event type", event);
        }
    };
    service.handleSessionEvent = function (event, sessionUrl, data, onChange) {
        if (event.type === 'UPDATE') {
            sessionUrl.get().then(function (resp) {
                var local = data.session;
                var localCopy = angular.copy(local);
                var remote = resp.data;
                angular.copy(remote, local);
                onChange(event, localCopy, remote);
            });
        }
        else {
            $log.warn("unknown event type", event);
        }
    };
    service.handleDatasetEvent = function (event, sessionUrl, data, onChange) {
        if (event.type === 'CREATE') {
            sessionUrl.one('datasets', event.resourceId).get().then(function (resp) {
                data.datasetsMap.set(event.resourceId, resp.data);
                onChange(event, null, resp.data);
            });
        }
        else if (event.type === 'UPDATE') {
            sessionUrl.one('datasets', event.resourceId).get().then(function (resp) {
                var local = data.datasetsMap.get(event.resourceId);
                var localCopy = angular.copy(local);
                var remote = resp.data;
                angular.copy(remote, local);
                onChange(event, localCopy, remote);
            });
        }
        else if (event.type === 'DELETE') {
            var localCopy = angular.copy(data.datasetsMap.get(event.resourceId));
            data.datasetsMap.delete(event.resourceId);
            onChange(event, localCopy, null);
        }
        else {
            $log.warn("unknown event type", event);
        }
    };
    service.handleJobEvent = function (event, sessionUrl, data, onChange) {
        if (event.type === 'CREATE') {
            sessionUrl.one('jobs', event.resourceId).get().then(function (resp) {
                data.jobsMap.set(event.resourceId, resp.data);
                onChange(event, null, resp.data);
            });
        }
        else if (event.type === 'UPDATE') {
            sessionUrl.one('jobs', event.resourceId).get().then(function (resp) {
                var local = data.jobsMap.get(event.resourceId);
                var localCopy = angular.copy(local);
                var remote = resp.data;
                angular.copy(remote, local);
                onChange(event, localCopy, remote);
            });
        }
        else if (event.type === 'DELETE') {
            var localCopy = angular.copy(data.jobsMap.get(event.resourceId));
            data.jobsMap.delete(event.resourceId);
            onChange(event, localCopy, null);
        }
        else {
            $log.warn("unknown event type", event.type, event);
        }
    };
    return service;
});
angular.module('chipster-web').directive('textVisualization', function (FileRestangular) {
    return {
        restrict: 'E',
        scope: {
            datasetId: "=",
            sessionId: "=",
            src: "="
        },
        template: "<p>{{data}}</p>",
        link: function ($scope) {
            FileRestangular.getData($scope.sessionId, $scope.datasetId).then(function (resp) {
                $scope.data = resp.data;
            });
        }
    };
});
angular.module('chipster-web').filter('bytes', function () {
    return function (bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes))
            return '-';
        if (bytes === 0)
            return '';
        if (typeof precision === 'undefined')
            precision = 1;
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'], number = Math
            .floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision)
            + ' ' + units[number];
    };
});
angular.module('chipster-web').config(function ($routeProvider) {
    $routeProvider
        .when('/', { templateUrl: 'app/views/home/home.html' })
        .when('/home', { templateUrl: 'app/views/home/home.html' })
        .when('/login', { templateUrl: 'app/views/login/login.html', controller: 'LoginCtrl' })
        .when('/sessions', { templateUrl: 'app/views/sessions/sessionlist.html', controller: 'SessionListCtrl', authenticated: true })
        .when('/sessions/:sessionId', { templateUrl: 'app/views/sessions/session/session.html', controller: 'SessionCtrl', authenticated: true })
        .otherwise({ templateUrl: 'app/views/home/home.html' });
});
angular.module('chipster-web').controller('ParameterModalController', function ($log, $uibModalInstance, $scope, selectedTool, inputBindings, selectedDatasets, ToolService, isRunEnabled, parameters) {
    var self = this;
    this.selectedTool = selectedTool;
    this.inputBindings = inputBindings;
    this.selectedDatasets = selectedDatasets;
    this.isRunEnabled = isRunEnabled;
    this.parameters = parameters;
    this.isSelectionParameter = ToolService.isSelectionParameter;
    this.isNumberParameter = ToolService.isNumberParameter;
    this.getDefaultValue = ToolService.getDefaultValue;
    this.getCompatibleDatasets = function (toolInput) {
        return this.selectedDatasets.filter(function (dataset) {
            return ToolService.isCompatible(dataset, toolInput.type.name);
        });
    };
    this.showDescription = function (description) {
        this.description = description;
    };
    this.runJob = function () {
        this.close(true);
    };
    this.close = function (run) {
        $uibModalInstance.close({
            parameters: this.parameters,
            inputBindings: this.inputBindings,
            run: run
        });
    };
    this.dismiss = function () {
        $uibModalInstance.dismiss();
    };
    $scope.$on('modal.closing', function (event, reason, closed) {
        if (!closed) {
            event.preventDefault();
            self.close(false);
        }
    });
});
angular.module('chipster-web').controller('VisualizationCtrl', function ($scope, $routeParams, FileRestangular, AuthenticationService, $compile, Utils) {
    $scope.setTab = function (value) {
        $scope.tab = value;
    };
    $scope.isTab = function (value) {
        return $scope.tab === value;
    };
    $scope.$watchCollection("selectedDatasets", function () {
        $scope.setTab(1);
        $scope.setCurrentVisualization(undefined);
    });
    $scope.setCurrentVisualization = function (newVisualization, directive) {
        if ($scope.currentVisualizationDirective) {
            $scope.currentVisualizationDirective.remove();
        }
        $scope.currentVisualization = newVisualization;
        $scope.currentVisualizationDirective = directive;
    };
    $scope.$on('showDefaultVisualization', function () {
        var visualizations = $scope.getVisualizations();
        if (visualizations.length > 0) {
            $scope.show(visualizations[0]);
        }
    });
    $scope.visualizations = [
        {
            directive: 'image-visualization',
            icon: 'glyphicon-picture',
            name: 'Image',
            extensions: ['png', "jpg", "jpeg"],
            preview: true,
            multipleDatasets: false
        },
        {
            directive: 'pdf-visualization',
            icon: 'glyphicon-book',
            name: 'PDF',
            extensions: ['pdf'],
            preview: true,
            multipleDatasets: false
        },
        {
            directive: 'spreadsheet-visualization',
            icon: 'glyphicon-th',
            name: 'Spreadsheet',
            extensions: ['tsv', 'bed'],
            preview: false,
            multipleDatasets: false
        },
        {
            directive: 'phenodata-visualization',
            icon: 'glyphicon-edit',
            name: 'Phenodata',
            extensions: ['tsv', 'bam'],
            preview: false,
            multipleDatasets: true
        },
        {
            directive: 'html-visualization',
            icon: 'glyphicon-globe',
            name: 'Html',
            extensions: ['html'],
            preview: true,
            multipleDatasets: false
        },
        {
            directive: 'text-visualization',
            icon: 'glyphicon-font',
            name: 'Text',
            extensions: ['txt', 'tsv', 'bed'],
            preview: false,
            multipleDatasets: false
        }
    ];
    $scope.setCurrentVisualization(undefined);
    $scope.isCompatibleWithDataset = function (visualization, dataset) {
        var extension = Utils.getFileExtension(dataset.name);
        return visualization.extensions.indexOf(extension.toLowerCase()) != -1;
    };
    $scope.isCompatible = function (visualization, datasets) {
        if (datasets && datasets.length === 1) {
            return $scope.isCompatibleWithDataset(visualization, datasets[0]);
        }
        else if (datasets && datasets.length > 1 && visualization.multipleDatasets) {
            for (var i = 0; i < datasets.length; i++) {
                if (!$scope.isCompatibleWithDataset(visualization, datasets[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };
    $scope.getVisualizations = function () {
        return $scope.visualizations.filter(function (visualization) {
            return $scope.isCompatible(visualization, $scope.selectedDatasets);
        });
    };
    $scope.showPreview = function () {
        var visualizations = $scope.getVisualizations();
        return visualizations.length === 1 && visualizations[0].preview;
    };
    $scope.show = function (vis) {
        if (!$scope.isSingleDatasetSelected) {
            console.log("trying to show visualization, but " + $scope.selectedDatasets.length + " datasets selected");
            return;
        }
        var directive = angular.element('<' + vis.directive + '/>');
        directive.attr('src', 'getDatasetUrl()');
        directive.attr('dataset-id', 'selectedDatasets[0].datasetId');
        directive.attr('session-id', "'" + $routeParams.sessionId + "'");
        directive.attr('selected-datasets', 'selectedDatasets');
        $compile(directive)($scope);
        var area = angular.element(document.getElementById("visualizationArea"));
        area.empty();
        area.append(directive);
        $scope.setTab(2);
        $scope.setCurrentVisualization(vis, directive);
    };
});
angular.module('chipster-web').filter('categoryFilter', function ($filter) {
    return function (arr, searchTool) {
        if (!searchTool)
            return arr;
        var result = [];
        angular.forEach(arr, function (category) {
            var filteredTools = $filter('toolFilter')(category.tools, searchTool);
            if (filteredTools.length > 0) {
                result.push(category);
            }
        });
        return result;
    };
});
angular.module('chipster-web').factory('ConfigService', ['$location',
    function ($location) {
        var service = {};
        service.init = function () {
            var serviceLocatorUrl = null;
            $.ajax({
                url: '/app/config.json',
                async: false,
                dataType: 'json',
                success: function (response) {
                    service.config = response;
                    serviceLocatorUrl = response.serviceLocator;
                    console.log('serviceLocator', serviceLocatorUrl);
                }
            });
            var baseURL;
            $.ajax({
                url: serviceLocatorUrl + '/services',
                async: false,
                dataType: 'json',
                success: function (response) {
                    service.services = {};
                    angular.forEach(response, function (s) {
                        var camelCaseRole = s.role.replace(/-([a-z])/g, function (m, w) {
                            return w.toUpperCase();
                        });
                        service.services[camelCaseRole] = s.publicUri;
                    });
                    baseURL = service.services.sessionDb;
                    console.log('sessionDb', service.services.sessionDb);
                }
            });
            service.baseUrl = baseURL;
        };
        service.getApiUrl = function () {
            return service.baseUrl;
        };
        service.getSessionDbUrl = function () {
            if (service.services.sessionDb) {
                return service.services.sessionDb;
            }
            return service.baseUrl + 'sessiondb' + '/';
        };
        service.getSessionDbEventsUrl = function (sessionId) {
            if (service.services.sessionDbEvents) {
                return URI(service.services.sessionDbEvents).path('events/' + sessionId).toString();
            }
            var eventUrl = service.baseUrl
                .replace('http://', 'ws://')
                .replace('https://', 'wss://')
                + 'sessiondbevents/events/' + sessionId;
            if (service.baseUrl === "") {
                eventUrl = "ws://" + $location.host() + ":" + $location.port()
                    + "/sessiondbevents/events/" + sessionId;
            }
            return eventUrl;
        };
        service.getAuthUrl = function () {
            if (service.services.authenticationService) {
                return service.services.authenticationService;
            }
            return service.baseUrl + 'auth' + '/';
        };
        service.getFileBrokerUrl = function () {
            if (service.services.fileBroker) {
                return service.services.fileBroker;
            }
            return service.baseUrl + 'filebroker' + '/';
        };
        service.getToolboxUrl = function () {
            if (service.services.toolbox) {
                return service.services.toolbox;
            }
            return service.baseUrl + 'toolbox/';
        };
        service.getModules = function () {
            return service.config.modules;
        };
        return service;
    }]);
angular.module('chipster-web').controller('SourceModalController', function ($log, $uibModalInstance, selectedTool, ToolRestangular) {
    var self = this;
    this.selectedTool = selectedTool;
    this.$onInit = function () {
        ToolRestangular.one('tools', this.selectedTool.name.id).customGET('source').then(function (response) {
            $log.log(response.data);
            self.source = response.data;
        });
    };
    this.close = function () {
        $uibModalInstance.close();
    };
});
angular.module('chipster-web').controller('AddDatasetModalController', function ($log, $uibModalInstance, Utils, data, $routeParams, SessionRestangular, ConfigService, AuthenticationService, WorkflowGraphService) {
    this.flowFileAdded = function (file, event, flow) {
        $log.debug('file added');
        flow.opts.target = function (file) {
            return file.chipsterTarget;
        };
        this.createDataset(file.name).then(function (dataset) {
            file.chipsterTarget = URI(ConfigService.getFileBrokerUrl())
                .path('sessions/' + $routeParams.sessionId + '/datasets/' + dataset.datasetId)
                .addQuery('token', AuthenticationService.getToken()).toString();
            file.resume();
        });
        file.pause();
    };
    this.createDataset = function (name) {
        var sessionUrl = SessionRestangular.one('sessions', $routeParams.sessionId);
        var d = {
            datasetId: null,
            name: name,
            x: null,
            y: null,
            sourceJob: null
        };
        $log.debug('createDataset', d);
        return new Promise(function (resolve) {
            var datasetUrl = sessionUrl.one('datasets');
            datasetUrl.customPOST(d).then(function (response) {
                $log.debug(response);
                var location = response.headers('Location');
                d.datasetId = location.substr(location.lastIndexOf('/') + 1);
                var pos = WorkflowGraphService.newRootPosition(Utils.mapValues(data.datasetsMap));
                d.x = pos.x;
                d.y = pos.y;
                data.datasetsMap.set(d.datasetId, d);
                var datasetUrl = sessionUrl.one('datasets').one(d.datasetId);
                datasetUrl.customPUT(d).then(function () {
                    resolve(d);
                });
            });
        });
    };
    this.flowFileSuccess = function (file) {
        file.cancel();
    };
    this.close = function () {
        $uibModalInstance.dismiss();
    };
});
angular.module('chipster-web').filter('moduleFilter', function ($filter) {
    return function (arr, searchTool) {
        if (!searchTool)
            return arr;
        var result = [];
        angular.forEach(arr, function (module) {
            var filteredTools = $filter('categoryFilter')(module.categories, searchTool);
            if (filteredTools.length > 0) {
                result.push(module);
            }
        });
        return result;
    };
});
angular.module('chipster-web').factory('TableService', function (FileRestangular) {
    var service = {};
    service.getColumns = function (sessionId, datasetId) {
        return FileRestangular.getData(sessionId, datasetId).then(function (resp) {
            return new Promise(function (resolve, reject) {
                parserConfig = {
                    separator: '\t'
                };
                $.csv.toArrays(resp.data, parserConfig, function (err, fileArray) {
                    if (fileArray) {
                        resolve(fileArray[0]);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        });
    };
    return service;
});
angular.module('chipster-web').controller('ToolCtrl', function ($scope, ToolRestangular, $filter, Utils, TableService, $q, $uibModal, ToolService) {
    $scope.activeTab = 0;
    $scope.selectedCategory = null;
    $scope.$watch('data.modules', function () {
        if ($scope.data.modules) {
            $scope.selectModule($scope.data.modules[0]);
        }
    });
    $scope.selectModule = function (module) {
        $scope.selectedModule = module;
        $scope.categories = module.categories;
        $scope.selectFirstVisible();
    };
    $scope.selectCategory = function (category) {
        $scope.selectedCategory = category;
    };
    $scope.selectTool = function (toolId) {
        angular.forEach($scope.data.tools, function (tool) {
            if (tool.name.id === toolId) {
                $scope.selectedTool = tool;
                $scope.job = {
                    toolId: $scope.selectedTool.name.id,
                    toolCategory: $scope.selectedCategory.name,
                    toolName: $scope.selectedTool.name.displayName,
                    toolDescription: $scope.selectedTool.description,
                    state: 'NEW',
                    parameters: $scope.selectedTool.parameters.map($scope.getJobParameter)
                };
            }
        });
        $scope.inputBindings = $scope.bindInputs($scope.selectedTool, $scope.selectedDatasets);
    };
    $scope.isRunEnabled = function () {
        return $scope.selectedDatasets.length > 0 && $scope.selectedTool;
    };
    $scope.isParametersEnabled = function () {
        return $scope.selectedTool && $scope.selectedTool.parameters.length > 0;
    };
    $scope.bindInputs = function (tool, datasets) {
        var unboundDatasets = datasets.slice();
        var inputBindings = [];
        for (var j = 0; j < tool.inputs.length; j++) {
            var toolInput = tool.inputs[j];
            if (toolInput.type === 'PHENODATA') {
                continue;
            }
            var found = false;
            for (var i = 0; i < unboundDatasets.length; i++) {
                var dataset = unboundDatasets[i];
                if (ToolService.isCompatible(dataset, toolInput.type.name)) {
                    inputBindings.push({
                        toolInput: toolInput,
                        dataset: dataset
                    });
                    unboundDatasets.splice(unboundDatasets.indexOf(dataset), 1);
                    found = true;
                    break;
                }
            }
            if (!found) {
                return null;
            }
        }
        return inputBindings;
    };
    $scope.runJob = function () {
        var jobToRun = angular.copy($scope.job);
        for (var _i = 0, _a = jobToRun.parameters; _i < _a.length; _i++) {
            jobParameter = _a[_i];
            delete jobParameter.toolParameter;
        }
        jobToRun.inputs = [];
        for (var _b = 0, _c = $scope.inputBindings; _b < _c.length; _b++) {
            inputBinding = _c[_b];
            var jobInput = {
                inputId: inputBinding.toolInput.name.id,
                description: inputBinding.toolInput.description,
                datasetId: inputBinding.dataset.datasetId,
                displayName: inputBinding.dataset.name
            };
            jobToRun.inputs.push(jobInput);
        }
        var postJobUrl = $scope.sessionUrl.one('jobs');
        postJobUrl.customPOST(jobToRun).then(function (response) {
            console.log(response);
        });
    };
    $scope.selectFirstVisible = function () {
        var filteredModules = $filter('moduleFilter')($scope.data.modules, $scope.searchTool);
        if (filteredModules && filteredModules.indexOf($scope.selectedModule) < 0 && filteredModules[0]) {
            $scope.selectModule(filteredModules[0]);
        }
        var filteredCategories = $filter('categoryFilter')($scope.selectedModule.categories, $scope.searchTool);
        if (filteredCategories && filteredCategories.indexOf($scope.selectedCategory) < 0 && filteredCategories[0]) {
            $scope.selectCategory(filteredCategories[0]);
        }
    };
    $scope.toolSearchKeyEvent = function (e) {
        if (e.keyCode == 13) {
            var visibleTools = $filter('toolFilter')($scope.selectedCategory.tools, $scope.searchTool);
            if (visibleTools[0]) {
                $scope.searchTool = null;
                $scope.selectTool(visibleTools[0].id);
            }
        }
        if (e.keyCode == 27) {
            $scope.searchTool = null;
        }
    };
    $scope.getJobParameter = function (toolParameter) {
        var jobParameter = {
            parameterId: toolParameter.name.id,
            displayName: toolParameter.name.displayName,
            description: toolParameter.description,
            type: toolParameter.type,
            value: ToolService.getDefaultValue(toolParameter),
            toolParameter: toolParameter
        };
        if (toolParameter.type === 'COLUMN_SEL') {
            $scope.getColumns().then(function (columns) {
                jobParameter.toolParameter.selectionOptions = columns.map(function (column) {
                    return { id: column };
                });
            });
        }
        if (toolParameter.type === 'METACOLUMN_SEL') {
            jobParameter.toolParameter.selectionOptions = $scope.getMetadataColumns().map(function (column) {
                return { id: column };
            });
        }
        return jobParameter;
    };
    $scope.getColumns = function () {
        var promises = [];
        angular.forEach($scope.selectedDatasets, function (dataset) {
            if ($scope.isCompatible(dataset, 'TSV')) {
                promises.push(TableService.getColumns($scope.getSessionId(), dataset.datasetId));
            }
        });
        return $q.all(promises).then(function (columnsOfSelectedDatasets) {
            var columnSet = new Set();
            for (var _i = 0, columnsOfSelectedDatasets_1 = columnsOfSelectedDatasets; _i < columnsOfSelectedDatasets_1.length; _i++) {
                columns = columnsOfSelectedDatasets_1[_i];
                for (var _a = 0, columns_1 = columns; _a < columns_1.length; _a++) {
                    column = columns_1[_a];
                    columnSet.add(column);
                }
            }
            return Array.from(columnSet);
        }, function (e) {
            console.log('failed to get columns', e);
        });
    };
    $scope.getMetadataColumns = function () {
        var keySet = new Set();
        angular.forEach($scope.selectedDatasets, function (dataset) {
            angular.forEach(dataset.metadata, function (entry) {
                keySet.add(entry.key);
            });
        });
        return Array.from(keySet);
    };
    $scope.openParameterModal = function () {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/tools/parametermodal.html',
            controller: 'ParameterModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                selectedTool: function () {
                    return angular.copy($scope.selectedTool);
                },
                inputBindings: function () {
                    return angular.copy($scope.inputBindings);
                },
                selectedDatasets: function () {
                    return angular.copy($scope.selectedDatasets);
                },
                isRunEnabled: function () {
                    return $scope.isRunEnabled();
                },
                parameters: function () {
                    return angular.copy($scope.job.parameters);
                }
            }
        });
        modalInstance.result.then(function (result) {
            $scope.job.parameters = result.parameters;
            $scope.inputBindings = result.inputBindings;
            if (result.run) {
                $scope.runJob();
            }
        }, function () {
        });
    };
    $scope.openSourceModal = function () {
        $uibModal.open({
            animation: true,
            templateUrl: 'app/views/sessions/session/tools/sourcemodal.html',
            controller: 'SourceModalController',
            controllerAs: 'vm',
            bindToController: true,
            size: 'lg',
            resolve: {
                selectedTool: function () {
                    return angular.copy($scope.selectedTool);
                }
            }
        });
    };
});
angular.module('chipster-web').directive('workflowGraph', function ($window, WorkflowGraphService, Utils) {
    return {
        restrict: 'EA',
        require: '^ngController',
        scope: {
            datasetsMap: '=datasetsMap',
            jobsMap: '=jobsMap',
            modulesMap: '=modulesMap',
            callback: '=callback',
            zoom: '=zoom',
            enabled: '=enabled'
        },
        template: '<div id="workflow-container" class="fill"></div>',
        link: function (scope) {
            var d3 = $window.d3;
            var svg, d3Links, d3Labels, vis, menu, d3JobNodes;
            var graph;
            var nodeWidth = WorkflowGraphService.nodeWidth;
            var nodeHeight = WorkflowGraphService.nodeHeight;
            var fontSize = 14;
            var nodeRadius = 4;
            scope.$on('resizeWorkFlowGraph', scope.renderGraph);
            scope.$on('searchDatasets', function (event, data) {
                if (graph) {
                    if (data.data) {
                        graph.filter = Utils.arrayToMap(data.data, 'datasetId');
                    }
                    else {
                        graph.filter = null;
                    }
                    renderGraph();
                }
            });
            scope.$watch('selectedDatasets', function () {
                if (graph) {
                    renderGraph();
                }
            }, true);
            scope.$on('datasetsMapChanged', function () {
                scope.update();
            });
            scope.$on('jobsMapChanged', function () {
                scope.update();
            });
            scope.$watchGroup(['datasetsMap', 'jobsMap', 'modulesMap'], function () {
                scope.update();
            }, true);
            scope.update = function () {
                var datasetNodes = scope.getDatasetNodes(scope.datasetsMap, scope.jobsMap, scope.modulesMap);
                var jobNodes = scope.getJobNodes(scope.jobsMap);
                var allNodes = [];
                angular.forEach(datasetNodes, function (n) {
                    allNodes.push(n);
                });
                angular.forEach(jobNodes, function (n) {
                    allNodes.push(n);
                });
                var links = scope.getLinks(allNodes);
                scope.doLayout(links, allNodes);
                graph = {
                    nodes: datasetNodes,
                    jobNodes: jobNodes,
                    links: links
                };
                renderGraph();
            };
            function renderJobs() {
                var arc = d3.svg.arc().innerRadius(6).outerRadius(10).startAngle(0).endAngle(0.75 * 2 * Math.PI);
                d3JobNodes = vis.append('g').attr('class', 'node').selectAll('rect');
                var rect = d3JobNodes.data(graph.jobNodes).enter().append('rect')
                    .attr('rx', nodeRadius)
                    .attr('ry', nodeRadius)
                    .attr('width', nodeWidth)
                    .attr('height', nodeHeight)
                    .attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                })
                    .style('fill', function (d, i) {
                    return getGradient(d, 'job' + i);
                })
                    .on('click', function (d) {
                    if (!scope.enabled) {
                        return;
                    }
                    scope.$apply(function () {
                        scope.callback.selectJob(d3.event, d.job);
                    });
                })
                    .on('mouseover', function () {
                    d3.select(this).style('filter', 'url(#drop-shadow)');
                })
                    .on('mouseout', function () {
                    d3.select(this).style('filter', null);
                });
                rect.each(function (d) {
                    d3.select(this).classed('selected', scope.enabled && scope.callback.isSelectedJob(d.job));
                });
                d3JobNodes.data(graph.jobNodes).enter().append('path')
                    .style('fill', function (d) {
                    return d.fgColor;
                })
                    .style('stroke-width', 0)
                    .attr('opacity', 0.5)
                    .style('pointer-events', 'none')
                    .attr('d', arc)
                    .call(spin, 3000);
                function spin(selection, duration) {
                    selection
                        .transition()
                        .ease('linear')
                        .duration(duration)
                        .attrTween('transform', function (d) {
                        var x = d.x + nodeWidth / 2;
                        var y = d.y + nodeHeight / 2;
                        if (d.spin) {
                            return d3.interpolateString('translate(' + x + ',' + y + ')rotate(0)', 'translate(' + x + ',' + y + ')rotate(360)');
                        }
                        else {
                            return d3.interpolateString('translate(' + x + ',' + y + ')', 'translate(' + x + ',' + y + ')');
                        }
                    });
                    setTimeout(function () {
                        spin(selection, duration);
                    }, duration);
                }
            }
            function renderBackground() {
                vis.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', width)
                    .attr('height', height)
                    .attr('opacity', 0)
                    .on('click', function () {
                    if (!scope.enabled) {
                        return;
                    }
                    scope.$apply(function () {
                        scope.callback.clearSelection();
                    });
                });
            }
            function renderNodes() {
                svgDatasetNodes = vis.append('g').attr('class', 'node').selectAll('rect');
                var tip = d3.tip().attr('class', 'd3-tip').offset([-10, 0]).html(function (d) { return d.name + ''; });
                svg.call(tip);
                svgDatasetNodes = svgDatasetNodes.data(graph.nodes).enter().append('rect')
                    .attr('x', function (d) { return d.x; })
                    .attr('y', function (d) { return d.y; })
                    .attr('rx', nodeRadius)
                    .attr('ry', nodeRadius)
                    .attr('width', nodeWidth).attr('height', nodeHeight)
                    .style("fill", getGradient)
                    .attr('opacity', function (d) {
                    return getOpacityForDataset(d.dataset);
                })
                    .on('dblclick', function () {
                    if (!scope.enabled) {
                        return;
                    }
                    scope.callback.showDefaultVisualization();
                })
                    .on('click', function (d) {
                    if (!scope.enabled) {
                        return;
                    }
                    scope.$apply(function () {
                        if (!Utils.isCtrlKey(d3.event)) {
                            scope.callback.clearSelection();
                        }
                        scope.callback.toggleDatasetSelection(d3.event, d.dataset);
                    });
                    tip.hide(d);
                })
                    .call(d3.behavior.drag()
                    .on('drag', function () {
                    if (!scope.enabled) {
                        return;
                    }
                    scope.dragStarted = true;
                    dragNodes(d3.event.dx, d3.event.dy);
                    d3.event.sourceEvent.preventDefault();
                })
                    .on('dragend', function () {
                    if (scope.dragStarted) {
                        scope.dragStarted = false;
                        dragEnd();
                    }
                }))
                    .on('contextmenu', d3.contextMenu(menu))
                    .on('mouseover', function (d) {
                    if (!scope.enabled) {
                        return;
                    }
                    d3.select(this).style('filter', 'url(#drop-shadow)');
                    tip.show(d);
                })
                    .on('mouseout', function (d) {
                    if (!scope.enabled) {
                        return;
                    }
                    d3.select(this).style('filter', null);
                    tip.hide(d);
                });
                svgDatasetNodes.each(function (d) {
                    d3.select(this).classed('selected', scope.enabled && scope.callback.isSelectedDataset(d.dataset));
                });
            }
            function getOpacityForDataset(d) {
                return getOpacity(!graph.filter || graph.filter.has(d.datasetId));
            }
            function getOpacity(isVisible) {
                if (isVisible) {
                    return 1.0;
                }
                else {
                    return 0.25;
                }
            }
            function renderLabels() {
                d3Labels = vis.append('g').selectAll('text').data(graph.nodes).enter()
                    .append('text').text(function (d) {
                    return Utils.getFileExtension(d.name).slice(0, 4);
                })
                    .attr('x', function (d) { return d.x + nodeWidth / 2; })
                    .attr('y', function (d) { return d.y + nodeHeight / 2 + fontSize / 4; })
                    .attr('font-size', fontSize + 'px').attr('fill', 'black').attr('text-anchor', 'middle')
                    .style('pointer-events', 'none')
                    .attr('opacity', function (d) {
                    return getOpacityForDataset(d.dataset);
                });
            }
            function renderLinks() {
                d3Links = vis.append('g').attr('class', 'link').selectAll('line');
                vis.append('defs').selectAll('marker').data(['end']).enter().append('marker')
                    .attr('id', String)
                    .attr('viewBox', '-7 -7 14 14')
                    .attr('refX', 6)
                    .attr('refY', 0)
                    .attr('markerWidth', 7)
                    .attr('markerHeight', 7)
                    .attr('orient', 'auto')
                    .append('path').attr('d', 'M 0,0 m -7,-7 L 7,0 L -7,7 Z')
                    .style('fill', '#555');
                d3Links = d3Links.data(graph.links).enter().append('line')
                    .attr('x1', function (d) { return d.source.x + nodeWidth / 2; })
                    .attr('y1', function (d) { return d.source.y + nodeHeight; })
                    .attr('x2', function (d) { return d.target.x + nodeWidth / 2; })
                    .attr('y2', function (d) { return d.target.y; })
                    .attr('opacity', function () {
                    return getOpacity(!graph.filter);
                })
                    .style('marker-end', 'url(#end)');
            }
            function dragNodes(dx, dy) {
                svgDatasetNodes.filter(function (d) { return scope.callback.isSelectedDataset(d.dataset); })
                    .attr('x', function (d) { return d.x += dx; })
                    .attr('y', function (d) { return d.y += dy; });
                d3Labels.filter(function (d) { return scope.callback.isSelectedDataset(d.dataset); })
                    .attr('x', function (d) { return d.x + dx + nodeWidth / 2; })
                    .attr('y', function (d) { return d.y + dy + nodeHeight / 2 + +fontSize / 4; });
                d3Links.filter(function (d) { return scope.callback.isSelectedDataset(d.source.dataset); })
                    .attr('x1', function (d) { return d.source.x + nodeWidth / 2; })
                    .attr('y1', function (d) { return d.source.y + nodeHeight; });
                d3Links.filter(function (d) { return scope.callback.isSelectedDataset(d.target.dataset); })
                    .attr('x2', function (d) { return d.target.x + nodeWidth / 2; })
                    .attr('y2', function (d) { return d.target.y; });
            }
            function dragEnd() {
                svgDatasetNodes.filter(function (d) {
                    return scope.callback.isSelectedDataset(d.dataset);
                }).each(function (d) {
                    if (d.dataset) {
                        d.dataset.x = d.x;
                        d.dataset.y = d.y;
                        scope.callback.updateDataset(d.dataset);
                    }
                });
            }
            function defineRightClickMenu() {
                menu = [{ title: 'Visualize', action: function () {
                            scope.callback.showDefaultVisualization();
                        } },
                    { title: 'Rename', action: function (elm, d) {
                            scope.callback.renameDatasetDialog(d.dataset);
                        } },
                    { title: 'Delete', action: function () {
                            scope.callback.deleteDatasets(scope.callback.selectedDatasets);
                        } },
                    { title: 'Export', action: function () {
                            scope.callback.exportDatasets(scope.callback.selectedDatasets);
                        } },
                    { title: 'View History as text', action: function () {
                            scope.callback.openDatasetHistoryModal();
                        } }
                ];
            }
            function renderGraph() {
                var element = document.getElementById('workflow-container');
                width = graph.width = Math.max(200, element.offsetWidth);
                height = graph.height = Math.max(200, element.offsetHeight);
                d3.select('svg').remove();
                var xScale = d3.scale.linear().domain([0, width]).range([0, width]);
                var yScale = d3.scale.linear().domain([0, height]).range([0, height]);
                svg = d3.select(element).append('svg').attr('width', width).attr('height', height);
                var zoomer = d3.behavior.zoom().scaleExtent([0.2, 1]).x(xScale).y(yScale).on('zoom', redraw);
                var lastScale = null;
                function redraw() {
                    if (!scope.enabled && d3.event.scale !== scope.zoom) {
                        return;
                    }
                    if (d3.event.scale === lastScale) {
                        if (d3.event.sourceEvent && d3.event.sourceEvent.defaultPrevented) {
                            return;
                        }
                    }
                    lastScale = d3.event.scale;
                    d3.event.translate[0] = Math.min(0, d3.event.translate[0]);
                    d3.event.translate[1] = Math.min(0, d3.event.translate[1]);
                    vis.attr('transform', 'translate('
                        + d3.event.translate + ')'
                        + 'scale(' + d3.event.scale + ')');
                }
                var svg_graph = svg.append('svg:g').call(zoomer);
                var rect = svg_graph.append('svg:rect').attr('width', width).attr('height', height)
                    .attr('fill', 'transparent');
                vis = svg_graph.append('svg:g');
                zoomer.scale(scope.zoom);
                zoomer.event(svg);
                createShadowFilter();
                renderBackground();
                if (scope.enabled) {
                    defineRightClickMenu();
                }
                renderLinks();
                renderNodes();
                renderLabels();
                renderJobs();
            }
            function createShadowFilter() {
                var filter = svg.append("defs").append("filter")
                    .attr("id", "drop-shadow")
                    .attr("x", "-50%")
                    .attr("y", "-50%")
                    .attr("height", "200%")
                    .attr("width", "200%");
                filter.append("feGaussianBlur")
                    .attr("in", "SourceGraphic")
                    .attr("stdDeviation", 3)
                    .attr("result", "blur");
                filter.append("feOffset")
                    .attr("in", "blur")
                    .attr("result", "offsetBlur");
                var feMerge = filter.append("feMerge");
                feMerge.append("feMergeNode").attr("in", "offsetBlur");
                feMerge.append("feMergeNode").attr("in", "SourceGraphic");
            }
            function getGradient(d, i) {
                var gradient = vis.append("defs")
                    .append("linearGradient")
                    .attr("id", "gradient" + i)
                    .attr("x1", "-100%")
                    .attr("y1", "-100%")
                    .attr("x2", "100%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");
                gradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", function () {
                    return 'white';
                })
                    .attr("stop-opacity", 1);
                gradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", function () {
                    return d.color;
                })
                    .attr("stop-opacity", 1);
                return 'url(#gradient' + i + ')';
            }
            scope.getDatasetNodes = function (datasetsMap, jobsMap, modulesMap) {
                var datasetNodes = [];
                datasetsMap.forEach(function (dataset) {
                    var color = 'gray';
                    if (dataset.sourceJob) {
                        if (jobsMap.has(dataset.sourceJob)) {
                            var sourceJob = jobsMap.get(dataset.sourceJob);
                            var module = modulesMap.get(sourceJob.module);
                            if (module) {
                                var category = module.categoriesMap.get(sourceJob.toolCategory);
                                if (category) {
                                    color = category.color;
                                }
                            }
                        }
                        else {
                            console.log('source job of dataset ' + dataset.name + ' not found');
                        }
                    }
                    datasetNodes.push({
                        x: dataset.x,
                        y: dataset.y,
                        name: dataset.name,
                        extension: Utils.getFileExtension(dataset.name),
                        sourceJob: sourceJob,
                        color: color,
                        dataset: dataset
                    });
                });
                return datasetNodes;
            };
            scope.getJobNodes = function (jobsMap) {
                var jobNodes = [];
                jobsMap.forEach(function (job) {
                    if (job.state !== 'COMPLETED') {
                        var fgColor = '#4d4ddd';
                        var color = 'lightGray';
                        var spin = true;
                        if (job.state === 'FAILED') {
                            color = 'yellow';
                            spin = false;
                        }
                        if (job.state === 'ERROR') {
                            color = 'red';
                            spin = false;
                        }
                        jobNodes.push({
                            x: null,
                            y: null,
                            fgColor: fgColor,
                            color: color,
                            spin: spin,
                            job: job,
                            sourceJob: job
                        });
                    }
                });
                return jobNodes;
            };
            scope.getLinks = function (nodes) {
                var links = [];
                var datasetNodesMap = new Map();
                angular.forEach(nodes, function (node) {
                    if (node.dataset) {
                        datasetNodesMap.set(node.dataset.datasetId, node);
                    }
                });
                angular.forEach(nodes, function (targetNode) {
                    if (targetNode.sourceJob) {
                        var sourceJob = targetNode.sourceJob;
                        sourceJob.inputs.forEach(function (input) {
                            var sourceNode = datasetNodesMap.get(input.datasetId);
                            if (sourceNode && targetNode) {
                                links.push({
                                    source: sourceNode,
                                    target: targetNode
                                });
                            }
                        });
                    }
                });
                return links;
            };
            scope.doLayout = function (links, nodes) {
                angular.forEach(links, function (link) {
                    if (!link.target.x || !link.target.y) {
                        var pos = WorkflowGraphService.newPosition(nodes, link.source.x, link.source.y);
                        link.target.x = pos.x;
                        link.target.y = pos.y;
                    }
                });
                angular.forEach(nodes, function (node) {
                    if (!node.x || !node.y) {
                        var pos = WorkflowGraphService.newRootPosition(nodes);
                        node.x = pos.x;
                        node.y = pos.y;
                    }
                });
            };
        }
    };
});
angular.module('chipster-web').filter('searchDatasetFilter', function ($rootScope) {
    return function (array, expression) {
        var result = [];
        if (!expression) {
            result = array;
        }
        else {
            angular.forEach(array, function (item) {
                if (item.name.toLowerCase().indexOf(expression.toLowerCase()) !== -1) {
                    result.push(item);
                }
            });
        }
        if (expression) {
            $rootScope.$broadcast('searchDatasets', { data: result });
        }
        else {
            $rootScope.$broadcast('searchDatasets', { data: null });
        }
        return result;
    };
});
angular.module('chipster-web').factory('Utils', function () {
    var service = {};
    service.getFileExtension = function (name) {
        return name.split('.').pop();
    };
    service.startsWith = function (data, start) {
        return data.substring(0, start.length) === start;
    };
    service.mapValues = function (map) {
        var array = [];
        map.forEach(function (value) {
            array.push(value);
        });
        return array;
    };
    service.arrayToMap = function (array, key) {
        var map = new Map();
        for (var i = 0; i < array.length; i++) {
            map.set(array[i][key], array[i]);
        }
        return map;
    };
    service.isCtrlKey = function (event) {
        return event.metaKey || event.ctrlKey;
    };
    service.isShiftKey = function (event) {
        return event.shiftKey;
    };
    service.toggleSelection = function (event, item, allItems, selectedItems) {
        function isSelectionEmpty() {
            return selectedItems.length === 0;
        }
        function selectionContains(item) {
            return selectedItems.indexOf(item) !== -1;
        }
        function removeFromSelection(item) {
            var index = selectedItems.indexOf(item);
            selectedItems.splice(index, 1);
        }
        function addToSelection(item) {
            if (!selectionContains(item)) {
                selectedItems.push(item);
            }
        }
        function setSelection(item) {
            selectedItems.length = 0;
            selectedItems.push(item);
        }
        if (service.isCtrlKey(event)) {
            if (selectionContains(item)) {
                removeFromSelection(item);
            }
            else {
                addToSelection(item);
            }
        }
        else if (service.isShiftKey(event)) {
            if (!isSelectionEmpty()) {
                var lastSelectedItem = selectedItems[selectedItems.length - 1];
                var indexOfLastSelection = allItems.indexOf(lastSelectedItem);
                var indexOfNewSelection = allItems.indexOf(item);
                var from, to;
                if (indexOfLastSelection < indexOfNewSelection) {
                    from = indexOfLastSelection + 1;
                    to = indexOfNewSelection + 1;
                }
                else {
                    from = indexOfNewSelection;
                    to = indexOfLastSelection;
                }
                for (var i = from; i < to; i++) {
                    addToSelection(allItems[i]);
                }
            }
            else {
                setSelection(item);
            }
        }
        else {
            setSelection(item);
        }
    };
    return service;
});
angular.module('chipster-web').factory('ToolService', function () {
    var service = {};
    service.isSelectionParameter = function (parameter) {
        return parameter.type === 'ENUM' ||
            parameter.type === 'COLUMN_SEL' ||
            parameter.type === 'METACOLUMN_SEL';
    };
    service.isNumberParameter = function (parameter) {
        return parameter.type === 'INTEGER' ||
            parameter.type === 'DECIMAL' ||
            parameter.type === 'PERCENT';
    };
    service.getDefaultValue = function (toolParameter) {
        if (this.isNumberParameter(toolParameter)) {
            return Number(toolParameter.defaultValue);
        }
        else {
            return toolParameter.defaultValue;
        }
    };
    service.isCompatible = function (dataset, type) {
        var alwaysCompatible = ['GENERIC', 'CDNA', 'GENE_EXPRS', 'GENELIST', 'PHENODATA'];
        if (alwaysCompatible.indexOf(type) !== -1) {
            return true;
        }
        var types = {
            TEXT: ['txt', 'dat', 'wee', 'seq', 'log', 'sam', 'fastq'],
            TSV: ['tsv'],
            CSV: ['csv'],
            PNG: ['png'],
            GIF: ['gif'],
            JPEG: ['jpg', 'jpeg'],
            PDF: ['pdf'],
            HTML: ['html', 'html'],
            TRE: ['tre'],
            AFFY: ['cel'],
            BED: ['bed'],
            GTF: ['gtf', 'gff', 'gff2', 'gff3'],
            FASTA: ['fasta', 'fa', 'fna', 'fsa', 'mpfa'],
            FASTQ: ['fastq', 'fq'],
            GZIP: ['gz'],
            VCF: ['vcf'],
            BAM: ['bam'],
            QUAL: ['qual'],
            MOTHUR_OLIGOS: ['oligos'],
            MOTHUR_NAMES: ['names'],
            MOTHUR_GROUPS: ['groups'],
            SFF: ['sff']
        };
        var extension = Utils.getFileExtension(dataset.name);
        return types[type].indexOf(extension) !== -1;
    };
    return service;
});
angular.module('chipster-web').factory('WorkflowGraphService', function () {
    var service = {
        nodeHeight: 20,
        nodeWidth: 32
    };
    service.xMargin = service.nodeWidth / 4;
    service.yMargin = service.nodeHeight;
    service.newRootPosition = function (nodes) {
        return service.newPosition(nodes, null, null);
    };
    service.newPosition = function (nodes, parentX, parentY) {
        var x = 10;
        var y = 10;
        if (parentX) {
            x = parentX;
        }
        if (parentY) {
            y = parentY + service.nodeHeight + service.yMargin;
        }
        while (service.intersectsAny(nodes, x, y, service.nodeWidth, service.nodeHeight)) {
            x += service.nodeWidth + service.xMargin;
        }
        return {
            x: x,
            y: y
        };
    };
    service.intersectsAny = function (nodes, x, y, w, h) {
        return !nodes.every(function (node) {
            return !service.intersectsNode(node, x, y, w, h);
        });
    };
    service.intersectsNode = function (node, x, y, w, h) {
        return (x + w >= node.x &&
            x < node.x + service.nodeWidth &&
            y + h >= node.y &&
            y < node.y + service.nodeHeight);
    };
    return service;
});
angular.module('chipster-web').filter('seconds', function () {
    return function (seconds) {
        if (isNaN(parseFloat(seconds)) || !isFinite(seconds))
            return '-';
        if (seconds === 0)
            return '';
        var units = ['seconds', 'minutes', 'hours'], number = Math.floor(Math
            .log(seconds)
            / Math.log(60));
        return (seconds / Math.pow(60, Math.floor(number))).toFixed(0) + ' '
            + units[number];
    };
});
angular.module('chipster-web').controller('LoginCtrl', function ($scope, $location, $http, AuthenticationService) {
    $scope.login = function () {
        AuthenticationService.login($scope.username, $scope.password).then(function () {
            $location.path("/sessions");
        }, function (response) {
            console.log('login failed', response);
            if (response) {
                if (response.status === 403) {
                    $scope.error = 'Incorrect username or password.';
                }
                else {
                    $scope.error = response.data;
                }
            }
            else {
                $scope.error = 'Could not connect to the server ' + baseURLString;
            }
        });
    };
});
angular.module('chipster-web').directive('toolCircle', function () {
    var radius = 3;
    return {
        restrict: 'EA',
        scope: {
            toolcolor: "="
        },
        template: "<canvas id='tcanvas' width=" + (radius * 2 + 5) + " height=" + (radius * 2 + 2) + ">",
        link: function (scope, element) {
            scope.canvas = element.find('canvas')[0];
            scope.context = scope.canvas.getContext('2d');
            var centerX = radius;
            var centerY = radius;
            scope.context.beginPath();
            scope.context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            scope.context.fillStyle = scope.toolcolor;
            scope.context.fill();
        }
    };
});
angular.module('chipster-web').controller('SessionListCtrl', function ($scope, $http, $location, SessionRestangular) {
    $scope.selectedSessions = [];
    $scope.userSessions = [];
    $scope.createSession = function () {
        var session = {
            sessionId: null,
            name: 'New session',
            notes: '',
            created: '2015-08-27T17:53:10.331Z',
            accessed: '2015-08-27T17:53:10.331Z'
        };
        SessionRestangular.one('sessions').customPOST(session).then(function (res) {
            if (res.headers) {
                var sessionLocation = res.headers('Location');
                session.sessionId = sessionLocation.substr(sessionLocation.lastIndexOf('/') + 1);
                $scope.openSession(session);
            }
        });
    };
    $scope.init = function () {
        $scope.updateSessions();
    };
    $scope.updateSessions = function () {
        SessionRestangular.all('sessions').getList().then(function (res) {
            $scope.userSessions = res.data;
        }, function (response) {
            console.log('failed to get sessions', response);
            if (response.status === 403) {
                $location.path('/login');
            }
        });
    };
    $scope.openSession = function (session) {
        $location.path("/sessions" + "/" + session.sessionId);
    };
    $scope.deleteSessions = function (sessions) {
        angular.forEach(sessions, function (session) {
            var sessionUrl = SessionRestangular.one('sessions').one(session.sessionId);
            sessionUrl.remove().then(function (res) {
                console.log("session deleted", res);
                $scope.updateSessions();
                $scope.selectedSessions = [];
            });
        });
    };
    $scope.selectSession = function (event, session) {
        $scope.selectedSessions = [session];
        if ($scope.selectedSessions.length === 1) {
            if (session !== $scope.previousSession) {
                $scope.previousSession = session;
                $scope.session = {};
                SessionRestangular.loadSession($scope.selectedSessions[0].sessionId).then(function (fullSession) {
                    if ($scope.selectedSessions[0] === session) {
                        $scope.$apply(function () {
                            $scope.session = fullSession;
                        });
                    }
                });
            }
        }
    };
    $scope.isSessionSelected = function (session) {
        return $scope.selectedSessions.indexOf(session) !== -1;
    };
    var callback = {
        isSelectedDataset: function () { },
        isSelectedJob: function () { }
    };
    $scope.getWorkflowCallback = function () {
        return callback;
    };
});
