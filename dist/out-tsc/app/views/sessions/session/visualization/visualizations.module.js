var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { NgModule } from "@angular/core";
import ExpressionProfileService from "./expressionprofile/expressionprofile.service";
import { ExpressionProfileTSVService } from "./expressionprofile/expressionprofileTSV.service";
import { VennDiagram } from "./venndiagram/venndiagram";
import VennDiagramService from "./venndiagram/venndiagram.service";
import TwoCircleVennDiagramService from "./venndiagram/twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./venndiagram/threecirclevenndiagram.service";
import { PdfVisualizationComponent } from './pdf-visualization/pdf-visualization.component';
import { PdfViewerComponent } from "ng2-pdf-viewer";
import { HtmlvisualizationComponent } from './htmlvisualization/htmlvisualization.component';
import { TextVisualizationComponent } from "./textvisualization/textvisualization.component";
import { SpreadsheetVisualizationComponent } from "./spreadsheetvisualization/spreadsheetvisualization.component";
import { ExpressionProfileComponent } from "./expressionprofile/expressionprofile.component";
import { ImageVisualizationComponent } from "./imagevisualization/imagevisualization.component";
import { PhenodataVisualizationComponent } from "./phenodata/phenodatavisualization.component";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../shared/shared.module";
import { VisualizationsComponent } from "./visualizationbox.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AddColumnModalComponent } from './phenodata/add-column-modal/add-column-modal.component';
import { FormsModule } from "@angular/forms";
import { VisualizationModalComponent } from "./visualizationmodal.component";
import VisualizationModalService from "./visualizationmodal.service";
export var VisualizationsModule = (function () {
    function VisualizationsModule() {
    }
    VisualizationsModule = __decorate([
        NgModule({
            imports: [CommonModule, FormsModule, NgbModule, SharedModule],
            declarations: [VisualizationsComponent, VennDiagram, PdfVisualizationComponent, PdfViewerComponent, HtmlvisualizationComponent, TextVisualizationComponent, VisualizationModalComponent, SpreadsheetVisualizationComponent, ExpressionProfileComponent, ImageVisualizationComponent, PhenodataVisualizationComponent, AddColumnModalComponent],
            providers: [ExpressionProfileTSVService, ExpressionProfileService, VennDiagramService, TwoCircleVennDiagramService, ThreeCircleVennDiagramService, VisualizationModalService],
            exports: [VisualizationsComponent],
            entryComponents: [VisualizationModalComponent]
        }), 
        __metadata('design:paramtypes', [])
    ], VisualizationsModule);
    return VisualizationsModule;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/visualization/visualizations.module.js.map