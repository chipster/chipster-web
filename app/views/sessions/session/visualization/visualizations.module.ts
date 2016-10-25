
import {NgModule} from "@angular/core";
import ExpressionProfileService from "./expressionprofile/expressionprofile.service";
import ExpressionProfileTSVService from "./expressionprofile/expressionprofileTSV.service";
import {VennDiagram} from "./venndiagram/venndiagram";
import VennDiagramService from "./venndiagram/venndiagram.service";
import TwoCircleVennDiagramService from "./venndiagram/twocirclevenndiagram.service";
import ThreeCircleVennDiagramService from "./venndiagram/threecirclevenndiagram.service";

@NgModule({
    declarations: [ VennDiagram ],
    providers: [ ExpressionProfileTSVService, ExpressionProfileService, VennDiagramService, TwoCircleVennDiagramService, ThreeCircleVennDiagramService ]
})
export class VisualizationsModule {}