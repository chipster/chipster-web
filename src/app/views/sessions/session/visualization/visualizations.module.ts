import { NgModule } from "@angular/core";
import { PlotService } from "../../../../shared/visualization/plot.service";
import { VisualizationTSVService } from "../../../../shared/visualization/visualizationTSV.service";
import { ExpressionProfileTSVService } from "./expression-profile/expression-profile-TSV.service";
import { ExpressionProfileService } from "./expression-profile/expression-profile.service";
import { ThreeCircleVennDiagramService } from "./venn-diagram/three-circle-venn-diagram.service";
import { TwoCircleVennDiagramService } from "./venn-diagram/two-circle-venn-diagram.service";
import { VennDiagramService } from "./venn-diagram/venn-diagram.service";
import { VisualizationEventService } from "./visualization-event.service";
import { VisualizationModalService } from "./visualizationmodal.service";
import { VolcanoPlotService } from "./volcano-plot/volcano-plot.service";

@NgModule({
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
})
export class VisualizationsModule {}
