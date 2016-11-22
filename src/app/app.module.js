"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var platform_browser_1 = require("@angular/platform-browser");
var http_1 = require("@angular/http");
var configurationresource_1 = require("./resources/configurationresource");
var navigation_component_1 = require("./views/navigation/navigation.component");
var forms_1 = require("@angular/forms");
var login_component_1 = require("./views/login/login.component");
var selection_service_1 = require("./views/sessions/session/selection.service");
var config_service_1 = require("./services/config.service");
var authentication_module_1 = require("./authentication/authentication.module");
var TSVReader_1 = require("./services/TSVReader");
var visualizations_module_1 = require("./views/sessions/session/visualization/visualizations.module");
var AppModule = (function () {
    function AppModule() {
    }
    return AppModule;
}());
AppModule = __decorate([
    core_1.NgModule({
        imports: [platform_browser_1.BrowserModule, http_1.HttpModule, forms_1.FormsModule, authentication_module_1.AuthenticationModule, visualizations_module_1.VisualizationsModule],
        declarations: [navigation_component_1.NavigationComponent, login_component_1.LoginComponent],
        providers: [configurationresource_1.default, selection_service_1.default, config_service_1.default, TSVReader_1.TSVReader]
    }),
    __metadata("design:paramtypes", [])
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map