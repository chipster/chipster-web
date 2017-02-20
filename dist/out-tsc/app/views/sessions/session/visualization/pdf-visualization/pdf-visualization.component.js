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
import Dataset from "../../../../../model/session/dataset";
import SessionDataService from "../../sessiondata.service";
export var PdfVisualizationComponent = (function () {
    function PdfVisualizationComponent(sessionDataService) {
        this.sessionDataService = sessionDataService;
    }
    PdfVisualizationComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.page = 1;
        this.zoom = 1;
        this.sessionDataService.getDatasetUrl(this.dataset).subscribe(function (url) {
            _this.src = url;
        });
    };
    PdfVisualizationComponent.prototype.previousPage = function () {
        if (this.page > 0) {
            this.page -= 1;
        }
    };
    PdfVisualizationComponent.prototype.nextPage = function () {
        this.page += 1;
    };
    PdfVisualizationComponent.prototype.zoomIn = function () {
        this.zoom += 0.2;
    };
    PdfVisualizationComponent.prototype.zoomOut = function () {
        this.zoom -= 0.2;
    };
    __decorate([
        Input(), 
        __metadata('design:type', Dataset)
    ], PdfVisualizationComponent.prototype, "dataset", void 0);
    PdfVisualizationComponent = __decorate([
        Component({
            selector: 'ch-pdf-visualization',
            templateUrl: './pdf-visualization.component.html',
            styleUrls: ['./pdf-visualization.component.less'],
        }), 
        __metadata('design:paramtypes', [SessionDataService])
    ], PdfVisualizationComponent);
    return PdfVisualizationComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/pdf-visualization/pdf-visualization.component.js.map