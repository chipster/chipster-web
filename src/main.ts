import {upgradeAdapter} from "app/upgradeadapter";
import * as angular from 'angular';

import {NavigationComponent} from "app/views/navigation/navigation.component";
import {LoginComponent} from "app/views/login/login.component";
import AuthenticationService from "app/core/authentication/authenticationservice";
import ConfigService from "app/services/config.service";
import ConfigurationResource from "app/shared/resources/configurationresource";
import RouteConfiguration from "app/routes.config";
import {ToolResource} from "app/shared/resources/toolresource";
import WorkflowGraphService from "app/views/sessions/session/leftpanel/workflowgraph/workflowgraph.service";
import SessionEventService from "app/views/sessions/session/sessionevent.service";
import SessionDataService from "app/views/sessions/session/sessiondata.service";
import SelectionService from "app/views/sessions/session/selection.service";
import searchDatasetFilter from "app/common/filter/searchdataset.filter";
import FileResource from "app/resources/fileresource";
import ToolsBoxComponent from "app/views/sessions/session/tools/toolsbox.component";
import isoDateFilter from "app/common/filter/isodate.filter"
import categoryFilter from "app/common/filter/category.filter";
import moduleFilter from "app/common/filter/module.filter";
import toolFilter from "app/common/filter/tool.filter";
import bytesFilter from "app/common/filter/bytes.filter";
import AddDatasetModalController from "app/views/sessions/session/leftpanel/adddatasetmodal/adddatasetmodal.controller";
import secondsFilter from "app/common/filter/seconds.filter";
import ParameterModalController from "app/views/sessions/session/tools/parametermodal/parametermodal.controller";
import ToolsModalController from "app/views/sessions/session/tools/toolsmodal/toolsmodal.controller";
import SourceModalController from "app/views/sessions/session/tools/sourcemodal/sourcemodal.controller";
import InputsModalController from "app/views/sessions/session/tools/inputsmodal/inputsmodal.controller";
import SessionEditModalController from "app/views/sessions/session/leftpanel/sessioneditmodal/sessioneditmodal.controller";
import JobErrorModalController from "app/views/sessions/session/joberrormodal/joberrormodal.controller";
import SessionResource from "app/resources/session.resource";
import {SessionWorkerResource} from "app/shared/resources/sessionworker.resource";
import DatasetHistoryModalController from "app/views/sessions/session/datasethistorymodal/datasethistorymodal.controller";
import sessionList from "app/views/sessions/sessionlist.component";
import VisualizationBoxComponent from "app/views/sessions/session/visualization/visualizationbox.component";
import SessionComponent from "app/views/sessions/session/session.component";
import ExpressionProfileService from "app/views/sessions/session/visualization/expressionprofile/expressionprofile.service";
import AddColumnController from "app/views/sessions/session/visualization/phenodata/addcolumn.controller";
import CustomOnChange from "app/views/sessions/fileinput/fileinput.directive";
import LeftPanelComponent from "app/views/sessions/session/leftpanel/leftpanel.component";

import {SingleDatasetComponent} from "app/views/sessions/session/selectiondetails/singledataset/singledataset.component";
import {CSVReader} from "app/shared/services/CSVReader";
import {VennDiagram} from "app/views/sessions/session/visualization/venndiagram/venndiagram";
import {TSVReader} from "app/shared/services/TSVReader";
import {ExpressionProfileTSVService} from "app/views/sessions/session/visualization/expressionprofile/expressionprofileTSV.service";
import {ToolService} from "app/views/sessions/session/tools/tool.service";
import {ToolTitleComponent} from "app/views/sessions/session/tools/tooltitle.component";
import { HomeComponent } from "./app/views/home/home.component";
import {PdfVisualizationComponent} from "./app/views/sessions/session/visualization/pdf-visualization/pdf-visualization.component";
import {HtmlvisualizationComponent} from "./app/views/sessions/session/visualization/htmlvisualization/htmlvisualization.component";
import {TextVisualizationComponent} from "./app/views/sessions/session/visualization/textvisualization/textvisualization.component";
import {SpreadsheetVisualizationComponent} from "./app/views/sessions/session/visualization/spreadsheetvisualization/spreadsheetvisualization.component";
import {ExpressionProfileComponent} from "./app/views/sessions/session/visualization/expressionprofile/expressionprofile.component";
import {ImageVisualizationComponent} from "./app/views/sessions/session/visualization/imagevisualization/imagevisualization.component";
import {PhenodataVisualizationComponent} from "./app/views/sessions/session/visualization/phenodata/phenodatavisualization.component";
import {JobComponent} from "./app/views/sessions/session/selectiondetails/job/job.component";
import {DatasetDetailsComponent} from "./app/views/sessions/session/selectiondetails/datasetdetails/datasetdetails.component";
import {DatasetParameterListComponent} from "./app/views/sessions/session/selectiondetails/dataset-parameter-list/dataset-parameter-list.component";
import {ToolListItemComponent} from "./app/views/sessions/session/tools/toolsmodal/tool-list-item/tool-list-item.component";
import {WorkflowGraphComponent} from "./app/views/sessions/session/leftpanel/workflowgraph/workflowgraph.component";
import {RestService} from "./app/core/rest-services/restservice/rest.service";

angular.module('chipster-web', ['ngRoute', 'ngResource', 'ngAnimate', 'flow', 'restangular',
        'ngWebSocket', 'angularResizable', 'ui.bootstrap', 'AuthenticationModule', 'ngHandsontable'])

    // Angular 2
    .directive('chHome', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(HomeComponent))
    .directive('chLogin', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(LoginComponent))
    .directive('chNavigation', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(NavigationComponent))
    .directive('chVennDiagram', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(VennDiagram))
    .directive('chPdfVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(PdfVisualizationComponent))
    .directive('chHtmlvisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(HtmlvisualizationComponent))
    .directive('chSpreadsheetVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(SpreadsheetVisualizationComponent))
    .directive('chTextVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(TextVisualizationComponent))
    .directive('chExpressionProfile', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ExpressionProfileComponent))
    .directive('chImageVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ImageVisualizationComponent))
    .directive('chPhenodataVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(PhenodataVisualizationComponent))
    .directive('chJob', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(JobComponent))
    .directive('chDatasetDetails', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(DatasetDetailsComponent))
    .directive('chParameterList', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(DatasetParameterListComponent))
    .directive('chToolListItem', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ToolListItemComponent))
    .directive('chToolTitle', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ToolTitleComponent))
    .directive('chSingleDataset', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(SingleDatasetComponent))
    .directive('chWorkflowGraph', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(WorkflowGraphComponent))
    .service('ExpressionProfileService', upgradeAdapter.downgradeNg2Provider(ExpressionProfileService))
    .service('ExpressionProfileTSVService', upgradeAdapter.downgradeNg2Provider(ExpressionProfileTSVService))
    .service('ConfigService', upgradeAdapter.downgradeNg2Provider(ConfigService))
    .service('ConfigurationResource', upgradeAdapter.downgradeNg2Provider(ConfigurationResource))
    .service('SelectionService', upgradeAdapter.downgradeNg2Provider(SelectionService))
    .service('TSVReader', upgradeAdapter.downgradeNg2Provider(TSVReader))
    .service('ToolService', upgradeAdapter.downgradeNg2Provider(ToolService))
    .service('CSVReader', upgradeAdapter.downgradeNg2Provider(CSVReader))
    .service('WorkflowGraphService', upgradeAdapter.downgradeNg2Provider(WorkflowGraphService))
    .service('RestService', upgradeAdapter.downgradeNg2Provider(RestService))
    .service('ToolResource',  upgradeAdapter.downgradeNg2Provider(ToolResource))
    .service('SessionWorkerResource', upgradeAdapter.downgradeNg2Provider(SessionWorkerResource))
  .service('SessionEventService', upgradeAdapter.downgradeNg2Provider(SessionEventService))

  // Angular 2 version exists, can't upgrade. These needed in angularjs templates
  .filter('isoDate', isoDateFilter)
  .filter('categoryFilter', categoryFilter)
  .filter('moduleFilter', moduleFilter)
  .filter('toolFilter', toolFilter)
  .filter('seconds',secondsFilter)
  .filter('searchDatasetFilter', searchDatasetFilter)
  .filter('bytesFilter', bytesFilter )

  // Should be trivial to upgrade to Angular 2

  // Uprade simultaneously when refactoring restangular to Angular2 implementation
  .service('SessionResource', SessionResource)
  .service('SessionDataService', SessionDataService)
  .service('FileResource', FileResource)
  .component('sessionList', <any>sessionList)
  .component('session', SessionComponent)


    // Last to be upgraded
    .component('leftPanel', LeftPanelComponent)
    .component('toolsBox', ToolsBoxComponent)
    .controller('ToolsModalController', ToolsModalController)
    .controller('InputsModalController', InputsModalController)
    .controller('SourceModalController', SourceModalController)
    .directive('customOnChange', CustomOnChange)
    .controller('AddDatasetModalController', AddDatasetModalController)
    .controller('SessionEditModalController', SessionEditModalController)
    .controller('ParameterModalController', ParameterModalController)
    .controller('DatasetHistoryModalController', DatasetHistoryModalController)
    .controller('JobErrorModalController', JobErrorModalController)
    .controller('AddColumnController', AddColumnController)
    .component('visualizationBox', VisualizationBoxComponent)



    // cast to 'any' to hide type errors about bindings https://github.com/DefinitelyTyped/DefinitelyTyped/issues/9122
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

upgradeAdapter.upgradeNg1Provider('$http');
upgradeAdapter.upgradeNg1Provider('$element');
upgradeAdapter.upgradeNg1Provider('$window');
upgradeAdapter.upgradeNg1Provider('$rootScope');
upgradeAdapter.upgradeNg1Provider('$routeParams');
upgradeAdapter.upgradeNg1Provider('AuthenticationService');
upgradeAdapter.upgradeNg1Provider('ConfigurationResource');
upgradeAdapter.upgradeNg1Provider('ConfigService');
upgradeAdapter.upgradeNg1Provider('$location');
upgradeAdapter.upgradeNg1Provider('TSVReader');
upgradeAdapter.upgradeNg1Provider('FileResource');
upgradeAdapter.upgradeNg1Provider('SessionDataService');
upgradeAdapter.upgradeNg1Provider('CSVReader');
upgradeAdapter.upgradeNg1Provider('$uibModal');
upgradeAdapter.upgradeNg1Provider('Restangular');
upgradeAdapter.upgradeNg1Provider('$websocket');
upgradeAdapter.upgradeNg1Provider('SessionResource');


upgradeAdapter.bootstrap(document.documentElement, ['chipster-web']);
