import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { SharedModule } from "../../../../shared/shared.module";
import { ManualModule } from "../../../manual/manual.module";
import { LinkButtonModule } from "../link-button/link-button.module";
import { CounterSpinnerComponent } from "./counter-spinner/counter-spinner.component";
import { FilterCompatibleDatasetsPipe } from "./filter-compatible-datasets.pipe";
import { JobListComponent } from "./job-list/job-list.component";
import { ParametersModalComponent } from "./parameters-modal/parameters-modal.component";
import { RunOptionsComponent } from "./run-options/run-options.component";
import { ScrollerComponent } from "./scroller/scroller.component";
import { ToolDetailsComponent } from "./tool-details/tool-details.component";
import { ToolInputsComponent } from "./tool-inputs/tool-inputs.component";
import { ToolListAccordionComponent } from "./tool-list/tool-list-accordion.component";
import { ToolListItemComponent } from "./tool-list/tool-list-item/tool-list-item.component";
import { ToolParametersComponent } from "./tool-parameters/tool-parameters.component";
import { ToolService } from "./tool.service";
import { ToolsComponent } from "./tools.component";
import { ToolResourcesComponent } from "./tool-resources/tool-resources.component";

@NgModule({
  imports: [CommonModule, SharedModule, FormsModule, NgbModule, ManualModule, LinkButtonModule, NgSelectModule],
  declarations: [
    ToolListItemComponent,
    ToolsComponent,
    ToolParametersComponent,
    ToolResourcesComponent,
    ToolInputsComponent,
    FilterCompatibleDatasetsPipe,
    ScrollerComponent,
    JobListComponent,
    ToolListAccordionComponent,
    ToolDetailsComponent,
    CounterSpinnerComponent,
    ParametersModalComponent,
    RunOptionsComponent,
  ],
  providers: [ToolService],
  exports: [ToolsComponent, ToolListAccordionComponent, ToolDetailsComponent, JobListComponent],
})
export class ToolsModule {}
