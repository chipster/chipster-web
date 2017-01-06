import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ToolService} from "./tool.service";
import {ToolTitleComponent} from "./tooltitle.component";
import {ToolListItemComponent} from "./toolsmodal/tool-list-item/tool-list-item.component";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ToolTitleComponent,  ToolListItemComponent],
  providers: [ToolService]
})
export class ToolsModule { }
