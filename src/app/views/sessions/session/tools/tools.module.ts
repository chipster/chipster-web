import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToolService} from "./tool.service";
import {ToolListItemComponent} from "./dropdowns/tool-list/tool-list-item/tool-list-item.component";
import {ToolsComponent} from "./tools.component";
import {SharedModule} from "../../../../shared/shared.module";
import {FormsModule} from "@angular/forms";
import { ToolsParameterFormComponent } from './dropdowns/tools-parameter-form/tools-parameter-form.component';
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { ToolSourceComponent } from './dropdowns/tool-source/tool-source.component';
import { ToolInputsComponent } from './dropdowns/tool-inputs/tool-inputs.component';
import { FilterCompatibleDatasetsPipe } from './filter-compatible-datasets.pipe';
import {ManualModule} from "../../../manual/manual.module";
import {ToolListComponent} from "./dropdowns/tool-list/tool-list.component";
import {ScrollerComponent} from "./scroller/scroller.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    NgbModule,
    ManualModule
  ],
  declarations: [
    ToolListItemComponent,
    ToolsComponent,
    ToolsParameterFormComponent,
    ToolSourceComponent,
    ToolInputsComponent,
    FilterCompatibleDatasetsPipe,
    ToolListComponent,
    ScrollerComponent,
  ],
  providers: [ToolService],
  exports: [ToolsComponent]
})
export class ToolsModule { }
