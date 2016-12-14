
import {NgModule} from "@angular/core";
import ExpressionProfileService from "./expressionprofile/expressionprofile.service";
import ExpressionProfileTSVService from "./expressionprofile/expressionprofileTSV.service";
import {VennDiagram} from "./venndiagram/venndiagram";
import VennDiagramService from "./venndiagram/venndiagram.service";
import TwoCircleVennDiagramService from "./venndiagram/twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./venndiagram/threecirclevenndiagram.service";
import {BrowserModule} from "@angular/platform-browser";
import { PdfVisualizationComponent } from './pdf-visualization/pdf-visualization.component';
import {PdfViewerComponent} from "ng2-pdf-viewer";

@NgModule({
    imports: [ BrowserModule ],
    declarations: [ VennDiagram, PdfVisualizationComponent, PdfViewerComponent ],
    providers: [ ExpressionProfileTSVService, ExpressionProfileService, VennDiagramService, TwoCircleVennDiagramService, ThreeCircleVennDiagramService ]
})
export class VisualizationsModule {}
