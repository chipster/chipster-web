import {NgModule} from "@angular/core";
import ExpressionProfileService from "./expressionprofile/expressionprofile.service";
import ExpressionProfileTSVService from "./expressionprofile/expressionprofileTSV.service";
import {VennDiagram} from "./venndiagram/venndiagram";
import VennDiagramService from "./venndiagram/venndiagram.service";
import TwoCircleVennDiagramService from "./venndiagram/twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./venndiagram/threecirclevenndiagram.service";
import {BrowserModule} from "@angular/platform-browser";
import {PdfVisualizationComponent} from './pdf-visualization/pdf-visualization.component';
import {PdfViewerComponent} from "ng2-pdf-viewer";
import {HtmlvisualizationComponent} from './htmlvisualization/htmlvisualization.component';
import {TrustedResourcePipe} from "../../../../pipes/trustedresource.pipe";
import {TextVisualizationComponent} from "./textvisualization/textvisualization.component";
import {BytesPipe} from "../../../../pipes/bytes.pipe";
import {SpreadsheetVisualizationComponent} from "./spreadsheetvisualization/spreadsheetvisualization.component";
import {ExpressionProfileComponent} from "./expressionprofile/expressionprofile";

@NgModule({
  imports: [BrowserModule],
  declarations: [VennDiagram, PdfVisualizationComponent, PdfViewerComponent, HtmlvisualizationComponent, TrustedResourcePipe, BytesPipe, TextVisualizationComponent, SpreadsheetVisualizationComponent, ExpressionProfileComponent],
  providers: [ExpressionProfileTSVService, ExpressionProfileService, VennDiagramService, TwoCircleVennDiagramService, ThreeCircleVennDiagramService]
})
export class VisualizationsModule {
}
