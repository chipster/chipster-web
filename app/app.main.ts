import {upgradeAdapter} from "./upgradeadapter";
import './rxjs-operators';

import {NavigationComponent} from "./views/navigation/navigation.component";
import {LoginComponent} from "./views/login/login.component";
import AuthenticationService from "./authentication/authenticationservice";
import ConfigService from "./services/config.service";
import ConfigurationResource from "./resources/configurationresource";
import RouteConfiguration from "./routes.config";
import ToolResource from "./resources/toolresource";
import UtilsService from "./services/utils.service";
import WorkflowGraphService from "./views/sessions/session/workflow/workflowgraph.service";
import SessionEventService from "./views/sessions/session/sessionevent.service";
import SessionDataService from "./views/sessions/session/sessiondata.service";
import SelectionService from "./views/sessions/session/selection.service";
import DatasetBoxComponent from "./views/sessions/session/dataset/datasetbox.component";
import JobBoxComponent from "./views/sessions/session/job/jobbox.component";
import searchDatasetFilter from "./common/filter/searchdataset.filter";
import FileResource from "./resources/fileresource";
import ToolsBoxComponent from "./views/sessions/session/tools/toolsbox.component";
import ToolTitleComponent from "./views/sessions/session/tools/tooltitle.component";
import TableService from "./services/CSVReader";
import ToolService from "./views/sessions/session/tools/tool.service";
import bytes from "./common/filter/bytes.filter";
import isoDateFilter from "./common/filter/isodate.filter"
import categoryFilter from "./common/filter/category.filter";
import moduleFilter from "./common/filter/module.filter";
import toolFilter from "./common/filter/tool.filter";
import AddDatasetModalController from "./views/sessions/session/workflow/adddatasetmodal/adddatasetmodal.controller";
import secondsFilter from "./common/filter/seconds.filter";
import ParameterModalController from "./views/sessions/session/tools/parametermodal/parametermodal.controller";
import ToolsModalController from "./views/sessions/session/tools/toolsmodal/toolsmodal.controller";
import textVisualization from "./views/sessions/session/visualization/textvisualization/textvisualization.component";
import spreadsheetVisualization from "./views/sessions/session/visualization/spreadsheetvisualization/spreadsheetvisualization.component";
import imageVisualization from "./views/sessions/session/visualization/imagevisualization/imagevisualization.directive";
import htmlVisualization from "./views/sessions/session/visualization/htmlvisualization/htmlvisualization.component";
import toolCircle from "./views/sessions/session/tools/toolcircle.directive";
import phenodataVisualization from "./views/sessions/session/visualization/phenodata/phenodatavisualization.component";
import pdfVisualization from "./views/sessions/session/visualization/pdf/pdfvisualization.component";
import workflowGraph from "./views/sessions/session/workflow/workflowgraph.component";
import SourceModalController from "./views/sessions/session/tools/sourcemodal/sourcemodal.controller";
import InputsModalController from "./views/sessions/session/tools/inputsmodal/inputsmodal.controller";
import SessionEditModalController from "./views/sessions/session/sessioneditmodal/sessioneditmodal.controller";
import JobErrorModalController from "./views/sessions/session/joberrormodal/joberrormodal.controller";
import SessionResource from "./resources/session.resource";
import DatasetHistoryModalController from "./views/sessions/session/datasethistorymodal/datasethistorymodal.controller";
import sessionList from "./views/sessions/sessionlist.component";
import ParameterListComponent from "./views/sessions/session/dataset/parameterlist.component";
import VisualizationBoxComponent from "./views/sessions/session/visualization/visualizationbox.component";
import SessionComponent from "./views/sessions/session/session.component";
import SingleDatasetComponent from "./views/sessions/session/dataset/singledataset.component";
import ExpressionProfile from "./views/sessions/session/visualization/expressionprofile/expressionprofile";
import ExpressionProfileService from "./views/sessions/session/visualization/expressionprofile/expressionprofile.service";
import AddColumnController from "./views/sessions/session/visualization/phenodata/addcolumn.controller";

angular.module('chipster-web', ['ngRoute', 'ngResource', 'LocalStorageModule', 'ngAnimate', 'flow', 'restangular',
        'ngWebSocket', 'angularResizable', 'ui.bootstrap',
        'pdf', 'ngHandsontable'])

    .directive('login', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(LoginComponent))
    .directive('navigation', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(NavigationComponent))
    .component('datasetBox', DatasetBoxComponent)
    .component('jobBox', JobBoxComponent)
    .component('toolsBox', ToolsBoxComponent)
    .component('toolTitle', ToolTitleComponent)
    .controller('AddDatasetModalController', AddDatasetModalController)
    .controller('ParameterModalController', ParameterModalController)
    .controller('ToolsModalController', ToolsModalController)
    .controller('InputsModalController', InputsModalController)
    .controller('SourceModalController', SourceModalController)
    .controller('SessionEditModalController', SessionEditModalController)
    .controller('DatasetHistoryModalController', DatasetHistoryModalController)
    .controller('JobErrorModalController', JobErrorModalController)
    .controller('AddColumnController', AddColumnController)
    .service('AuthenticationService', AuthenticationService)
    .service('ConfigService', ConfigService)
    .factory('ConfigurationResource', upgradeAdapter.downgradeNg2Provider(ConfigurationResource))
    .service('ToolResource', ToolResource)
    .service('SessionEventService', SessionEventService)
    .service('SessionResource', SessionResource)
    .service('SessionDataService', SessionDataService)
    .service('SelectionService', upgradeAdapter.downgradeNg2Provider(SelectionService))
    .service('FileResource', FileResource)
    .service('Utils', UtilsService)
    .service('WorkflowGraphService', WorkflowGraphService)
    .service('CSVReader', TableService)
    .service('ToolService', ToolService)
    .service('ExpressionProfileService', ExpressionProfileService)
    .filter('searchDatasetFilter', searchDatasetFilter)
    .filter('bytes', bytes)
    .filter('isoDate', isoDateFilter)
    .filter('categoryFilter', categoryFilter)
    .filter('moduleFilter', moduleFilter)
    .filter('toolFilter', toolFilter)
    .filter('seconds',secondsFilter)
    .directive('imageVisualization', imageVisualization)
    .directive('toolCircle', toolCircle)
    // cast to 'any' to hide type errors about bindings https://github.com/DefinitelyTyped/DefinitelyTyped/issues/9122
    .component('spreadsheetVisualization', <any>spreadsheetVisualization)
    .component('textVisualization', <any>textVisualization)
    .component('pdfVisualization', <any>pdfVisualization)
    .component('htmlVisualization', <any>htmlVisualization)
    .component('phenodataVisualization', <any>phenodataVisualization)
    .component('expressionProfile', ExpressionProfile)
    .component('workflowGraph', <any>workflowGraph)
    .component('sessionList', <any>sessionList)
    .component('parameterList', ParameterListComponent)
    .component('visualizationBox', VisualizationBoxComponent)
    .component('session', SessionComponent)
    .component('singleDataset', SingleDatasetComponent)
    .config(RouteConfiguration);


angular.module('chipster-web').config(
    function(flowFactoryProvider: any) {

        flowFactoryProvider.defaults = {
            // continuation from different browser session not implemented
            testChunks : false,
            method : 'octet',
            uploadMethod : 'PUT',
            // upload the chunks in order
            simultaneousUploads : 1,
            // don't spend time between requests too often
            chunkSize : 50000000,
            // fail on 409 Conflict
            permanentErrors : [ 404, 409, 415, 500, 501 ],
            // make numbers easier to read (default 500)
            progressCallbacksInterval : 1000,
            // manual's recommendation for big files
            speedSmoothingFactor : 0.02
        };
        /*
         * flowFactoryProvider.on('catchAll', function(event) {
         * console.log('catchAll', arguments); });
         */
        // process errors here, because the error callback in html file
        // doesn't have the chunk parameter
        flowFactoryProvider.on('error', function(msg: string, file: any, chunk: any) {
            file.errorMessage = chunk.xhr.status + ' '
                + chunk.xhr.statusText + ': ' + msg;
            file.errorMessageDetails = chunk.xhr.responseURL;
        });

    });

upgradeAdapter.upgradeNg1Provider('AuthenticationService');
upgradeAdapter.upgradeNg1Provider('ConfigService');
upgradeAdapter.upgradeNg1Provider('$location');
upgradeAdapter.bootstrap(document.documentElement, ['chipster-web']);
