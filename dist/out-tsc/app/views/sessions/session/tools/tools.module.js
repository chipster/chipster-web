var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolService } from "./tool.service";
import { ToolTitleComponent } from "./tooltitle.component";
import { ToolListItemComponent } from "./toolsmodal/tool-list-item/tool-list-item.component";
import { ToolBoxComponent } from "./toolbox.component";
import { ToolsModalComponent } from "./toolsmodal/toolsmodal.component";
import { SharedModule } from "../../../../shared/shared.module";
import { FormsModule } from "@angular/forms";
import { ToolsParameterFormComponent } from './toolsmodal/tools-parameter-form/tools-parameter-form.component';
import SourceModalComponent from "./sourcemodal/sourcemodal.component";
export var ToolsModule = (function () {
    function ToolsModule() {
    }
    ToolsModule = __decorate([
        NgModule({
            imports: [
                CommonModule,
                SharedModule,
                FormsModule
            ],
            declarations: [ToolTitleComponent, ToolListItemComponent, ToolBoxComponent, ToolsModalComponent, ToolsParameterFormComponent, SourceModalComponent],
            providers: [ToolService],
            exports: [ToolBoxComponent]
        }), 
        __metadata('design:paramtypes', [])
    ], ToolsModule);
    return ToolsModule;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/tools/tools.module.js.map