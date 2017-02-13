import './polyfills.ts';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppModule } from './app/app.module';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);


// import {upgradeAdapter} from "app/upgradeadapter";
// import * as angular from 'angular';
//
// import {NavigationComponent} from "app/views/navigation/navigation.component";
// import {LoginComponent} from "app/views/login/login.component";
// import AuthenticationService from "app/core/authentication/authenticationservice";
// import ConfigService from "app/shared/services/config.service";
// import ConfigurationResource from "app/shared/resources/configurationresource";
// import RouteConfiguration from "app/routes.config";
// import {ToolResource} from "app/shared/resources/toolresource";
// import WorkflowGraphService from "app/views/sessions/session/leftpanel/workflowgraph/workflowgraph.service";
// import SessionEventService from "app/views/sessions/session/sessionevent.service";
// import SessionDataService from "app/views/sessions/session/sessiondata.service";
// import SelectionService from "app/views/sessions/session/selection.service";
// import searchDatasetFilter from "app/common/filter/searchdataset.filter";
// import FileResource from "app/shared/resources/fileresource";
// import isoDateFilter from "app/common/filter/isodate.filter"
// import categoryFilter from "app/common/filter/category.filter";
// import moduleFilter from "app/common/filter/module.filter";
// import toolFilter from "app/common/filter/tool.filter";
// import bytesFilter from "app/common/filter/bytes.filter";
// import secondsFilter from "app/common/filter/seconds.filter";
// import ParameterModalController from "app/views/sessions/session/tools/parametermodal/parametermodal.controller";
// import {ToolsModalComponent} from "app/views/sessions/session/tools/toolsmodal/toolsmodal.component";
// import InputsModalController from "app/views/sessions/session/tools/inputsmodal/inputsmodal.controller";
// import JobErrorModalController from "app/views/sessions/session/joberrormodal/joberrormodal.controller";
// import SessionResource from "app/shared/resources/session.resource";
// import {SessionWorkerResource} from "app/shared/resources/sessionworker.resource";
// import {SessionComponent} from "app/views/sessions/session/session.component";
// import ExpressionProfileService from "app/views/sessions/session/visualization/expressionprofile/expressionprofile.service";
// import {AddColumnModalComponent} from "app/views/sessions/session/visualization/phenodata/add-column-modal/add-column-modal.component";
//
// import {LeftPanelComponent} from "app/views/sessions/session/leftpanel/leftpanel.component";
// import {SingleDatasetComponent} from "app/views/sessions/session/selectiondetails/singledataset/singledataset.component";
// import {VennDiagram} from "app/views/sessions/session/visualization/venndiagram/venndiagram";
// import {TSVReader} from "app/shared/services/TSVReader";
// import {ExpressionProfileTSVService} from "app/views/sessions/session/visualization/expressionprofile/expressionprofileTSV.service";
// import {ToolService} from "app/views/sessions/session/tools/tool.service";
// import {ToolTitleComponent} from "app/views/sessions/session/tools/tooltitle.component";
// import { HomeComponent } from "./app/views/home/home.component";
// import {PdfVisualizationComponent} from "./app/views/sessions/session/visualization/pdf-visualization/pdf-visualization.component";
// import {HtmlvisualizationComponent} from "./app/views/sessions/session/visualization/htmlvisualization/htmlvisualization.component";
// import {TextVisualizationComponent} from "./app/views/sessions/session/visualization/textvisualization/textvisualization.component";
// import {SpreadsheetVisualizationComponent} from "./app/views/sessions/session/visualization/spreadsheetvisualization/spreadsheetvisualization.component";
// import {ExpressionProfileComponent} from "./app/views/sessions/session/visualization/expressionprofile/expressionprofile.component";
// import {ImageVisualizationComponent} from "./app/views/sessions/session/visualization/imagevisualization/imagevisualization.component";
// import {PhenodataVisualizationComponent} from "./app/views/sessions/session/visualization/phenodata/phenodatavisualization.component";
// import {JobComponent} from "./app/views/sessions/session/selectiondetails/job/job.component";
// import {DatasetDetailsComponent} from "./app/views/sessions/session/selectiondetails/datasetdetails/datasetdetails.component";
// import {DatasetParameterListComponent} from "./app/views/sessions/session/selectiondetails/dataset-parameter-list/dataset-parameter-list.component";
// import {ToolListItemComponent} from "./app/views/sessions/session/tools/toolsmodal/tool-list-item/tool-list-item.component";
// import {WorkflowGraphComponent} from "./app/views/sessions/session/leftpanel/workflowgraph/workflowgraph.component";
// import {RestService} from "./app/core/rest-services/restservice/rest.service";
// import {TokenService} from "./app/core/authentication/token.service";
// import {SessionListComponent} from "./app/views/sessions/sessionlist.component";
// import {ToolBoxComponent} from "./app/views/sessions/session/tools/toolbox.component";
// import {VisualizationsComponent} from "./app/views/sessions/session/visualization/visualizationbox.component";
// import {AddDatasetModalContent} from "./app/views/sessions/session/leftpanel/adddatasetmodal/adddatasetmodal.content";
// import {AddDatasetModalComponent} from "./app/views/sessions/session/leftpanel/adddatasetmodal/adddatasetmodal.component";
// import {OpenSessionFile} from "./app/views/sessions/opensessionfile/opensessionfile.component";
// import {SessionEditModalComponent} from "./app/views/sessions/session/leftpanel/sessioneditmodal/sessioneditmodal.component";
// import UploadService from "./app/shared/services/upload.service";
// import DatasetModalService from "./app/views/sessions/session/selectiondetails/datasetmodal.service";
//
// angular.module('chipster-web', ['ngRoute', 'ngResource', 'ngAnimate',
//   'angularResizable', 'AuthenticationModule', 'ngHandsontable'])
//
//     // Angular 2
//     .directive('chHome', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(HomeComponent))
//     .directive('chLogin', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(LoginComponent))
//     .directive('chNavigation', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(NavigationComponent))
//     .directive('chVennDiagram', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(VennDiagram))
//     .directive('chPdfVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(PdfVisualizationComponent))
//     .directive('chHtmlvisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(HtmlvisualizationComponent))
//     .directive('chSpreadsheetVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(SpreadsheetVisualizationComponent))
//     .directive('chTextVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(TextVisualizationComponent))
//     .directive('chExpressionProfile', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ExpressionProfileComponent))
//     .directive('chImageVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ImageVisualizationComponent))
//     .directive('chPhenodataVisualization', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(PhenodataVisualizationComponent))
//     .directive('chJob', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(JobComponent))
//     .directive('chDatasetDetails', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(DatasetDetailsComponent))
//     .directive('chParameterList', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(DatasetParameterListComponent))
//     .directive('chToolListItem', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ToolListItemComponent))
//     .directive('chToolTitle', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ToolTitleComponent))
//     .directive('chSingleDataset', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(SingleDatasetComponent))
//     .directive('chWorkflowGraph', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(WorkflowGraphComponent))
//     .directive('chSessionList', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(SessionListComponent))
//     .directive('chSession', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(SessionComponent))
//     .directive('chToolbox', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ToolBoxComponent))
//     .directive('chVisualizations', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(VisualizationsComponent))
//     .directive('chLeftpanel', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(LeftPanelComponent))
//     .directive('chAddDatasetModal', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(AddDatasetModalComponent))
//     .directive('chAddDatasetModalContent', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(AddDatasetModalContent))
//     .directive('chOpenSessionFile', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(OpenSessionFile))
//     .directive('chSessionEditModal', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(SessionEditModalComponent))
//     .directive('chAddColumnModal', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(AddColumnModalComponent))
//     .directive('chToolsModal', <angular.IDirectiveFactory>upgradeAdapter.downgradeNg2Component(ToolsModalComponent))
//     .service('ExpressionProfileService', upgradeAdapter.downgradeNg2Provider(ExpressionProfileService))
//     .service('ExpressionProfileTSVService', upgradeAdapter.downgradeNg2Provider(ExpressionProfileTSVService))
//     .service('ConfigService', upgradeAdapter.downgradeNg2Provider(ConfigService))
//     .service('ConfigurationResource', upgradeAdapter.downgradeNg2Provider(ConfigurationResource))
//     .service('SelectionService', upgradeAdapter.downgradeNg2Provider(SelectionService))
//     .service('TSVReader', upgradeAdapter.downgradeNg2Provider(TSVReader))
//     .service('ToolService', upgradeAdapter.downgradeNg2Provider(ToolService))
//     .service('WorkflowGraphService', upgradeAdapter.downgradeNg2Provider(WorkflowGraphService))
//     .service('RestService', upgradeAdapter.downgradeNg2Provider(RestService))
//     .service('ToolResource',  upgradeAdapter.downgradeNg2Provider(ToolResource))
//     .service('SessionWorkerResource', upgradeAdapter.downgradeNg2Provider(SessionWorkerResource))
//     .service('SessionEventService', upgradeAdapter.downgradeNg2Provider(SessionEventService))
//     .service('SessionDataService', upgradeAdapter.downgradeNg2Provider(SessionDataService))
//     .service('FileResource', upgradeAdapter.downgradeNg2Provider(FileResource))
//     .service('SessionResource', upgradeAdapter.downgradeNg2Provider(SessionResource))
//     .service('UploadService', upgradeAdapter.downgradeNg2Provider(UploadService))
//     .service('DatasetModalService', upgradeAdapter.downgradeNg2Provider(DatasetModalService))
//
//     // Angular 2 version exists, can't upgrade. These needed in angularjs templates
//     .filter('isoDate', isoDateFilter)
//     .filter('categoryFilter', categoryFilter)
//     .filter('moduleFilter', moduleFilter)
//     .filter('toolFilter', toolFilter)
//     .filter('seconds',secondsFilter)
//     .filter('searchDatasetFilter', searchDatasetFilter)
//     .filter('bytesFilter', bytesFilter )
//
//     // Last to be upgraded
//     .controller('InputsModalController', InputsModalController)
//     .controller('ParameterModalController', ParameterModalController)
//     .controller('JobErrorModalController', JobErrorModalController)
//
//     // cast to 'any' to hide type errors about bindings https://github.com/DefinitelyTyped/DefinitelyTyped/issues/9122
//     .config(RouteConfiguration);
//
// angular.module('AuthenticationModule', [])
//     .service('AuthenticationService', upgradeAdapter.downgradeNg2Provider(AuthenticationService))
//     .service('TokenService', upgradeAdapter.downgradeNg2Provider(TokenService));
//
// upgradeAdapter.upgradeNg1Provider('$q');
// upgradeAdapter.upgradeNg1Provider('$element');
// upgradeAdapter.upgradeNg1Provider('$window');
// upgradeAdapter.upgradeNg1Provider('$rootScope');
// upgradeAdapter.upgradeNg1Provider('$routeParams');
// upgradeAdapter.upgradeNg1Provider('$route');
// upgradeAdapter.upgradeNg1Provider('AuthenticationService');
// upgradeAdapter.upgradeNg1Provider('TokenService');
// upgradeAdapter.upgradeNg1Provider('ConfigurationResource');
// upgradeAdapter.upgradeNg1Provider('ConfigService');
// upgradeAdapter.upgradeNg1Provider('$location');
// upgradeAdapter.upgradeNg1Provider('TSVReader');
// upgradeAdapter.upgradeNg1Provider('FileResource');
// upgradeAdapter.upgradeNg1Provider('SessionResource');
// upgradeAdapter.upgradeNg1Provider('SessionDataService');
// upgradeAdapter.upgradeNg1Provider('SessionEventService');
// upgradeAdapter.upgradeNg1Provider('WorkflowGraphService');
// upgradeAdapter.upgradeNg1Provider('CSVReader');
// upgradeAdapter.upgradeNg1Provider('UploadService');
// upgradeAdapter.upgradeNg1Provider('SessionWorkerResource');
// upgradeAdapter.upgradeNg1Provider('DatasetModalService');
// upgradeAdapter.upgradeNg1Provider('VisualizationModalService');
//
// upgradeAdapter.bootstrap(document.documentElement, ['chipster-web']);
