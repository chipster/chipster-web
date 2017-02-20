var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input } from "@angular/core";
import SessionDataService from "../../sessiondata.service";
import Dataset from "../../../../../model/session/dataset";
export var ImageVisualizationComponent = (function () {
    function ImageVisualizationComponent(sessionDataService) {
        this.sessionDataService = sessionDataService;
    }
    ImageVisualizationComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.sessionDataService.getDatasetUrl(this.dataset).subscribe(function (url) {
            _this.src = url;
        });
    };
    __decorate([
        Input(), 
        __metadata('design:type', Dataset)
    ], ImageVisualizationComponent.prototype, "dataset", void 0);
    ImageVisualizationComponent = __decorate([
        Component({
            selector: 'ch-image-visualization',
            template: "\n      <div class=\"scrollable\"><img [src]=\"src\"></div>\n  "
        }), 
        __metadata('design:paramtypes', [SessionDataService])
    ], ImageVisualizationComponent);
    return ImageVisualizationComponent;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/imagevisualization/imagevisualization.component.js.map