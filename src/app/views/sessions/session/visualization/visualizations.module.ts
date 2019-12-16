import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { PdfViewerModule } from "ng2-pdf-viewer";
import { SharedModule } from "../../../../shared/shared.module";
import { PlotService } from "../../../../shared/visualization/plot.service";
import { VisualizationTSVService } from "../../../../shared/visualization/visualizationTSV.service";
import { LinkButtonModule } from "../link-button/link-button.module";
import { DatasetParameterListComponent } from "../selectiondetails/dataset-parameter-list/dataset-parameter-list.component";
import { SingleDatasetComponent } from "../selectiondetails/singledataset/single-dataset.component";
import { BamViewerComponent } from "./bam-viewer/bam-viewer.component";
import { DetailsVisualizationComponent } from "./details-visualization/details-visualization.component";
import { ExpressionProfileComponent } from "./expressionprofile/expressionprofile.component";
import { ExpressionProfileService } from "./expressionprofile/expressionprofile.service";
import { ExpressionProfileTSVService } from "./expressionprofile/expressionprofileTSV.service";
import { GenomeBrowserComponent } from "./genome-browser/genome-browser.component";
import { HtmlvisualizationComponent } from "./htmlvisualization/htmlvisualization.component";
import { ImageVisualizationComponent } from "./imagevisualization/imagevisualization.component";
import { PdfVisualizationComponent } from "./pdf-visualization/pdf-visualization.component";
import { PhenodataVisualizationComponent } from "./phenodata/phenodata-visualization.component";
import { ScatterPlotComponent } from "./scatterplotvisualization/scatterplot.component";
import { SpreadsheetVisualizationComponent } from "./spreadsheet-visualization/spreadsheet-visualization.component";
import { TextVisualizationComponent } from "./textvisualization/textvisualization.component";
import { ThreeCircleVennDiagramService } from "./venndiagram/threecirclevenndiagram.service";
import { TwoCircleVennDiagramService } from "./venndiagram/twocirclevenndiagram.service";
import { VennDiagramComponent } from "./venndiagram/venndiagram";
import { VennDiagramService } from "./venndiagram/venndiagram.service";
import { VisualizationEventService } from "./visualization-event.service";
import { VisualizationModalComponent } from "./visualizationmodal.component";
import { VisualizationModalService } from "./visualizationmodal.service";
import { VisualizationsComponent } from "./visualizations.component";
import { VolcanoPlotComponent } from "./volcanoplot/volcanoplot.component";
import { VolcanoPlotService } from "./volcanoplot/volcanoplot.service";

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
    VolcanoPlotService,
    VisualizationEventService
  ],
  exports: [VisualizationsComponent, SingleDatasetComponent],
  entryComponents: [VisualizationModalComponent]
})
export class VisualizationsModule {}
