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
import { DatasetParameterListComponent } from "./dataset-parameter-list/dataset-parameter-list.component";
import { SingleDatasetComponent } from "./singledataset/singledataset.component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { SharedModule } from "../../../../shared/shared.module";
import { DatasetDetailsComponent } from "./datasetdetails/datasetdetails.component";
import { JobComponent } from "./job/job.component";
import { DatasetHistorymodalComponent } from './datasethistorymodal/datasethistorymodal.component';
import DatasetModalService from "./datasetmodal.service";
export var DatasetModule = (function () {
    function DatasetModule() {
    }
    DatasetModule = __decorate([
        NgModule({
            imports: [CommonModule, FormsModule, SharedModule],
            declarations: [DatasetDetailsComponent, DatasetParameterListComponent, SingleDatasetComponent, JobComponent, DatasetHistorymodalComponent],
            exports: [JobComponent, DatasetDetailsComponent, SingleDatasetComponent],
            providers: [DatasetModalService],
            entryComponents: [DatasetHistorymodalComponent]
        }), 
        __metadata('design:paramtypes', [])
    ], DatasetModule);
    return DatasetModule;
}());
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/views/sessions/session/selectiondetails/dataset.module.js.map