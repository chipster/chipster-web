var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import Tool from "../../../../../model/session/tool";
import { ToolResource } from "../../../../../shared/resources/toolresource";
import { Component, Input } from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
var SourceModalComponent = (function () {
    function SourceModalComponent(ngbModal, toolResource) {
        this.ngbModal = ngbModal;
        this.toolResource = toolResource;
    }
    SourceModalComponent.prototype.open = function (content) {
        var _this = this;
        this.ngbModal.open(content, { size: "lg" });
        this.toolResource.getSourceCode(this.selectedTool.name.id).subscribe(function (sourceCode) {
            _this.source = sourceCode;
        });
    };
    __decorate([
        Input('module'), 
        __metadata('design:type', String)
    ], SourceModalComponent.prototype, "module", void 0);
    __decorate([
        Input('category'), 
        __metadata('design:type', String)
    ], SourceModalComponent.prototype, "category", void 0);
    __decorate([
        Input('selectedTool'), 
        __metadata('design:type', Tool)
    ], SourceModalComponent.prototype, "selectedTool", void 0);
    SourceModalComponent = __decorate([
        Component({
            selector: 'ch-sourcemodal',
            templateUrl: './sourcemodal.html',
        }), 
        __metadata('design:paramtypes', [NgbModal, ToolResource])
    ], SourceModalComponent);
    return SourceModalComponent;
}());
export default SourceModalComponent;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/sourcemodal/sourcemodal.component.js.map