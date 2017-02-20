var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@angular/core";
import * as _ from 'lodash';
export var PipeService = (function () {
    function PipeService() {
    }
    PipeService.prototype.findTools = function (tools, searchWord) {
        return searchWord ? tools.filter(function (tool) { return tool.name.displayName.toLowerCase().indexOf(searchWord.toLowerCase()) !== -1; }) : tools;
    };
    PipeService.prototype.findDataset = function (datasets, searchWord) {
        return searchWord ? datasets.filter(function (item) { return item.name.toLowerCase().indexOf(searchWord.toLowerCase()) !== -1; }) : datasets;
    };
    /*
     * @description: find if tools-array contains a tool which name contains searchword given as parameter
     */
    PipeService.prototype.containingToolBySearchWord = function (tools, searchWord) {
        var lowerCaseSearchWord = searchWord.toLowerCase();
        return _.some(tools, function (tool) { return tool.name.displayName.toLowerCase().indexOf(lowerCaseSearchWord) >= 0; });
    };
    /*
     * @description: find categories containing at least one tool matching searchword
     */
    PipeService.prototype.findCategoriesContainingTool = function (categories, searchWord) {
        var _this = this;
        return searchWord ? categories.filter(function (category) { return _this.containingToolBySearchWord(category.tools, searchWord); }) : categories;
    };
    /*
     * @description: find modules containing at least one tool matching searchword
     */
    PipeService.prototype.findModulesContainingTool = function (modules, searchWord) {
        var _this = this;
        return searchWord ? modules.filter(function (module) { return _this.findCategoriesContainingTool(module.categories, searchWord).length > 0; }) : modules;
    };
    PipeService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [])
    ], PipeService);
    return PipeService;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/shared/services/pipeservice.service.js.map