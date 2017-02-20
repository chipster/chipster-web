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
import { WorkflowGraphComponent } from "./workflowgraph/workflowgraph.component";
import { SharedModule } from "../../../../shared/shared.module";
import WorkflowGraphService from "./workflowgraph/workflowgraph.service";
import { LeftPanelComponent } from "./leftpanel.component";
import { FormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AddDatasetModalComponent } from "./adddatasetmodal/adddatasetmodal.component";
import { AddDatasetModalContent } from "./adddatasetmodal/adddatasetmodal.content";
import { SessionEditModalComponent } from "./sessioneditmodal/sessioneditmodal.component";
import UploadService from "../../../../shared/services/upload.service";
export var LeftPanelModule = (function () {
    function LeftPanelModule() {
    }
    LeftPanelModule = __decorate([
        NgModule({
            imports: [CommonModule, SharedModule, FormsModule, NgbModule],
            declarations: [WorkflowGraphComponent, LeftPanelComponent, AddDatasetModalComponent, AddDatasetModalContent, SessionEditModalComponent],
            providers: [WorkflowGraphService, UploadService],
            exports: [LeftPanelComponent, WorkflowGraphComponent],
            entryComponents: [AddDatasetModalContent]
        }), 
        __metadata('design:paramtypes', [])
    ], LeftPanelModule);
    return LeftPanelModule;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/leftpanel/leftpanel.module.js.map