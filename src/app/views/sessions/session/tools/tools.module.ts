import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToolService} from "./tool.service";
import {ToolTitleComponent} from "./tooltitle.component";
import {ToolListItemComponent} from "./toolsmodal/tool-list-item/tool-list-item.component";
import {ToolBoxComponent} from "./toolbox.component";
import {ToolsModalComponent} from "./toolsmodal/toolsmodal.component";
import {SharedModule} from "../../../../shared/shared.module";
import {FormsModule} from "@angular/forms";
import { ToolsParameterFormComponent } from './toolsmodal/tools-parameter-form/tools-parameter-form.component';
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import { ToolSourceComponent } from './toolsmodal/tool-source/tool-source.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    NgbModule
  ],
  declarations: [ToolTitleComponent,  ToolListItemComponent, ToolBoxComponent, ToolsModalComponent, ToolsParameterFormComponent, ToolSourceComponent],
  providers: [ToolService],
  exports: [ToolBoxComponent]
})
export class ToolsModule { }
