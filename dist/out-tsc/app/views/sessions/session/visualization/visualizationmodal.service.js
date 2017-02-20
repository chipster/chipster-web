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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VisualizationModalComponent } from "./visualizationmodal.component";
var VisualizationModalService = (function () {
    function VisualizationModalService(ngbModal) {
        this.ngbModal = ngbModal;
    }
    VisualizationModalService.prototype.openVisualizationModal = function (dataset, visualizationId) {
        var modalRef = this.ngbModal.open(VisualizationModalComponent, { size: "lg" });
        modalRef.componentInstance.dataset = dataset;
        modalRef.componentInstance.visualizationId = visualizationId;
    };
    VisualizationModalService = __decorate([
        Injectable(), 
        __metadata('design:paramtypes', [NgbModal])
    ], VisualizationModalService);
    return VisualizationModalService;
}());
export default VisualizationModalService;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/visualizationmodal.service.js.map