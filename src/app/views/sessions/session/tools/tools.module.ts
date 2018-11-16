import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ToolService } from "./tool.service";
import { ToolListItemComponent } from "./tool-list/tool-list-item/tool-list-item.component";
import { ToolsComponent } from "./tools.component";
import { SharedModule } from "../../../../shared/shared.module";
import { FormsModule } from "@angular/forms";
import { ToolParametersComponent } from "./tool-parameters/tool-parameters.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ToolInputsComponent } from "./tool-inputs/tool-inputs.component";
import { FilterCompatibleDatasetsPipe } from "./filter-compatible-datasets.pipe";
import { ManualModule } from "../../../manual/manual.module";
import { ScrollerComponent } from "./scroller/scroller.component";
import { JobListComponent } from "./job-list/job-list.component";
import { ToolListAccordionComponent } from "./tool-list/tool-list-accordion.component";
import { ToolDetailsComponent } from "./tool-details/tool-details.component";
import { NgSelectModule } from "@ng-select/ng-select";
import { CounterSpinnerComponent } from "./counter-spinner/counter-spinner.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    NgbModule,
    ManualModule,
    NgSelectModule
  ],
  declarations: [
    ToolListItemComponent,
    ToolsComponent,
    ToolParametersComponent,
    ToolInputsComponent,
    FilterCompatibleDatasetsPipe,
    ScrollerComponent,
    JobListComponent,
    ToolListAccordionComponent,
    ToolDetailsComponent,
    CounterSpinnerComponent
  ],
  providers: [ToolService],
  exports: [ToolsComponent, ToolListAccordionComponent, ToolDetailsComponent]
})
export class ToolsModule {}
