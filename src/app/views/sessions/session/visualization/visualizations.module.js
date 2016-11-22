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
var expressionprofile_service_1 = require("./expressionprofile/expressionprofile.service");
var expressionprofileTSV_service_1 = require("./expressionprofile/expressionprofileTSV.service");
var venndiagram_1 = require("./venndiagram/venndiagram");
var venndiagram_service_1 = require("./venndiagram/venndiagram.service");
var twocirclevenndiagram_service_1 = require("./venndiagram/twocirclevenndiagram.service");
var threecirclevenndiagram_service_1 = require("./venndiagram/threecirclevenndiagram.service");
var platform_browser_1 = require("@angular/platform-browser");
var VisualizationsModule = (function () {
    function VisualizationsModule() {
    }
    return VisualizationsModule;
}());
VisualizationsModule = __decorate([
    core_1.NgModule({
        imports: [platform_browser_1.BrowserModule],
        declarations: [venndiagram_1.VennDiagram],
        providers: [expressionprofileTSV_service_1.default, expressionprofile_service_1.default, venndiagram_service_1.default, twocirclevenndiagram_service_1.default, threecirclevenndiagram_service_1.default]
    }),
    __metadata("design:paramtypes", [])
], VisualizationsModule);
exports.VisualizationsModule = VisualizationsModule;
//# sourceMappingURL=visualizations.module.js.map