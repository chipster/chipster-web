import { NgModule } from "@angular/core";
import { ExpressionProfileService } from "./expressionprofile/expressionprofile.service";
import { ExpressionProfileTSVService } from "./expressionprofile/expressionprofileTSV.service";
import { VennDiagramComponent } from "./venndiagram/venndiagram";
import { VennDiagramService } from "./venndiagram/venndiagram.service";
import { TwoCircleVennDiagramService } from "./venndiagram/twocirclevenndiagram.service";
import { ThreeCircleVennDiagramService } from "./venndiagram/threecirclevenndiagram.service";
import { PdfVisualizationComponent } from "./pdf-visualization/pdf-visualization.component";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { HtmlvisualizationComponent } from "./htmlvisualization/htmlvisualization.component";
import { TextVisualizationComponent } from "./textvisualization/textvisualization.component";
import { SpreadsheetVisualizationComponent } from "./spreadsheet-visualization/spreadsheet-visualization.component";
import { ExpressionProfileComponent } from "./expressionprofile/expressionprofile.component";
import { ImageVisualizationComponent } from "./imagevisualization/imagevisualization.component";
import { PhenodataVisualizationComponent } from "./phenodata/phenodata-visualization.component";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../shared/shared.module";
import { VisualizationsComponent } from "./visualizations.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";
import { VisualizationModalComponent } from "./visualizationmodal.component";
import { VisualizationModalService } from "./visualizationmodal.service";
import { ScatterPlotComponent } from "./scatterplotvisualization/scatterplot.component";
import { VisualizationTSVService } from "../../../../shared/visualization/visualizationTSV.service";
import { PlotService } from "../../../../shared/visualization/plot.service";
import { LinkButtonModule } from "../link-button/link-button.module";
import { VolcanoPlotComponent } from "./volcanoplot/volcanoplot.component";
import { VolcanoPlotService } from "./volcanoplot/volcanoplot.service";
import { BamViewerComponent } from "./bamviewer/bamviewer.component";
import { GenomeBrowserComponent } from "./genome-browser/genome-browser.component";
import { DetailsVisualizationComponent } from "./details-visualization/details-visualization.component";
import { SingleDatasetComponent } from "../selectiondetails/singledataset/single-dataset.component";
import { DatasetParameterListComponent } from "../selectiondetails/dataset-parameter-list/dataset-parameter-list.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    SharedModule,
    LinkButtonModule,
    PdfViewerModule
  ],
  declarations: [
    VisualizationsComponent,
    VennDiagramComponent,
    PdfVisualizationComponent,
    HtmlvisualizationComponent,
    TextVisualizationComponent,
    VisualizationModalComponent,
    SpreadsheetVisualizationComponent,
    ExpressionProfileComponent,
    ImageVisualizationComponent,
    PhenodataVisualizationComponent,
    ScatterPlotComponent,
    VolcanoPlotComponent,
    BamViewerComponent,
    GenomeBrowserComponent,
    DetailsVisualizationComponent,
    SingleDatasetComponent,
    DatasetParameterListComponent
  ],
  providers: [
    ExpressionProfileTSVService,
    ExpressionProfileService,
    VennDiagramService,
    TwoCircleVennDiagramService,
    ThreeCircleVennDiagramService,
    VisualizationModalService,
    VisualizationTSVService,
    PlotService,
    VolcanoPlotService
  ],
  exports: [VisualizationsComponent, SingleDatasetComponent],
  entryComponents: [VisualizationModalComponent]
})
export class VisualizationsModule {}
