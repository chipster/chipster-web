import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToolService} from "./tool.service";
import {ToolTitleComponent} from "./tooltitle.component";
import {ToolListItemComponent} from "./toolsmodal/tool-list-item/tool-list-item.component";
import {ToolBoxComponent} from "./toolbox.component";
import {ToolsModalComponent} from "./toolsmodal/toolsmodal.component";
import {SharedModule} from "../../../../shared/shared.module";
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FormsModule
  ],
  declarations: [ToolTitleComponent,  ToolListItemComponent, ToolBoxComponent, ToolsModalComponent],
  providers: [ToolService],
  exports: [ToolBoxComponent]
})
export class ToolsModule { }
