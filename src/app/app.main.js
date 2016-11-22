"use strict";
var upgradeadapter_1 = require("./upgradeadapter");
var navigation_component_1 = require("./views/navigation/navigation.component");
var login_component_1 = require("./views/login/login.component");
var authenticationservice_1 = require("./authentication/authenticationservice");
var config_service_1 = require("./services/config.service");
var configurationresource_1 = require("./resources/configurationresource");
var routes_config_1 = require("./routes.config");
var toolresource_1 = require("./resources/toolresource");
var utils_service_1 = require("./services/utils.service");
var workflowgraph_service_1 = require("./views/sessions/session/workflow/workflowgraph.service");
var sessionevent_service_1 = require("./views/sessions/session/sessionevent.service");
var sessiondata_service_1 = require("./views/sessions/session/sessiondata.service");
var selection_service_1 = require("./views/sessions/session/selection.service");
var datasetbox_component_1 = require("./views/sessions/session/dataset/datasetbox.component");
var jobbox_component_1 = require("./views/sessions/session/job/jobbox.component");
var searchdataset_filter_1 = require("./common/filter/searchdataset.filter");
var fileresource_1 = require("./resources/fileresource");
var toolsbox_component_1 = require("./views/sessions/session/tools/toolsbox.component");
var tooltitle_component_1 = require("./views/sessions/session/tools/tooltitle.component");
var CSVReader_1 = require("./services/CSVReader");
var tool_service_1 = require("./views/sessions/session/tools/tool.service");
var bytes_filter_1 = require("./common/filter/bytes.filter");
var isodate_filter_1 = require("./common/filter/isodate.filter");
var category_filter_1 = require("./common/filter/category.filter");
var module_filter_1 = require("./common/filter/module.filter");
var tool_filter_1 = require("./common/filter/tool.filter");
var adddatasetmodal_controller_1 = require("./views/sessions/session/workflow/adddatasetmodal/adddatasetmodal.controller");
var seconds_filter_1 = require("./common/filter/seconds.filter");
var parametermodal_controller_1 = require("./views/sessions/session/tools/parametermodal/parametermodal.controller");
var toolsmodal_controller_1 = require("./views/sessions/session/tools/toolsmodal/toolsmodal.controller");
var textvisualization_component_1 = require("./views/sessions/session/visualization/textvisualization/textvisualization.component");
var spreadsheetvisualization_component_1 = require("./views/sessions/session/visualization/spreadsheetvisualization/spreadsheetvisualization.component");
var imagevisualization_directive_1 = require("./views/sessions/session/visualization/imagevisualization/imagevisualization.directive");
var htmlvisualization_component_1 = require("./views/sessions/session/visualization/htmlvisualization/htmlvisualization.component");
var toolcircle_directive_1 = require("./views/sessions/session/tools/toolcircle.directive");
var phenodatavisualization_component_1 = require("./views/sessions/session/visualization/phenodata/phenodatavisualization.component");
var pdfvisualization_component_1 = require("./views/sessions/session/visualization/pdf/pdfvisualization.component");
var workflowgraph_component_1 = require("./views/sessions/session/workflow/workflowgraph.component");
var sourcemodal_controller_1 = require("./views/sessions/session/tools/sourcemodal/sourcemodal.controller");
var inputsmodal_controller_1 = require("./views/sessions/session/tools/inputsmodal/inputsmodal.controller");
var sessioneditmodal_controller_1 = require("./views/sessions/session/sessioneditmodal/sessioneditmodal.controller");
var joberrormodal_controller_1 = require("./views/sessions/session/joberrormodal/joberrormodal.controller");
var session_resource_1 = require("./resources/session.resource");
var sessionworker_resource_1 = require("./resources/sessionworker.resource");
var datasethistorymodal_controller_1 = require("./views/sessions/session/datasethistorymodal/datasethistorymodal.controller");
var sessionlist_component_1 = require("./views/sessions/sessionlist.component");
var parameterlist_component_1 = require("./views/sessions/session/dataset/parameterlist.component");
var visualizationbox_component_1 = require("./views/sessions/session/visualization/visualizationbox.component");
var session_component_1 = require("./views/sessions/session/session.component");
var singledataset_component_1 = require("./views/sessions/session/dataset/singledataset.component");
var expressionprofile_1 = require("./views/sessions/session/visualization/expressionprofile/expressionprofile");
var expressionprofile_service_1 = require("./views/sessions/session/visualization/expressionprofile/expressionprofile.service");
var addcolumn_controller_1 = require("./views/sessions/session/visualization/phenodata/addcolumn.controller");
var TSVReader_1 = require("./services/TSVReader");
var venndiagram_1 = require("./views/sessions/session/visualization/venndiagram/venndiagram");
var fileinput_directive_1 = require("./views/sessions/fileinput/fileinput.directive");
var expressionprofileTSV_service_1 = require("./views/sessions/session/visualization/expressionprofile/expressionprofileTSV.service");
angular.module('chipster-web', ['ngRoute', 'ngResource', 'LocalStorageModule', 'ngAnimate', 'flow', 'restangular',
    'ngWebSocket', 'angularResizable', 'ui.bootstrap', 'AuthenticationModule',
    'pdf', 'ngHandsontable'])
    .directive('login', upgradeadapter_1.upgradeAdapter.downgradeNg2Component(login_component_1.LoginComponent))
    .directive('navigation', upgradeadapter_1.upgradeAdapter.downgradeNg2Component(navigation_component_1.NavigationComponent))
    .directive('vennDiagram', upgradeadapter_1.upgradeAdapter.downgradeNg2Component(venndiagram_1.VennDiagram))
    .directive('customOnChange', fileinput_directive_1.default)
    .component('datasetBox', datasetbox_component_1.default)
    .component('jobBox', jobbox_component_1.default)
    .component('toolsBox', toolsbox_component_1.default)
    .component('toolTitle', tooltitle_component_1.default)
    .controller('AddDatasetModalController', adddatasetmodal_controller_1.default)
    .controller('ParameterModalController', parametermodal_controller_1.default)
    .controller('ToolsModalController', toolsmodal_controller_1.default)
    .controller('InputsModalController', inputsmodal_controller_1.default)
    .controller('SourceModalController', sourcemodal_controller_1.default)
    .controller('SessionEditModalController', sessioneditmodal_controller_1.default)
    .controller('DatasetHistoryModalController', datasethistorymodal_controller_1.default)
    .controller('JobErrorModalController', joberrormodal_controller_1.default)
    .controller('AddColumnController', addcolumn_controller_1.default)
    .service('ConfigService', upgradeadapter_1.upgradeAdapter.downgradeNg2Provider(config_service_1.default))
    .service('ConfigurationResource', upgradeadapter_1.upgradeAdapter.downgradeNg2Provider(configurationresource_1.default))
    .service('ToolResource', toolresource_1.default)
    .service('SessionEventService', sessionevent_service_1.default)
    .service('SessionResource', session_resource_1.default)
    .service('SessionWorkerResource', sessionworker_resource_1.default)
    .service('SessionDataService', sessiondata_service_1.default)
    .service('SelectionService', upgradeadapter_1.upgradeAdapter.downgradeNg2Provider(selection_service_1.default))
    .service('FileResource', fileresource_1.default)
    .service('Utils', utils_service_1.default)
    .service('WorkflowGraphService', workflowgraph_service_1.default)
    .service('CSVReader', CSVReader_1.default)
    .service('TSVReader', upgradeadapter_1.upgradeAdapter.downgradeNg2Provider(TSVReader_1.TSVReader))
    .service('ToolService', tool_service_1.default)
    .service('ExpressionProfileService', upgradeadapter_1.upgradeAdapter.downgradeNg2Provider(expressionprofile_service_1.default))
    .service('ExpressionProfileTSVService', upgradeadapter_1.upgradeAdapter.downgradeNg2Provider(expressionprofileTSV_service_1.default))
    .filter('searchDatasetFilter', searchdataset_filter_1.default)
    .filter('bytes', bytes_filter_1.default)
    .filter('isoDate', isodate_filter_1.default)
    .filter('categoryFilter', category_filter_1.default)
    .filter('moduleFilter', module_filter_1.default)
    .filter('toolFilter', tool_filter_1.default)
    .filter('seconds', seconds_filter_1.default)
    .directive('imageVisualization', imagevisualization_directive_1.default)
    .directive('toolCircle', toolcircle_directive_1.default)
    .component('spreadsheetVisualization', spreadsheetvisualization_component_1.default)
    .component('textVisualization', textvisualization_component_1.default)
    .component('pdfVisualization', pdfvisualization_component_1.default)
    .component('htmlVisualization', htmlvisualization_component_1.default)
    .component('phenodataVisualization', phenodatavisualization_component_1.default)
    .component('expressionProfile', expressionprofile_1.default)
    .component('workflowGraph', workflowgraph_component_1.default)
    .component('sessionList', sessionlist_component_1.default)
    .component('parameterList', parameterlist_component_1.default)
    .component('visualizationBox', visualizationbox_component_1.default)
    .component('session', session_component_1.default)
    .component('singleDataset', singledataset_component_1.default)
    .config(routes_config_1.default);
angular.module('AuthenticationModule', [])
    .service('AuthenticationService', upgradeadapter_1.upgradeAdapter.downgradeNg2Provider(authenticationservice_1.default));
angular.module('chipster-web').config(function (flowFactoryProvider) {
    flowFactoryProvider.defaults = {
        // continuation from different browser session not implemented
        testChunks: false,
        method: 'octet',
        uploadMethod: 'PUT',
        // upload the chunks in order
        simultaneousUploads: 1,
        // don't spend time between requests too often
        chunkSize: 50000000,
        // fail on 409 Conflict
        permanentErrors: [404, 409, 415, 500, 501],
        // make numbers easier to read (default 500)
        progressCallbacksInterval: 1000,
        // manual's recommendation for big files
        speedSmoothingFactor: 0.02
    };
    /*
     * flowFactoryProvider.on('catchAll', function(event) {
     * console.log('catchAll', arguments); });
     */
    // process errors here, because the error callback in html file
    // doesn't have the chunk parameter
    flowFactoryProvider.on('error', function (msg, file, chunk) {
        file.errorMessage = chunk.xhr.status + ' '
            + chunk.xhr.statusText + ': ' + msg;
        file.errorMessageDetails = chunk.xhr.responseURL;
    });
});
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('localStorageService');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('$http');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('$rootScope');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('$routeParams');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('AuthenticationService');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('ConfigurationResource');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('ConfigService');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('$location');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('TSVReader');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('FileResource');
upgradeadapter_1.upgradeAdapter.upgradeNg1Provider('SessionDataService');
upgradeadapter_1.upgradeAdapter.bootstrap(document.documentElement, ['chipster-web']);
//# sourceMappingURL=app.main.js.map