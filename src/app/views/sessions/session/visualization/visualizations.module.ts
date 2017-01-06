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

@NgModule({
  imports: [CommonModule, SharedModule],
  declarations: [VennDiagram, PdfVisualizationComponent, PdfViewerComponent, HtmlvisualizationComponent, TextVisualizationComponent, SpreadsheetVisualizationComponent, ExpressionProfileComponent, ImageVisualizationComponent, PhenodataVisualizationComponent],
  providers: [ExpressionProfileTSVService, ExpressionProfileService, VennDiagramService, TwoCircleVennDiagramService, ThreeCircleVennDiagramService]
})
export class VisualizationsModule {}
