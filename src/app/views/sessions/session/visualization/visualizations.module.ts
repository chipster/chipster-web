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
import { ExpressionProfileTSVService } from "./expression-profile/expression-profile-TSV.service";
import { ExpressionProfileComponent } from "./expression-profile/expression-profile.component";
import { ExpressionProfileService } from "./expression-profile/expression-profile.service";
import { HtmlvisualizationComponent } from "./html-visualization/html-visualization.component";
import { ImageVisualizationComponent } from "./image-visualization/image-visualization.component";
import { NewTabVisualizationComponent } from "./new-tab-visualization/new-tab-visualization.component";
import { PdfVisualizationComponent } from "./pdf-visualization/pdf-visualization.component";
import { PhenodataVisualizationComponent } from "./phenodata/phenodata-visualization.component";
import { ScatterPlotComponent } from "./scatter-plot/scatter-plot.component";
import { SpreadsheetVisualizationComponent } from "./spreadsheet-visualization/spreadsheet-visualization.component";
import { TextVisualizationComponent } from "./text-visualization/text-visualization.component";
import { ThreeCircleVennDiagramService } from "./venn-diagram/three-circle-venn-diagram.service";
import { TwoCircleVennDiagramService } from "./venn-diagram/two-circle-venn-diagram.service";
import { VennDiagramComponent } from "./venn-diagram/venn-diagram.component";
import { VennDiagramService } from "./venn-diagram/venn-diagram.service";
import { VisualizationEventService } from "./visualization-event.service";
import { VisualizationModalComponent } from "./visualizationmodal.component";
import { VisualizationModalService } from "./visualizationmodal.service";
import { VisualizationsComponent } from "./visualizations.component";
import { VolcanoPlotComponent } from "./volcano-plot/volcano-plot.component";
import { VolcanoPlotService } from "./volcano-plot/volcano-plot.service";

@NgModule({
  imports: [CommonModule, FormsModule, NgbModule, SharedModule, LinkButtonModule, PdfViewerModule],
  declarations: [
    VisualizationsComponent,
    VennDiagramComponent,
    PdfVisualizationComponent,
    NewTabVisualizationComponent,
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
    DetailsVisualizationComponent,
    SingleDatasetComponent,
    DatasetParameterListComponent,
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
    VisualizationEventService,
  ],
  exports: [VisualizationsComponent, SingleDatasetComponent, DatasetParameterListComponent],
})
export class VisualizationsModule {}
