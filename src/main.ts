import {upgradeAdapter} from "app/upgradeadapter";
import * as angular from 'angular';

import {NavigationComponent} from "app/views/navigation/navigation.component";
import {LoginComponent} from "app/views/login/login.component";
import AuthenticationService from "app/authentication/authenticationservice";
import ConfigService from "app/services/config.service";
import ConfigurationResource from "app/resources/configurationresource";
import RouteConfiguration from "app/routes.config";
import ToolResource from "app/resources/toolresource";
import UtilsService from "app/services/utils.service";
import WorkflowGraphService from "app/views/sessions/session/workflow/workflowgraph.service";
import SessionEventService from "app/views/sessions/session/sessionevent.service";
import SessionDataService from "app/views/sessions/session/sessiondata.service";
import SelectionService from "app/views/sessions/session/selection.service";
import DatasetBoxComponent from "app/views/sessions/session/dataset/datasetbox.component";
import JobBoxComponent from "app/views/sessions/session/job/jobbox.component";
import searchDatasetFilter from "app/common/filter/searchdataset.filter";
import FileResource from "app/resources/fileresource";
import ToolsBoxComponent from "app/views/sessions/session/tools/toolsbox.component";
import ToolTitleComponent from "app/views/sessions/session/tools/tooltitle.component";
import CSVReader from "app/services/CSVReader";
import ToolService from "app/views/sessions/session/tools/tool.service";
import bytes from "app/common/filter/bytes.filter";
import isoDateFilter from "app/common/filter/isodate.filter"
import categoryFilter from "app/common/filter/category.filter";
import moduleFilter from "app/common/filter/module.filter";
import toolFilter from "app/common/filter/tool.filter";
import AddDatasetModalController from "app/views/sessions/session/workflow/adddatasetmodal/adddatasetmodal.controller";
import secondsFilter from "app/common/filter/seconds.filter";
import ParameterModalController from "app/views/sessions/session/tools/parametermodal/parametermodal.controller";
import ToolsModalController from "app/views/sessions/session/tools/toolsmodal/toolsmodal.controller";
import textVisualization from "app/views/sessions/session/visualization/textvisualization/textvisualization.component";
import spreadsheetVisualization from "app/views/sessions/session/visualization/spreadsheetvisualization/spreadsheetvisualization.component";
import imageVisualization from "app/views/sessions/session/visualization/imagevisualization/imagevisualization.directive";
import htmlVisualization from "app/views/sessions/session/visualization/htmlvisualization/htmlvisualization.component";
import toolCircle from "app/views/sessions/session/tools/toolcircle.directive";
import phenodataVisualization from "app/views/sessions/session/visualization/phenodata/phenodatavisualization.component";
import pdfVisualization from "app/views/sessions/session/visualization/pdf/pdfvisualization.component";
import workflowGraph from "app/views/sessions/session/workflow/workflowgraph.component";
import SourceModalController from "app/views/sessions/session/tools/sourcemodal/sourcemodal.controller";
import InputsModalController from "app/views/sessions/session/tools/inputsmodal/inputsmodal.controller";
import SessionEditModalController from "app/views/sessions/session/sessioneditmodal/sessioneditmodal.controller";
import JobErrorModalController from "app/views/sessions/session/joberrormodal/joberrormodal.controller";
import SessionResource from "app/resources/session.resource";
import SessionWorkerResource from "app/resources/sessionworker.resource";
import DatasetHistoryModalController from "app/views/sessions/session/datasethistorymodal/datasethistorymodal.controller";
import sessionList from "app/views/sessions/sessionlist.component";
import ParameterListComponent from "app/views/sessions/session/dataset/parameterlist.component";
import VisualizationBoxComponent from "app/views/sessions/session/visualization/visualizationbox.component";
import SessionComponent from "app/views/sessions/session/session.component";
import SingleDatasetComponent from "app/views/sessions/session/dataset/singledataset.component";
import ExpressionProfile from "app/views/sessions/session/visualization/expressionprofile/expressionprofile";
import ExpressionProfileService from "app/views/sessions/session/visualization/expressionprofile/expressionprofile.service";
import AddColumnController from "app/views/sessions/session/visualization/phenodata/addcolumn.controller";
import {TSVReader} from "app/services/TSVReader";
import {VennDiagram} from "app/views/sessions/session/visualization/venndiagram/venndiagram";
import CustomOnChange from "app/views/sessions/fileinput/fileinput.directive";

import ExpressionProfileTSVService from "app/views/sessions/session/visualization/expressionprofile/expressionprofileTSV.service";

angular.module('chipster-web', ['ngRoute', 'ngResource', 'LocalStorageModule', 'ngAnimate', 'flow', 'restangular',
        'ngWebSocket', 'angularResizable', 'ui.bootstrap', 'AuthenticationModule',
        'pdf', 'ngHandsontable'])

    .directive('login', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(LoginComponent))
    .directive('navigation', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(NavigationComponent))
    .directive('vennDiagram', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(VennDiagram))
    .directive('customOnChange', CustomOnChange)
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
    .service('ConfigService', upgradeAdapter.downgradeNg2Provider(ConfigService))
    .service('ConfigurationResource', upgradeAdapter.downgradeNg2Provider(ConfigurationResource))
    .service('ToolResource', ToolResource)
    .service('SessionEventService', SessionEventService)
    .service('SessionResource', SessionResource)
    .service('SessionWorkerResource', SessionWorkerResource)
    .service('SessionDataService', SessionDataService)
    .service('SelectionService', upgradeAdapter.downgradeNg2Provider(SelectionService))
    .service('FileResource', FileResource)
    .service('Utils', UtilsService)
    .service('WorkflowGraphService', WorkflowGraphService)
    .service('CSVReader', CSVReader)
    .service('TSVReader', upgradeAdapter.downgradeNg2Provider(TSVReader))
    .service('ToolService', ToolService)
    .service('ExpressionProfileService', upgradeAdapter.downgradeNg2Provider(ExpressionProfileService))
    .service('ExpressionProfileTSVService', upgradeAdapter.downgradeNg2Provider(ExpressionProfileTSVService))
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

angular.module('AuthenticationModule', [])
    .service('AuthenticationService', upgradeAdapter.downgradeNg2Provider(AuthenticationService));



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

upgradeAdapter.upgradeNg1Provider('localStorageService');
upgradeAdapter.upgradeNg1Provider('$http');
upgradeAdapter.upgradeNg1Provider('$rootScope');
upgradeAdapter.upgradeNg1Provider('$routeParams');
upgradeAdapter.upgradeNg1Provider('AuthenticationService');
upgradeAdapter.upgradeNg1Provider('ConfigurationResource');
upgradeAdapter.upgradeNg1Provider('ConfigService');
upgradeAdapter.upgradeNg1Provider('$location');
upgradeAdapter.upgradeNg1Provider('TSVReader');
upgradeAdapter.upgradeNg1Provider('FileResource');
upgradeAdapter.upgradeNg1Provider('SessionDataService');

upgradeAdapter.bootstrap(document.documentElement, ['chipster-web']);
