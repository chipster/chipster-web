import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToolService} from "./tool.service";
import {ToolListItemComponent} from "./tool-list/tool-list-item/tool-list-item.component";
import {ToolsComponent} from "./tools.component";
import {SharedModule} from "../../../../shared/shared.module";
import {FormsModule} from "@angular/forms";
import { ToolParametersComponent } from './tool-parameters/tool-parameters';
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { ToolSourceComponent } from './tool-source/tool-source.component';
import { ToolInputsComponent } from './tool-inputs/tool-inputs.component';
import { FilterCompatibleDatasetsPipe } from './filter-compatible-datasets.pipe';
import {ManualModule} from "../../../manual/manual.module";
import {ToolListComponent} from "./tool-list/tool-list.component";
import {ScrollerComponent} from "./scroller/scroller.component";
import {JobListComponent} from "./job-list/job-list.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    NgbModule,
    ManualModule,
  ],
  declarations: [
    ToolListItemComponent,
    ToolsComponent,
    ToolParametersComponent,
    ToolSourceComponent,
    ToolInputsComponent,
    FilterCompatibleDatasetsPipe,
    ToolListComponent,
    ScrollerComponent,
    JobListComponent,
  ],
  providers: [ToolService],
  exports: [ToolsComponent]
})
export class ToolsModule { }
