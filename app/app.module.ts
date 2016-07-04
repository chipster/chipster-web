import LoginController from "./views/login/login.controller";
import NavigationController from "./views/navigation/navigation.controller";
import SessionListCtrl from "./views/sessions/sessionlist.controller"
import AuthenticationService from "./authentication/authenticationservice";
import ConfigService from "./services/ConfigService";
import ConfigurationResource from "./resources/configurationresource";
import RouteConfiguration from "./routes.config";
import ChipsterRun from "./app.run";
import SessionRestangular from "./resources/session.resource";
import ToolRestangular from "./resources/tool.resource";
import Utils from "./services/Utils";
import SessionCtrl from "./views/sessions/session/session.controller";
import WorkflowGraphService from "./views/sessions/session/workflow/workflowgraph.service";
import SessionEventService from "./views/sessions/session/sessionevent.service";
import VisualizationCtrl from "./views/sessions/session/visualization/visualization.controller";
import searchDatasetFilter from "./common/filter/searchdataset.filter";
import FileRestangular from "./resources/filerestangular.resource";
import ToolCtrl from "./views/sessions/session/tools/tool.controller";
import TableService from "./services/tableservice.factory";
import ToolService from "./views/sessions/session/tools/tool.service";
import bytes from "./common/filter/bytes.filter";
import categoryFilter from "./common/filter/category.filter";
import moduleFilter from "./common/filter/module.filter";
import toolFilter from "./common/filter/tool.filter";
import AddDatasetModalController from "./views/sessions/session/workflow/adddatasetmodal.controller";
import secondsFilter from "./common/filter/seconds.filter";
import ParameterModalController from "./views/sessions/session/tools/parametermodal.controller";
import chipsterImage from "./directives/chipsterimage";
import textVisualization from "./views/sessions/session/visualization/textvisualization.directive";
import spreadsheetVisualization from "./views/sessions/session/visualization/spreadsheetvisualization.directive";
import imageVisualization from "./views/sessions/session/visualization/imagevisualization.directive";
import htmlVisualization from "./views/sessions/session/visualization/htmlvisualization.directive";
import toolCircle from "./views/sessions/session/tools/toolcircle.directive";
import phenodataVisualization from "./views/sessions/session/visualization/phenodata/phenodatavisualization.directive";
import pdfVisualization from "./views/sessions/session/visualization/pdf/pdfvisualization.directive";
import workflowGraph from "./views/sessions/session/workflow/workflowgraph.directive";
import SourceModalController from "./views/sessions/session/tools/sourcemodal.controller";
import SessionEditModalController from "./views/sessions/session/sessioneditmodal.controller";
import JobErrorModalController from "./views/sessions/session/joberrormodal.controller";
import SessionResource from "./resources/session.resource";


angular.module('chipster-web', ['ngRoute', 'ngResource', 'LocalStorageModule', 'ngAnimate', 'flow', 'restangular',
		 'ngWebSocket', 'angularResizable', 'ui.bootstrap',
		'pdf', 'ngHandsontable'])

	.controller('LoginController', LoginController)
	.controller('NavigationController', NavigationController)
	.controller('SessionListCtrl', SessionListCtrl)
	.controller('SessionCtrl', SessionCtrl)
	.controller('VisualizationCtrl', VisualizationCtrl)
	.controller('ToolCtrl', ToolCtrl)
	.controller('AddDatasetModalController', AddDatasetModalController)
	.controller('ParameterModalController', ParameterModalController)
	.controller('SourceModalController', SourceModalController)
	.controller('SessionEditModalController', SessionEditModalController)
	.controller('JobErrorModalController', JobErrorModalController)
	.service('AuthenticationService', AuthenticationService)
	.service('ConfigService', ConfigService)
	.service('ConfigurationResource', ConfigurationResource)
	.factory('SessionRestangular', SessionRestangular)
	.factory('ToolRestangular', ToolRestangular)
	.factory('Utils', Utils)
	.factory('SessionEventService', SessionEventService)
	.factory('WorkflowGraphService', WorkflowGraphService)
	.factory('FileRestangular', FileRestangular)
	.factory('TableService', TableService)
	.factory('ToolService', ToolService)
	.factory('SessionResource', SessionResource)
	.filter('searchDatasetFilter', searchDatasetFilter)
	.filter('bytes', bytes)
	.filter('categoryFilter', categoryFilter)
	.filter('moduleFilter', moduleFilter)
	.filter('toolFilter', toolFilter)
	.filter('seconds',secondsFilter)
	.directive('chipsterImage', chipsterImage)
	.directive('textVisualization', textVisualization)
	.directive('imageVisualization', imageVisualization)
	.directive('spreadsheetVisualization', spreadsheetVisualization)
	.directive('htmlVisualization', htmlVisualization)
	.directive('toolCircle', toolCircle)
	.directive('phenodataVisualization', phenodataVisualization)
	.directive('pdfVisualization', pdfVisualization)
	.directive('workflowGraph', workflowGraph)
    .config(RouteConfiguration)
	.run(ChipsterRun);


angular.module('chipster-web').config(
		function(flowFactoryProvider) {

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
			flowFactoryProvider.on('error', function(msg, file, chunk) {
				file.errorMessage = chunk.xhr.status + ' '
						+ chunk.xhr.statusText + ': ' + msg;
				file.errorMessageDetails = chunk.xhr.responseURL;
			});

		});

angular.bootstrap(document.documentElement, ['chipster-web']);