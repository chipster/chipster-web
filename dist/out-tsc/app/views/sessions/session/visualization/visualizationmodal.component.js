var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Dataset from "../../../../model/session/dataset";
export var VisualizationModalComponent = (function () {
    function VisualizationModalComponent(activeModal) {
        this.activeModal = activeModal;
    }
    __decorate([
        Input('dataset'), 
        __metadata('design:type', Dataset)
    ], VisualizationModalComponent.prototype, "dataset", void 0);
    __decorate([
        Input('visualizationId'), 
        __metadata('design:type', String)
    ], VisualizationModalComponent.prototype, "visualizationId", void 0);
    VisualizationModalComponent = __decorate([
        Component({
            selector: 'ch-visualizationmodal',
            templateUrl: './visualizationmodal.component.html'
        }), 
        __metadata('design:paramtypes', [NgbActiveModal])
    ], VisualizationModalComponent);
    return VisualizationModalComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/visualizationmodal.component.js.map