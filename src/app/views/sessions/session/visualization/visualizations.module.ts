import {NgModule} from "@angular/core";
import ExpressionProfileService from "./expressionprofile/expressionprofile.service";
import {ExpressionProfileTSVService} from "./expressionprofile/expressionprofileTSV.service";
import {VennDiagram} from "./venndiagram/venndiagram";
import VennDiagramService from "./venndiagram/venndiagram.service";
import TwoCircleVennDiagramService from "./venndiagram/twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./venndiagram/threecirclevenndiagram.service";
import {PdfVisualizationComponent} from './pdf-visualization/pdf-visualization.component';
import {PdfViewerComponent} from "ng2-pdf-viewer";
import {HtmlvisualizationComponent} from './htmlvisualization/htmlvisualization.component';
import {TextVisualizationComponent} from "./textvisualization/textvisualization.component";
import {SpreadsheetVisualizationComponent} from "./spreadsheetvisualization/spreadsheetvisualization.component";
import {ExpressionProfileComponent} from "./expressionprofile/expressionprofile.component";
import {ImageVisualizationComponent} from "./imagevisualization/imagevisualization.component";
import {PhenodataVisualizationComponent} from "./phenodata/phenodatavisualization.component";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../../../shared/shared.module";
import {VisualizationsComponent} from "./visualizationbox.component";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { AddColumnModalComponent } from './phenodata/add-column-modal/add-column-modal.component';
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [CommonModule, FormsModule, NgbModule, SharedModule],
  declarations: [VisualizationsComponent, VennDiagram, PdfVisualizationComponent, PdfViewerComponent, HtmlvisualizationComponent, TextVisualizationComponent, SpreadsheetVisualizationComponent, ExpressionProfileComponent, ImageVisualizationComponent, PhenodataVisualizationComponent, AddColumnModalComponent],
  providers: [ExpressionProfileTSVService, ExpressionProfileService, VennDiagramService, TwoCircleVennDiagramService, ThreeCircleVennDiagramService],
  exports: [VisualizationsComponent]
})
export class VisualizationsModule {}
