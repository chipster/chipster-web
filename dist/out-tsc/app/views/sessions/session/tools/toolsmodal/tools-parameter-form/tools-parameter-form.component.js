var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import Tool from "../../../../../../model/session/tool";
import { ToolService } from "../../tool.service";
export var ToolsParameterFormComponent = (function () {
    function ToolsParameterFormComponent(toolService) {
        this.toolService = toolService;
        this.description = new EventEmitter();
    }
    ToolsParameterFormComponent.prototype.ngOnInit = function () { };
    ToolsParameterFormComponent.prototype.setDescription = function (description) {
        this.description.emit(description);
    };
    __decorate([
        Input(), 
        __metadata('design:type', Tool)
    ], ToolsParameterFormComponent.prototype, "tool", void 0);
    __decorate([
        Output(), 
        __metadata('design:type', EventEmitter)
    ], ToolsParameterFormComponent.prototype, "description", void 0);
    ToolsParameterFormComponent = __decorate([
        Component({
            selector: 'ch-tools-parameter-form',
            templateUrl: './tools-parameter-form.component.html',
            styleUrls: ['./tools-parameter-form.component.less']
        }), 
        __metadata('design:paramtypes', [ToolService])
    ], ToolsParameterFormComponent);
    return ToolsParameterFormComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/toolsmodal/tools-parameter-form/tools-parameter-form.component.js.map